import { Response } from 'express';
import mongoose from 'mongoose';
import Task from '../../models/pm/Task';
import Project from '../../models/pm/Project';
import Workflow from '../../models/pm/Workflow';
import workflowService from '../../services/pm/workflow.service';
import { PMAuthRequest, ApiResponse, TaskType, TaskPriority } from '../../types/pm';
import * as permissions from '../../utils/pm/permissions';
import logger from '../../utils/logger';

// Valid enum values
const VALID_TYPES = ['epic', 'story', 'task', 'bug', 'subtask'];
const VALID_PRIORITIES = ['critical', 'high', 'medium', 'low'];

interface CSVRow {
  title?: string;
  type?: string;
  priority?: string;
  description?: string;
  storyPoints?: string;
  labels?: string;
  dueDate?: string;
  assignee?: string;
  epic?: string;
}

interface ImportError {
  row: number;
  field?: string;
  message: string;
}

/**
 * Parse a CSV string into an array of objects using the header row as keys.
 * Handles quoted fields with commas and newlines.
 */
function parseCSV(content: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (ch === '"') {
      if (inQuotes && content[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (current.trim()) lines.push(current);
      current = '';
      // skip \r\n
      if (ch === '\r' && content[i + 1] === '\n') i++;
    } else {
      current += ch;
    }
  }
  if (current.trim()) lines.push(current);

  if (lines.length === 0) return { headers: [], rows: [] };

  // Parse a single line into fields
  function parseLine(line: string): string[] {
    const fields: string[] = [];
    let field = '';
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (quoted && line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = !quoted;
        }
      } else if (ch === ',' && !quoted) {
        fields.push(field.trim());
        field = '';
      } else {
        field += ch;
      }
    }
    fields.push(field.trim());
    return fields;
  }

  const headers = parseLine(lines[0]).map(h => h.replace(/^["']|["']$/g, '').trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] || '').replace(/^["']|["']$/g, '').trim();
    });
    rows.push(row);
  }

  return { headers, rows };
}

/**
 * Normalize header names to our expected field names.
 * Handles variations like "Story Points", "story_points", "StoryPoints", etc.
 */
function normalizeHeader(header: string): string {
  const lower = header.toLowerCase().replace(/[\s_-]+/g, '');
  const mapping: Record<string, string> = {
    title: 'title',
    summary: 'title',
    type: 'type',
    issuetype: 'type',
    priority: 'priority',
    description: 'description',
    storypoints: 'storyPoints',
    points: 'storyPoints',
    labels: 'labels',
    tags: 'labels',
    duedate: 'dueDate',
    due: 'dueDate',
    deadline: 'dueDate',
    assignee: 'assignee',
    assignedto: 'assignee',
    owner: 'assignee',
    epicname: 'epic',
    epiclink: 'epic',
    epic: 'epic',
  };
  return mapping[lower] || header;
}

