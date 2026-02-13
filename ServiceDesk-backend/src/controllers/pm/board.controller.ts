import { Response } from 'express';
import logger from '../../utils/logger';
import { validationResult } from 'express-validator';
import PMBoard from '../../models/pm/Board';
import Project from '../../models/pm/Project';
import Sprint from '../../models/pm/Sprint';
import Task from '../../models/pm/Task';
import Workflow from '../../models/pm/Workflow';
import { PMAuthRequest as Request, ApiResponse } from '../../types/pm';

interface PopulatedMember {
  userId: {
    _id: string;
    name?: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      avatar?: string;
    };
  };
  role: string;
}

export const getBoardByProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      res.status(400).json({
        success: false,
        error: 'Organization context required',
      } as ApiResponse);
      return;
    }

    let board = await PMBoard.findOne({ projectId, isDefault: true });

    if (!board) {
      const userId = req.user?.id;
      
      board = new PMBoard({
        projectId,
        organizationId,
        name: 'Default Board',
        type: 'scrum',
        methodology: 'scrum',
        columns: [
          { id: 'backlog', name: 'Backlog', statusId: 'backlog', order: 0 },
          { id: 'ready', name: 'Ready', statusId: 'ready', order: 1 },
          { id: 'in-progress', name: 'In Progress', statusId: 'in-progress', order: 2 },
          { id: 'in-review', name: 'In Review', statusId: 'in-review', order: 3 },
          { id: 'done', name: 'Done', statusId: 'done', order: 4 },
        ],
        swimlanes: [],
        settings: {
          showSubtasks: true,
          showEpics: true,
          cardFields: ['assignee', 'priority', 'storyPoints'],
          quickFilters: [],
        },
        isDefault: true,
        createdBy: userId,
      });

      await board.save();
    }

    res.status(200).json({
      success: true,
      data: { board },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get board error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get board',
    } as ApiResponse);
  }
};

export const createColumn = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array().map((e: { type?: string; msg: string }) => ({ field: e.type, message: e.msg })),
      } as ApiResponse);
      return;
    }

    const { projectId } = req.params;
    const { name, statusId, wipLimit } = req.body;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      res.status(400).json({
        success: false,
        error: 'Organization context required',
      } as ApiResponse);
      return;
    }

    const board = await PMBoard.findOne({ projectId, isDefault: true });

    if (!board) {
      res.status(404).json({
        success: false,
        error: 'Board not found',
      } as ApiResponse);
      return;
    }

    const maxOrder = board.columns.reduce((max, col) => Math.max(max, col.order), -1);
    const columnId = `col-${Date.now()}`;

    board.columns.push({
      id: columnId,
      name,
      statusId: statusId || columnId,
      wipLimit,
      order: maxOrder + 1,
    });

    await board.save();

    res.status(201).json({
      success: true,
      data: { board },
    } as ApiResponse);
  } catch (error) {
    logger.error('Create column error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create column',
    } as ApiResponse);
  }
};

export const updateColumn = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array().map((e: { type?: string; msg: string }) => ({ field: e.type, message: e.msg })),
      } as ApiResponse);
      return;
    }

    const { projectId, columnId } = req.params;
    const { name, wipLimit } = req.body;

    const board = await PMBoard.findOne({ projectId, isDefault: true });

    if (!board) {
      res.status(404).json({
        success: false,
        error: 'Board not found',
      } as ApiResponse);
      return;
    }

    const column = board.columns.find(col => col.id === columnId);

    if (!column) {
      res.status(404).json({
        success: false,
        error: 'Column not found',
      } as ApiResponse);
      return;
    }

    if (name) column.name = name;
    if (wipLimit !== undefined) column.wipLimit = wipLimit;

    await board.save();

    res.status(200).json({
      success: true,
      data: { board },
    } as ApiResponse);
  } catch (error) {
    logger.error('Update column error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update column',
    } as ApiResponse);
  }
};

export const deleteColumn = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, columnId } = req.params;

    const board = await PMBoard.findOne({ projectId, isDefault: true });

    if (!board) {
      res.status(404).json({
        success: false,
        error: 'Board not found',
      } as ApiResponse);
      return;
    }

    const columnIndex = board.columns.findIndex(col => col.id === columnId);

    if (columnIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Column not found',
      } as ApiResponse);
      return;
    }

    board.columns.splice(columnIndex, 1);
    
    board.columns.forEach((col, index) => {
      col.order = index;
    });

    await board.save();

    res.status(200).json({
      success: true,
      data: { board },
    } as ApiResponse);
  } catch (error) {
    logger.error('Delete column error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete column',
    } as ApiResponse);
  }
};

export const getProjectMembers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId)
      .populate('members.userId', 'profile.firstName profile.lastName profile.avatar email name');

    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
      return;
    }

    const members = (project.members as unknown as PopulatedMember[]).map((m) => ({
      _id: m.userId?._id || m.userId,
      name: m.userId?.name || `${m.userId?.profile?.firstName || ''} ${m.userId?.profile?.lastName || ''}`.trim() || m.userId?.email,
      email: m.userId?.email,
      avatar: m.userId?.profile?.avatar,
      role: m.role,
    }));

    res.status(200).json({
      success: true,
      data: { members },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get project members error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get project members',
    } as ApiResponse);
  }
};

export const getFullBoard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;

    // Get project to find organizationId
    const project = await Project.findById(projectId);
    const organizationId = project?.organizationId || req.user?.organizationId;

    // Fetch the project's workflow (source of truth for statuses/columns)
    const workflowQuery: Record<string, unknown>[] = [{ projectId }];
    if (organizationId) {
      workflowQuery.push({ organizationId, isDefault: true });
    }
    const workflow = await Workflow.findOne({ $or: workflowQuery }).sort({ projectId: -1 });

    // Build columns from workflow statuses (source of truth)
    const defaultColumns = [
      { id: 'backlog', name: 'Backlog', statusId: 'backlog', order: 0, wipLimit: 0 },
      { id: 'ready', name: 'Ready', statusId: 'ready', order: 1, wipLimit: 0 },
      { id: 'in-progress', name: 'In Progress', statusId: 'in-progress', order: 2, wipLimit: 0 },
      { id: 'in-review', name: 'In Review', statusId: 'in-review', order: 3, wipLimit: 0 },
      { id: 'done', name: 'Done', statusId: 'done', order: 4, wipLimit: 0 },
    ];

    const workflowColumns = workflow && workflow.statuses.length > 0
      ? workflow.statuses
          .sort((a, b) => a.order - b.order)
          .map((s, idx) => ({
            id: s.id,
            name: s.name,
            statusId: s.id,
            order: idx,
            wipLimit: 0,
          }))
      : defaultColumns;

    // Get or create board, always sync columns with workflow
    let board = await PMBoard.findOne({ projectId, isDefault: true });
    if (!board && organizationId) {
      board = new PMBoard({
        projectId,
        organizationId,
        name: 'Default Board',
        type: 'scrum',
        methodology: 'scrum',
        columns: workflowColumns,
        swimlanes: [],
        settings: {
          showSubtasks: true,
          showEpics: true,
          cardFields: ['assignee', 'priority', 'storyPoints'],
          quickFilters: [],
        },
        isDefault: true,
        createdBy: userId,
      });
      await board.save();
    } else if (board) {
      // Sync existing board columns with workflow
      const boardIds = board.columns.map(c => c.statusId).join(',');
      const wfIds = workflowColumns.map(c => c.statusId).join(',');
      if (boardIds !== wfIds) {
        board.columns = workflowColumns;
        await board.save();
      }
    }

    // Use workflowColumns as the effective columns (even if board save failed)
    const effectiveColumns = workflowColumns;

    // Find active sprint for this project
    const activeSprint = await Sprint.findOne({ projectId, status: 'active' });

    // Get tasks - if there's an active sprint, get sprint tasks; otherwise get all project tasks
    const taskQuery: Record<string, unknown> = { projectId };
    if (activeSprint) {
      taskQuery.sprintId = activeSprint._id;
    }

    const tasks = await Task.find(taskQuery)
      .populate('assignee', 'profile.firstName profile.lastName profile.avatar email')
      .sort({ columnOrder: 1 });

    // Group tasks by statusId (frontend looks up tasks via status.id = col.statusId)
    const tasksByStatus: Record<string, typeof tasks> = {};

    // Initialize all columns with empty arrays keyed by statusId
    for (const col of effectiveColumns) {
      tasksByStatus[col.statusId] = [];
    }

    // Build lookup maps for matching tasks to columns
    const statusIdSet = new Set(effectiveColumns.map(col => col.statusId));
    const nameToStatusId = new Map(effectiveColumns.map(col => [col.name.toLowerCase(), col.statusId]));
    const categoryToStatusId: Record<string, string> = {};
    for (const col of effectiveColumns) {
      const lower = col.name.toLowerCase();
      if (lower === 'done' || lower === 'completed') categoryToStatusId['done'] = col.statusId;
      else if (lower.includes('progress') || lower.includes('review')) categoryToStatusId['in_progress'] = col.statusId;
    }
    const firstStatusId = effectiveColumns[0]?.statusId || 'backlog';

    // Place tasks into columns
    for (const task of tasks) {
      const taskStatusId = task.status?.id;
      const taskStatusName = task.status?.name?.toLowerCase();
      const taskStatusCategory = task.status?.category;

      if (taskStatusId && statusIdSet.has(taskStatusId)) {
        // Exact match on status id
        tasksByStatus[taskStatusId].push(task);
      } else if (taskStatusName && nameToStatusId.has(taskStatusName)) {
        // Match by status name → column name
        tasksByStatus[nameToStatusId.get(taskStatusName)!].push(task);
      } else if (taskStatusCategory && categoryToStatusId[taskStatusCategory]) {
        // Match by category
        tasksByStatus[categoryToStatusId[taskStatusCategory]].push(task);
      } else {
        // Default to first column
        if (!tasksByStatus[firstStatusId]) tasksByStatus[firstStatusId] = [];
        tasksByStatus[firstStatusId].push(task);
      }
    }

    // Enrich columns with category/color from workflow (or infer as fallback)
    const workflowStatusMap = new Map(
      (workflow?.statuses || []).map(s => [s.id, { category: s.category, color: s.color }])
    );
    const inferCategory = (name: string, statusId: string): string => {
      const lower = (name || statusId).toLowerCase();
      if (lower === 'done' || lower === 'completed' || lower === 'closed') return 'done';
      if (lower.includes('progress') || lower.includes('review') || lower.includes('testing') || lower.includes('active')) return 'in_progress';
      return 'todo';
    };
    const inferColor = (category: string): string => {
      if (category === 'done') return '#10B981';
      if (category === 'in_progress') return '#F59E0B';
      return '#6B7280';
    };

    const enrichedColumns = effectiveColumns.map(col => {
      const wfStatus = workflowStatusMap.get(col.statusId);
      const category = wfStatus?.category || inferCategory(col.name, col.statusId);
      const color = wfStatus?.color || inferColor(category);
      return {
        id: col.id,
        name: col.name,
        statusId: col.statusId,
        wipLimit: col.wipLimit,
        order: col.order,
        category,
        color,
      };
    });

    const boardData = board ? board.toJSON() : {
      projectId,
      organizationId,
      name: 'Default Board',
      type: 'scrum',
      methodology: 'scrum',
    };

    res.status(200).json({
      success: true,
      data: {
        board: { ...boardData, columns: enrichedColumns },
        activeSprint: activeSprint || null,
        tasksByStatus,
      },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get full board error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get board data',
    } as ApiResponse);
  }
};

export const reorderColumns = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array().map((e: { type?: string; msg: string }) => ({ field: e.type, message: e.msg })),
      } as ApiResponse);
      return;
    }

    const { projectId } = req.params;
    const { columnOrder } = req.body;

    if (!Array.isArray(columnOrder)) {
      res.status(400).json({
        success: false,
        error: 'columnOrder must be an array of column IDs',
      } as ApiResponse);
      return;
    }

    const board = await PMBoard.findOne({ projectId, isDefault: true });

    if (!board) {
      res.status(404).json({
        success: false,
        error: 'Board not found',
      } as ApiResponse);
      return;
    }

    const reorderedColumns = columnOrder.map((colId, index) => {
      const column = board.columns.find(col => col.id === colId);
      if (!column) {
        throw new Error(`Column ${colId} not found`);
      }
      return { ...column, order: index };
    });

    board.columns = reorderedColumns;
    await board.save();

    res.status(200).json({
      success: true,
      data: { board },
    } as ApiResponse);
  } catch (error) {
    logger.error('Reorder columns error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reorder columns',
    } as ApiResponse);
  }
};