export const importTasksFromCSV = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { projectId } = req.params;

    if (!req.file) {
      res.status(400).json({ success: false, error: 'No CSV file uploaded' } as ApiResponse);
      return;
    }

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ success: false, error: 'Project not found' } as ApiResponse);
      return;
    }

    // Check permission
    if (!userId || !permissions.canCreateTask(project.members, userId)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions to import tasks.',
      } as ApiResponse);
      return;
    }

    // Parse CSV from buffer
    const csvContent = req.file.buffer.toString('utf-8');
    const { headers, rows } = parseCSV(csvContent);

    if (rows.length === 0) {
      res.status(400).json({ success: false, error: 'CSV file is empty or has no data rows' } as ApiResponse);
      return;
    }

    // Normalize headers
    const headerMap: Record<string, string> = {};
    headers.forEach(h => {
      headerMap[h] = normalizeHeader(h);
    });

    // Get organization, workflow, initial status
    const organizationId = project.organizationId?.toString() || 'default-org';
    const workflow = await workflowService.getOrCreateDefaultWorkflow(
      organizationId,
      project.methodology.code,
      userId!
    );
    const initialStatus = workflowService.getInitialStatus(workflow);

    // Build member email → userId map for assignee resolution
    const memberUserIds = project.members.map(m => m.userId);
    const User = mongoose.model('User');
    const users = await User.find({ _id: { $in: memberUserIds } }, 'email profile.firstName profile.lastName').lean();
    const emailToUserId: Record<string, string> = {};
    for (const u of users as Array<{ _id: mongoose.Types.ObjectId; email?: string }>) {
      if (u.email) {
        emailToUserId[u.email.toLowerCase()] = u._id.toString();
      }
    }

    // Build epic name → epicId map (pre-existing epics in the project)
    const existingEpics = await Task.find({ projectId, type: 'epic' }, 'title').lean();
    const epicNameToId: Record<string, string> = {};
    for (const e of existingEpics) {
      epicNameToId[e.title.toLowerCase().trim()] = e._id.toString();
    }

    // Get next task number
    const lastTask = await Task.findOne({ projectId }).sort({ number: -1 });
    let nextNumber = (lastTask?.number || 0) + 1;

    const imported: string[] = [];
    const skipped: { row: number; reason: string }[] = [];
    const errors: ImportError[] = [];

    // Pre-process all rows: normalize headers and determine type
    interface NormalizedRow {
      rowNum: number;
      row: CSVRow;
    }
    const normalizedRows: NormalizedRow[] = [];
    for (let i = 0; i < rows.length; i++) {
      const rawRow = rows[i];
      const rowNum = i + 2; // +2 because row 1 is header, data starts at row 2
      const row: CSVRow = {};
      for (const [originalHeader, value] of Object.entries(rawRow)) {
        const normalizedKey = headerMap[originalHeader] || originalHeader;
        (row as Record<string, string>)[normalizedKey] = value;
      }
      normalizedRows.push({ rowNum, row });
    }

    // Helper to create a task from a normalized row
    const createTask = async (
      { rowNum, row }: NormalizedRow,
      resolveEpic: boolean
    ): Promise<boolean> => {
      // Validate required: title
      if (!row.title || !row.title.trim()) {
        skipped.push({ row: rowNum, reason: 'Missing title' });
        return false;
      }

      const title = row.title.trim().substring(0, 500);

      // Type
      let type = TaskType.TASK;
      if (row.type) {
        const normalizedType = row.type.toLowerCase().trim();
        if (VALID_TYPES.includes(normalizedType)) {
          type = normalizedType as TaskType;
        } else {
          errors.push({ row: rowNum, field: 'type', message: `Invalid type "${row.type}", defaulting to "task"` });
        }
      }

      // Priority
      let priority = TaskPriority.MEDIUM;
      if (row.priority) {
        const normalizedPriority = row.priority.toLowerCase().trim();
        if (VALID_PRIORITIES.includes(normalizedPriority)) {
          priority = normalizedPriority as TaskPriority;
        } else {
          errors.push({ row: rowNum, field: 'priority', message: `Invalid priority "${row.priority}", defaulting to "medium"` });
        }
      }

      // Story Points
      let storyPoints: number | undefined;
      if (row.storyPoints && row.storyPoints.trim()) {
        const parsed = Number(row.storyPoints);
        if (!isNaN(parsed) && parsed >= 0) {
          storyPoints = parsed;
        } else {
          errors.push({ row: rowNum, field: 'storyPoints', message: `Invalid story points "${row.storyPoints}", skipping field` });
        }
      }

      // Labels
      let labels: string[] = [];
      if (row.labels && row.labels.trim()) {
        labels = row.labels.split(/[,;]/).map(l => l.trim()).filter(Boolean);
      }

      // Due Date
      let dueDate: Date | undefined;
      if (row.dueDate && row.dueDate.trim()) {
        const parsed = new Date(row.dueDate.trim());
        if (!isNaN(parsed.getTime())) {
          dueDate = parsed;
        } else {
          errors.push({ row: rowNum, field: 'dueDate', message: `Invalid date "${row.dueDate}", skipping field` });
        }
      }

      // Assignee (match by email)
      let assignee: string | undefined;
      if (row.assignee && row.assignee.trim()) {
        const email = row.assignee.trim().toLowerCase();
        if (emailToUserId[email]) {
          assignee = emailToUserId[email];
        } else {
          errors.push({ row: rowNum, field: 'assignee', message: `Assignee "${row.assignee}" not found in project members, skipping field` });
        }
      }

      // Epic (match by name — only for non-epic rows in pass 2)
      let epicId: string | undefined;
      if (resolveEpic && row.epic && row.epic.trim()) {
        const epicName = row.epic.trim().toLowerCase();
        if (epicNameToId[epicName]) {
          epicId = epicNameToId[epicName];
        } else {
          errors.push({ row: rowNum, field: 'epic', message: `Epic "${row.epic}" not found in project, skipping field` });
        }
      }

      // Create the task
      const taskKey = `${project.key}-${nextNumber}`;
      const task = new Task({
        projectId,
        organizationId,
        key: taskKey,
        number: nextNumber,
        type,
        title,
        description: row.description || undefined,
        status: {
          id: initialStatus.id,
          name: initialStatus.name,
          category: initialStatus.category,
        },
        priority,
        assignee: assignee || undefined,
        reporter: userId,
        labels,
        components: [],
        storyPoints,
        dueDate,
        epicId: epicId || undefined,
        workflowHistory: [
          {
            fromStatus: '',
            toStatus: initialStatus.id,
            changedBy: userId,
            changedAt: new Date(),
            comment: 'Imported from CSV',
          },
        ],
        createdBy: userId,
      });

      await task.save();
      imported.push(taskKey);

      // If this is an epic, register it so later rows can reference it
      if (type === TaskType.EPIC) {
        epicNameToId[title.toLowerCase()] = task._id.toString();
      }

      nextNumber++;
      return true;
    };

    // Pass 1: Create epic-type rows first so they exist for linking
    const epicRowIndices = new Set<number>();
    for (let i = 0; i < normalizedRows.length; i++) {
      const { row } = normalizedRows[i];
      const rowType = row.type?.toLowerCase().trim();
      if (rowType === 'epic') {
        epicRowIndices.add(i);
        await createTask(normalizedRows[i], false);
      }
    }

    // Pass 2: Create all remaining rows with epic resolution enabled
    for (let i = 0; i < normalizedRows.length; i++) {
      if (epicRowIndices.has(i)) continue;
      await createTask(normalizedRows[i], true);
    }

    res.status(200).json({
      success: true,
      data: {
        imported: imported.length,
        skipped: skipped.length,
        warnings: errors.length,
        importedKeys: imported,
        skippedRows: skipped,
        errors,
        total: rows.length,
      },
    } as ApiResponse);
  } catch (error) {
    logger.error('CSV import error:', error);
    res.status(500).json({ success: false, error: 'CSV import failed' } as ApiResponse);
  }
};
