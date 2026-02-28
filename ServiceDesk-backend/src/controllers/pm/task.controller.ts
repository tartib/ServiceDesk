import { Response } from 'express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Task from '../../models/pm/Task';
import Project from '../../models/pm/Project';
import Workflow from '../../models/pm/Workflow';
import Activity from '../../models/pm/Activity';
import workflowService from '../../services/pm/workflow.service';
import { PMAuthRequest, ApiResponse, TaskType, TaskPriority } from '../../types/pm';
import * as permissions from '../../utils/pm/permissions';
import logger from '../../utils/logger';

export const createTask = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array().map((e: { type?: string; msg: string; path?: string }) => ({ 
          field: e.path || e.type, 
          message: e.msg 
        })),
      } as ApiResponse);
      return;
    }

    const userId = req.user?.id;
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
      return;
    }

    // Check permission to create tasks
    if (!userId || !permissions.canCreateTask(project.members, userId)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions to create tasks. Viewers cannot create tasks.',
      } as ApiResponse);
      return;
    }

    // Get organizationId from project or use a default
    const organizationId = project.organizationId?.toString() || 'default-org';

    // Get workflow and initial status
    const workflow = await workflowService.getOrCreateDefaultWorkflow(
      organizationId,
      project.methodology.code,
      userId!
    );
    const initialStatus = workflowService.getInitialStatus(workflow);

    // Get next task number
    const lastTask = await Task.findOne({ projectId }).sort({ number: -1 });
    const nextNumber = (lastTask?.number || 0) + 1;

    const {
      type,
      title,
      description,
      priority,
      assignee,
      labels,
      storyPoints,
      dueDate,
      parentId,
      epicId,
      sprintId,
    } = req.body;

    const task = new Task({
      projectId,
      organizationId,
      key: `${project.key}-${nextNumber}`,
      number: nextNumber,
      type: type || TaskType.TASK,
      title,
      description,
      status: {
        id: initialStatus.id,
        name: initialStatus.name,
        category: initialStatus.category,
      },
      priority: priority || TaskPriority.MEDIUM,
      assignee: assignee || undefined,
      reporter: userId,
      labels: labels || [],
      components: [],
      storyPoints: (storyPoints === '' || storyPoints === null || storyPoints === undefined) ? undefined : storyPoints,
      dueDate: dueDate || undefined,
      parentId: parentId || undefined,
      epicId: epicId || undefined,
      sprintId: sprintId || undefined,
      workflowHistory: [
        {
          fromStatus: '',
          toStatus: initialStatus.id,
          changedBy: userId,
          changedAt: new Date(),
          comment: 'Task created',
        },
      ],
      createdBy: userId,
    });

    await task.save();

    // Add subtask to parent's subtasks array
    if (parentId) {
      await Task.findByIdAndUpdate(parentId, {
        $addToSet: { subtasks: task._id },
      });
    }

    // Record activity
    await Activity.create({
      organizationId,
      projectId,
      taskId: task._id,
      type: 'task_created',
      actor: userId,
      description: `Created ${type || 'task'} "${title}"`,
      metadata: { taskKey: task.key, taskType: type || 'task' },
    }).catch((err: unknown) => logger.error('Failed to record activity:', err));

    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'name profile.firstName profile.lastName profile.avatar email')
      .populate('reporter', 'name profile.firstName profile.lastName profile.avatar email')
      .populate('sprintId', 'name goal startDate endDate status');

    res.status(201).json({
      success: true,
      data: { task: populatedTask },
      message: 'Task created successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Create task error:', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to create task',
    } as ApiResponse);
  }
};

export const getTasks = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const {
      status,
      type,
      assignee,
      sprintId,
      epicId,
      parentId,
      priority,
      search,
      page = '1',
      limit = '50',
    } = req.query;

    const query: Record<string, unknown> = { projectId };

    if (status) query['status.id'] = status;
    if (type) query.type = type;
    if (assignee) query.assignee = assignee;
    if (sprintId) query.sprintId = sprintId;
    if (epicId) query.epicId = epicId;
    if (parentId) query.parentId = parentId;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { key: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate('assignee', 'name profile.firstName profile.lastName profile.avatar email')
        .populate('reporter', 'name profile.firstName profile.lastName profile.avatar email')
        .populate('sprintId', 'name goal startDate endDate status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Task.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        tasks,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tasks',
    } as ApiResponse);
  }
};

export const getTask = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.id;

    const task = await Task.findById(taskId)
      .populate('assignee', 'name profile.firstName profile.lastName profile.avatar email')
      .populate('reporter', 'name profile.firstName profile.lastName profile.avatar email')
      .populate('sprintId', 'name goal startDate endDate status')
      .populate('parentId', 'key title status')
      .populate('epicId', 'key title status')
      .populate('subtasks', 'key title status assignee')
      .populate('watchers', 'name profile.firstName profile.lastName profile.avatar email');

    if (!task) {
      res.status(404).json({
        success: false,
        error: 'Task not found',
      } as ApiResponse);
      return;
    }

    // Get project for permissions
    const project = await Project.findById(task.projectId);
    
    // Get task permissions for current user
    const taskPermissions = project && userId
      ? permissions.getTaskPermissions(
          project.members,
          userId,
          task.assignee?.toString(),
          task.reporter?.toString()
        )
      : { canUpdate: false, canDelete: false, canAssign: false, canTransition: false };

    // Get available transitions
    const transitions = await workflowService.getAvailableTransitions(taskId);

    // Check if current user is watching this task
    const isWatching = task.watchers?.some((w: any) => w._id?.toString() === userId) || false;

    // Compute subtask progress
    const childTasks = await Task.find({ parentId: taskId }).select('status').lean();
    const subtaskTotal = childTasks.length;
    let subtaskCompleted = 0;
    for (const child of childTasks) {
      if (child.status?.category?.toLowerCase() === 'done') {
        subtaskCompleted++;
      }
    }
    const subtaskProgress = {
      total: subtaskTotal,
      completed: subtaskCompleted,
      progressPercent: subtaskTotal > 0 ? Math.round((subtaskCompleted / subtaskTotal) * 100) : 0,
    };

    res.status(200).json({
      success: true,
      data: { task, transitions, permissions: taskPermissions, isWatching, subtaskProgress },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task',
    } as ApiResponse);
  }
};

export const updateTask = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array().map((e: { type?: string; msg: string }) => ({ field: e.type, message: e.msg })),
      } as ApiResponse);
      return;
    }

    const { taskId } = req.params;
    const userId = req.user?.id;

    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({
        success: false,
        error: 'Task not found',
      } as ApiResponse);
      return;
    }

    // Get project for permission check
    const project = await Project.findById(task.projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
      return;
    }

    // Check permission to update task
    const taskAssigneeId = task.assignee ? task.assignee.toString() : undefined;
    const taskReporterId = task.reporter ? task.reporter.toString() : undefined;
    if (!userId || !permissions.canUpdateTask(project.members, userId, taskAssigneeId, taskReporterId)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions to update this task',
      } as ApiResponse);
      return;
    }

    // Check assignee permission - contributors can only assign to self
    if (req.body.assignee !== undefined && req.body.assignee !== null && req.body.assignee !== '') {
      const newAssigneeId = req.body.assignee.toString();
      if (!userId || !permissions.canAssignTask(project.members, userId, newAssigneeId)) {
        res.status(403).json({
          success: false,
          error: 'You can only assign tasks to yourself',
        } as ApiResponse);
        return;
      }
    }

    const allowedUpdates = [
      'title',
      'description',
      'type',
      'priority',
      'assignee',
      'labels',
      'components',
      'storyPoints',
      'originalEstimate',
      'remainingEstimate',
      'dueDate',
      'startDate',
      'parentId',
      'epicId',
      'sprintId',
      'swimlane',
      'boardColumn',
      'columnOrder',
      'itil',
      'waterfall',
      'okr',
    ];

    // Check if trying to assign task to sprint with large estimate
    if (req.body.sprintId && req.body.sprintId !== '' && req.body.sprintId !== null) {
      // Block tasks with estimate of 21 from being added to sprint
      const effectiveEstimate = req.body.storyPoints ?? task.storyPoints;
      if (effectiveEstimate === 21) {
        res.status(400).json({
          success: false,
          error: 'Tasks with estimate of 21 cannot be added to sprint. Story is too large and must be decomposed.',
        } as ApiResponse);
        return;
      }
    }

    // Handle parentId changes — sync old/new parent subtasks arrays
    if (req.body.parentId !== undefined) {
      let newParentId = req.body.parentId;
      if (newParentId === '' || newParentId === null) {
        newParentId = null;
      }

      const oldParentId = task.parentId ? task.parentId.toString() : null;
      const newParentIdStr = newParentId ? newParentId.toString() : null;

      if (oldParentId !== newParentIdStr) {
        // Prevent setting self as parent
        if (newParentIdStr && newParentIdStr === taskId) {
          res.status(400).json({
            success: false,
            error: 'A task cannot be its own parent',
          } as ApiResponse);
          return;
        }

        // Prevent circular reference — walk up the ancestor chain of newParent
        if (newParentIdStr) {
          let ancestorId: string | null = newParentIdStr;
          const visited = new Set<string>();
          while (ancestorId) {
            if (visited.has(ancestorId)) break;
            visited.add(ancestorId);
            if (ancestorId === taskId) {
              res.status(400).json({
                success: false,
                error: 'Circular reference detected: the selected parent is already a descendant of this task',
              } as ApiResponse);
              return;
            }
            const ancestor = await Task.findById(ancestorId).select('parentId').lean();
            ancestorId = ancestor?.parentId ? ancestor.parentId.toString() : null;
          }
        }

        // Remove from old parent's subtasks
        if (oldParentId) {
          await Task.findByIdAndUpdate(oldParentId, {
            $pull: { subtasks: task._id },
          });
        }

        // Add to new parent's subtasks
        if (newParentIdStr) {
          await Task.findByIdAndUpdate(newParentIdStr, {
            $addToSet: { subtasks: task._id },
          });
        }
      }
    }

    // Track changes for activity recording
    const trackedFields = ['title', 'type', 'priority', 'assignee', 'labels', 'storyPoints', 'dueDate', 'startDate', 'sprintId', 'epicId', 'description', 'parentId'];
    const changes: { field: string; oldValue: unknown; newValue: unknown }[] = [];

    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        let value = req.body[key];
        
        // Handle empty strings for ObjectId fields and Numbers
        if (value === '') {
          if (['assignee', 'parentId', 'epicId', 'sprintId', 'milestone', 'objectiveId', 'keyResultId'].includes(key)) {
            value = null;
          } else if (['storyPoints', 'originalEstimate', 'remainingEstimate', 'columnOrder'].includes(key)) {
            value = null;
          } else if (['dueDate', 'startDate', 'cabApprovalDate', 'scheduledStart', 'scheduledEnd', 'completedAt'].includes(key)) {
            value = null;
          }
        }

        // Capture old value for tracked fields
        if (trackedFields.includes(key)) {
          const oldVal = (task as unknown as Record<string, unknown>)[key];
          const oldStr = oldVal?.toString() || '';
          const newStr = value?.toString() || '';
          if (oldStr !== newStr) {
            changes.push({ field: key, oldValue: oldVal, newValue: value });
          }
        }
        
        (task as unknown as Record<string, unknown>)[key] = value;
      }
    }

    task.updatedBy = new mongoose.Types.ObjectId(userId);
    await task.save();

    // Record activity for each meaningful change
    const activityTypeMap: Record<string, string> = {
      assignee: 'assignee_changed',
      priority: 'priority_changed',
    };
    for (const change of changes) {
      const actType = activityTypeMap[change.field] || 'task_updated';
      Activity.create({
        organizationId: task.organizationId,
        projectId: task.projectId,
        taskId: task._id,
        type: actType,
        actor: userId,
        description: `Changed ${change.field}`,
        metadata: { field: change.field, oldValue: change.oldValue, newValue: change.newValue, taskKey: task.key },
      }).catch((err: unknown) => logger.error('Failed to record activity:', err));
    }

    const updatedTask = await Task.findById(taskId)
      .populate('assignee', 'name profile.firstName profile.lastName profile.avatar email')
      .populate('reporter', 'name profile.firstName profile.lastName profile.avatar email')
      .populate('sprintId', 'name goal startDate endDate status');

    res.status(200).json({
      success: true,
      data: { task: updatedTask },
      message: 'Task updated successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Update task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update task',
    } as ApiResponse);
  }
};

export const transitionTask = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const { statusId, comment } = req.body;
    const userId = req.user?.id;

    if (!statusId) {
      res.status(400).json({
        success: false,
        error: 'Status ID is required',
      } as ApiResponse);
      return;
    }

    // Get old status before transition
    const oldTask = await Task.findById(taskId);
    const oldStatus = oldTask?.status;

    const task = await workflowService.transitionTask(taskId, statusId, userId!, comment);

    // Record status change activity
    Activity.create({
      organizationId: task.organizationId,
      projectId: task.projectId,
      taskId: task._id,
      type: 'status_changed',
      actor: userId,
      description: `Changed status from "${oldStatus?.name || ''}" to "${task.status.name}"`,
      metadata: {
        field: 'status',
        oldValue: oldStatus ? { id: oldStatus.id, name: oldStatus.name, category: oldStatus.category } : null,
        newValue: { id: task.status.id, name: task.status.name, category: task.status.category },
        taskKey: task.key,
        comment,
      },
    }).catch((err: unknown) => logger.error('Failed to record activity:', err));

    const updatedTask = await Task.findById(task._id)
      .populate('assignee', 'name profile.firstName profile.lastName profile.avatar email')
      .populate('reporter', 'name profile.firstName profile.lastName profile.avatar email')
      .populate('sprintId', 'name goal startDate endDate status');

    const transitions = await workflowService.getAvailableTransitions(taskId);

    res.status(200).json({
      success: true,
      data: { task: updatedTask, transitions },
      message: 'Task transitioned successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Transition task error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to transition task',
    } as ApiResponse);
  }
};

export const deleteTask = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.id;

    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({
        success: false,
        error: 'Task not found',
      } as ApiResponse);
      return;
    }

    // Get project for permission check
    const project = await Project.findById(task.projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
      return;
    }

    // Check permission to delete task - only managers and leads can delete
    if (!userId || !permissions.canDeleteTask(project.members, userId)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions to delete tasks. Only managers and leads can delete tasks.',
      } as ApiResponse);
      return;
    }

    // Remove from parent's subtasks if exists
    if (task.parentId) {
      await Task.findByIdAndUpdate(task.parentId, {
        $pull: { subtasks: task._id },
      });
    }

    // Record activity before deletion
    await Activity.create({
      organizationId: task.organizationId,
      projectId: task.projectId,
      taskId: task._id,
      type: 'task_deleted',
      actor: userId,
      description: `Deleted ${task.type} "${task.title}"`,
      metadata: { taskKey: task.key, taskType: task.type, taskTitle: task.title },
    }).catch((err: unknown) => logger.error('Failed to record activity:', err));

    await Task.findByIdAndDelete(taskId);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete task',
    } as ApiResponse);
  }
};

export const getBoardTasks = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { sprintId } = req.query;

    const query: Record<string, unknown> = { projectId };
    if (sprintId) {
      query.sprintId = sprintId;
    }

    const tasks = await Task.find(query)
      .populate('assignee', 'name profile.firstName profile.lastName profile.avatar email')
      .populate('sprintId', 'name goal startDate endDate status')
      .sort({ columnOrder: 1, createdAt: -1 });

    // Group by status
    const tasksByStatus: Record<string, typeof tasks> = {};
    for (const task of tasks) {
      const statusId = task.status.id;
      if (!tasksByStatus[statusId]) {
        tasksByStatus[statusId] = [];
      }
      tasksByStatus[statusId].push(task);
    }

    res.status(200).json({
      success: true,
      data: { tasks, tasksByStatus },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get board tasks error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch board tasks',
    } as ApiResponse);
  }
};

export const moveTask = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array().map((e: { type?: string; msg: string; path?: string }) => ({
          field: e.path || e.type,
          message: e.msg
        })),
      } as ApiResponse);
      return;
    }

    const { taskId } = req.params;
    const { statusId, columnOrder, sprintId } = req.body;
    const userId = req.user?.id;

    logger.info(`[moveTask] taskId=${taskId}, statusId=${statusId}, sprintId=${sprintId}, columnOrder=${columnOrder}`);

    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({
        success: false,
        error: 'Task not found',
      } as ApiResponse);
      return;
    }

    // If status changed, use workflow transition
    if (statusId && statusId !== task.status.id) {
      // Resolve board column slug to actual workflow status ID
      let resolvedStatusId = statusId;

      const workflow = await Workflow.findOne({
        $or: [
          { projectId: task.projectId },
          { organizationId: task.organizationId, isDefault: true },
        ],
      }).sort({ projectId: -1 });

      if (workflow) {
        // Try exact match first
        let match = workflow.statuses.find(s => s.id === statusId);
        if (!match) {
          // Try match by name (case-insensitive, slug-friendly)
          const slugName = statusId.replace(/-/g, ' ').toLowerCase();
          match = workflow.statuses.find(s => s.name.toLowerCase() === slugName);
        }
        if (!match) {
          // Try match by category mapping from board column name
          const categoryMap: Record<string, string> = {
            'backlog': 'todo', 'ready': 'todo',
            'in-progress': 'in_progress', 'in-review': 'in_progress',
            'done': 'done', 'completed': 'done',
          };
          const targetCategory = categoryMap[statusId.toLowerCase()];
          if (targetCategory) {
            match = workflow.statuses.find(s => s.category === targetCategory);
          }
        }
        if (match) {
          resolvedStatusId = match.id;
        } else {
          logger.warn(`[moveTask] Could not resolve statusId "${statusId}" in workflow. Available: ${workflow.statuses.map(s => s.id).join(', ')}`);
          // Fallback: directly update the task status if the target ID exists in workflow statuses list
          // This handles cases where the ID format differs between frontend and backend
          res.status(400).json({
            success: false,
            error: `Status "${statusId}" not found in workflow. Available statuses: ${workflow.statuses.map(s => `${s.name} (${s.id})`).join(', ')}`,
          } as ApiResponse);
          return;
        }
      }

      await workflowService.transitionTask(taskId, resolvedStatusId, userId!);
    }

    // Update position
    if (columnOrder !== undefined) {
      task.columnOrder = columnOrder;
    }

    if (sprintId !== undefined) {
      if (sprintId && typeof sprintId === 'string' && sprintId.trim().length > 0) {
        task.sprintId = new mongoose.Types.ObjectId(sprintId);
      } else {
        // Properly unset sprintId so getBacklog query picks it up
        task.sprintId = null as any;
      }
      logger.info(`[moveTask] Updated sprintId to ${sprintId || 'null (backlog)'} for task ${taskId}`);
    }

    task.updatedBy = new mongoose.Types.ObjectId(userId);
    await task.save();

    const updatedTask = await Task.findById(taskId)
      .populate('assignee', 'name profile.firstName profile.lastName profile.avatar email')
      .populate('sprintId', 'name goal startDate endDate status');

    res.status(200).json({
      success: true,
      data: { task: updatedTask },
    } as ApiResponse);
  } catch (error) {
    logger.error('Move task error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to move task',
    } as ApiResponse);
  }
};

// ==================== REORDER (Bulk) ====================

export const reorderTasks = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { tasks: taskOrders } = req.body;
    const userId = req.user?.id;

    if (!Array.isArray(taskOrders) || taskOrders.length === 0) {
      res.status(400).json({ success: false, error: 'tasks array is required' } as ApiResponse);
      return;
    }

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ success: false, error: 'Project not found' } as ApiResponse);
      return;
    }

    const bulkOps = taskOrders.map((item: { taskId: string; columnOrder: number; sprintId?: string | null }) => {
      const setFields: Record<string, unknown> = {
        columnOrder: item.columnOrder,
        updatedBy: new mongoose.Types.ObjectId(userId),
      };
      const unsetFields: Record<string, unknown> = {};

      if (item.sprintId !== undefined) {
        if (item.sprintId) {
          setFields.sprintId = new mongoose.Types.ObjectId(item.sprintId);
        } else {
          // Moving to backlog — remove sprintId
          unsetFields.sprintId = '';
        }
      }

      const updateOp: Record<string, unknown> = { $set: setFields };
      if (Object.keys(unsetFields).length > 0) {
        updateOp.$unset = unsetFields;
      }

      return {
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(item.taskId), projectId: new mongoose.Types.ObjectId(projectId) },
          update: updateOp,
        },
      };
    });

    await Task.bulkWrite(bulkOps);

    res.status(200).json({
      success: true,
      data: { updated: bulkOps.length },
    } as ApiResponse);
  } catch (error) {
    logger.error('Reorder tasks error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reorder tasks',
    } as ApiResponse);
  }
};

// ==================== WATCHERS ====================

export const getWatchers = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId)
      .populate('watchers', 'profile.firstName profile.lastName profile.avatar email');

    if (!task) {
      res.status(404).json({
        success: false,
        error: 'Task not found',
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: { watchers: task.watchers || [] },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get watchers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch watchers',
    } as ApiResponse);
  }
};

export const addWatcher = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const { userId: watcherUserId } = req.body;
    const currentUserId = req.user?.id;

    // Use current user if no userId provided
    const userIdToAdd = watcherUserId || currentUserId;

    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({
        success: false,
        error: 'Task not found',
      } as ApiResponse);
      return;
    }

    // Initialize watchers array if not exists
    if (!task.watchers) {
      task.watchers = [];
    }

    // Check if already watching
    const isWatching = task.watchers.some((w) => w.toString() === userIdToAdd);
    if (isWatching) {
      res.status(400).json({
        success: false,
        error: 'User is already watching this task',
      } as ApiResponse);
      return;
    }

    task.watchers.push(new mongoose.Types.ObjectId(userIdToAdd));
    await task.save();

    const updatedTask = await Task.findById(taskId)
      .populate('watchers', 'profile.firstName profile.lastName profile.avatar email');

    res.status(200).json({
      success: true,
      data: { watchers: updatedTask?.watchers || [] },
      message: 'Watcher added successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Add watcher error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add watcher',
    } as ApiResponse);
  }
};

export const removeWatcher = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId, userId: watcherUserId } = req.params;
    const currentUserId = req.user?.id;

    // Use current user if no userId in params (self-unwatch)
    const userIdToRemove = watcherUserId || currentUserId;

    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({
        success: false,
        error: 'Task not found',
      } as ApiResponse);
      return;
    }

    if (!task.watchers || task.watchers.length === 0) {
      res.status(400).json({
        success: false,
        error: 'User is not watching this task',
      } as ApiResponse);
      return;
    }

    const watcherIndex = task.watchers.findIndex((w) => w.toString() === userIdToRemove);
    if (watcherIndex === -1) {
      res.status(400).json({
        success: false,
        error: 'User is not watching this task',
      } as ApiResponse);
      return;
    }

    task.watchers.splice(watcherIndex, 1);
    await task.save();

    const updatedTask = await Task.findById(taskId)
      .populate('watchers', 'profile.firstName profile.lastName profile.avatar email');

    res.status(200).json({
      success: true,
      data: { watchers: updatedTask?.watchers || [] },
      message: 'Watcher removed successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Remove watcher error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove watcher',
    } as ApiResponse);
  }
};

// ==================== TASK LINKS ====================

export const getTaskLinks = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId)
      .populate({
        path: 'links.targetTaskId',
        select: 'key title type status priority assignee',
        populate: { path: 'assignee', select: 'profile.firstName profile.lastName profile.avatar' },
      });

    if (!task) {
      res.status(404).json({ success: false, error: 'Task not found' } as ApiResponse);
      return;
    }

    const links = (task.links || []).map((link) => {
      const target = link.targetTaskId as any;
      return {
        _id: link._id,
        type: link.type,
        targetIssue: target
          ? {
              _id: target._id,
              key: target.key,
              title: target.title,
              type: target.type,
              status: target.status,
              priority: target.priority,
              assignee: target.assignee,
            }
          : null,
      };
    }).filter((l) => l.targetIssue !== null);

    res.status(200).json({ success: true, data: { links } } as ApiResponse);
  } catch (error) {
    logger.error('Get task links error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch task links' } as ApiResponse);
  }
};

export const addTaskLink = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { taskId } = req.params;
    const { type, targetIssueKey } = req.body;

    if (!type || !targetIssueKey) {
      res.status(400).json({ success: false, error: 'type and targetIssueKey are required' } as ApiResponse);
      return;
    }

    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({ success: false, error: 'Task not found' } as ApiResponse);
      return;
    }

    // Find target task by key
    const targetTask = await Task.findOne({ key: targetIssueKey });
    if (!targetTask) {
      res.status(404).json({ success: false, error: `Task "${targetIssueKey}" not found` } as ApiResponse);
      return;
    }

    if (targetTask._id.toString() === taskId) {
      res.status(400).json({ success: false, error: 'Cannot link a task to itself' } as ApiResponse);
      return;
    }

    // Check for duplicate link
    const existingLink = task.links?.find(
      (l) => l.targetTaskId.toString() === targetTask._id.toString() && l.type === type
    );
    if (existingLink) {
      res.status(400).json({ success: false, error: 'This link already exists' } as ApiResponse);
      return;
    }

    const newLink = {
      _id: new mongoose.Types.ObjectId(),
      type,
      targetTaskId: targetTask._id,
      createdBy: new mongoose.Types.ObjectId(userId),
      createdAt: new Date(),
    };

    if (!task.links) task.links = [] as any;
    (task.links as any).push(newLink);
    await task.save();

    // Return populated link
    const populatedTask = await Task.findById(taskId).populate({
      path: 'links.targetTaskId',
      select: 'key title type status priority assignee',
      populate: { path: 'assignee', select: 'profile.firstName profile.lastName profile.avatar' },
    });

    const addedLink = populatedTask?.links?.find((l) => l._id.toString() === newLink._id.toString());
    const target = addedLink?.targetTaskId as any;

    res.status(201).json({
      success: true,
      data: {
        _id: newLink._id,
        type: newLink.type,
        targetIssue: target
          ? {
              _id: target._id,
              key: target.key,
              title: target.title,
              type: target.type,
              status: target.status,
              priority: target.priority,
              assignee: target.assignee,
            }
          : null,
      },
      message: 'Task linked successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Add task link error:', error);
    res.status(500).json({ success: false, error: 'Failed to add task link' } as ApiResponse);
  }
};

export const removeTaskLink = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId, linkId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({ success: false, error: 'Task not found' } as ApiResponse);
      return;
    }

    const linkIndex = task.links?.findIndex((l) => l._id.toString() === linkId);
    if (linkIndex === undefined || linkIndex === -1) {
      res.status(404).json({ success: false, error: 'Link not found' } as ApiResponse);
      return;
    }

    task.links.splice(linkIndex, 1);
    await task.save();

    res.status(200).json({ success: true, message: 'Link removed successfully' } as ApiResponse);
  } catch (error) {
    logger.error('Remove task link error:', error);
    res.status(500).json({ success: false, error: 'Failed to remove task link' } as ApiResponse);
  }
};

// ==================== WEB LINKS ====================

export const addWebLink = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { taskId } = req.params;
    const { url, title, description } = req.body;

    if (!url || !title) {
      res.status(400).json({ success: false, error: 'url and title are required' } as ApiResponse);
      return;
    }

    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({ success: false, error: 'Task not found' } as ApiResponse);
      return;
    }

    const newWebLink = {
      _id: new mongoose.Types.ObjectId(),
      url,
      title,
      description: description || undefined,
      createdBy: new mongoose.Types.ObjectId(userId),
      createdAt: new Date(),
    };

    if (!task.webLinks) task.webLinks = [] as any;
    (task.webLinks as any).push(newWebLink);
    await task.save();

    res.status(201).json({
      success: true,
      data: newWebLink,
      message: 'Web link added successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Add web link error:', error);
    res.status(500).json({ success: false, error: 'Failed to add web link' } as ApiResponse);
  }
};

export const removeWebLink = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId, linkId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({ success: false, error: 'Task not found' } as ApiResponse);
      return;
    }

    const linkIndex = task.webLinks?.findIndex((l) => l._id.toString() === linkId);
    if (linkIndex === undefined || linkIndex === -1) {
      res.status(404).json({ success: false, error: 'Web link not found' } as ApiResponse);
      return;
    }

    task.webLinks.splice(linkIndex, 1);
    await task.save();

    res.status(200).json({ success: true, message: 'Web link removed successfully' } as ApiResponse);
  } catch (error) {
    logger.error('Remove web link error:', error);
    res.status(500).json({ success: false, error: 'Failed to remove web link' } as ApiResponse);
  }
};

// ==================== SUBTASK PROGRESS ====================

export const getSubtaskProgress = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;

    const subtasks = await Task.find({ parentId: taskId }).select('status').lean();

    const total = subtasks.length;
    let completed = 0;
    let inProgress = 0;
    let todo = 0;

    for (const sub of subtasks) {
      const category = sub.status?.category?.toLowerCase();
      if (category === 'done') {
        completed++;
      } else if (category === 'in_progress') {
        inProgress++;
      } else {
        todo++;
      }
    }

    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    res.status(200).json({
      success: true,
      data: { total, completed, inProgress, todo, progressPercent },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get subtask progress error:', error);
    res.status(500).json({ success: false, error: 'Failed to get subtask progress' } as ApiResponse);
  }
};

// ==================== CLONE TASK ====================

export const cloneTask = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.id;

    const originalTask = await Task.findById(taskId).lean();
    if (!originalTask) {
      res.status(404).json({ success: false, error: 'Task not found' } as ApiResponse);
      return;
    }

    const project = await Project.findById(originalTask.projectId);
    if (!project) {
      res.status(404).json({ success: false, error: 'Project not found' } as ApiResponse);
      return;
    }

    if (!userId || !permissions.canCreateTask(project.members, userId)) {
      res.status(403).json({ success: false, error: 'Insufficient permissions to clone task' } as ApiResponse);
      return;
    }

    const organizationId = project.organizationId?.toString() || 'default-org';

    // Get next task number
    const lastTask = await Task.findOne({ projectId: originalTask.projectId }).sort({ number: -1 });
    const nextNumber = (lastTask?.number || 0) + 1;

    // Get initial status from workflow
    const workflow = await workflowService.getOrCreateDefaultWorkflow(
      organizationId,
      project.methodology.code,
      userId!
    );
    const initialStatus = workflowService.getInitialStatus(workflow);

    // Clone the task — copy relevant fields, reset status to initial
    const clonedTask = new Task({
      projectId: originalTask.projectId,
      organizationId,
      key: `${project.key}-${nextNumber}`,
      number: nextNumber,
      type: originalTask.type,
      title: `${originalTask.title} (Clone)`,
      description: originalTask.description,
      status: {
        id: initialStatus.id,
        name: initialStatus.name,
        category: initialStatus.category,
      },
      priority: originalTask.priority,
      assignee: originalTask.assignee,
      reporter: userId,
      labels: originalTask.labels || [],
      components: originalTask.components || [],
      storyPoints: originalTask.storyPoints,
      dueDate: originalTask.dueDate,
      parentId: originalTask.parentId,
      epicId: originalTask.epicId,
      sprintId: originalTask.sprintId,
      workflowHistory: [
        {
          fromStatus: '',
          toStatus: initialStatus.id,
          changedBy: userId,
          changedAt: new Date(),
          comment: `Cloned from ${originalTask.key}`,
        },
      ],
      createdBy: userId,
    });

    await clonedTask.save();

    // Add to parent's subtasks array if applicable
    if (originalTask.parentId) {
      await Task.findByIdAndUpdate(originalTask.parentId, {
        $addToSet: { subtasks: clonedTask._id },
      });
    }

    // Record activity
    await Activity.create({
      organizationId,
      projectId: originalTask.projectId,
      taskId: clonedTask._id,
      type: 'task_created',
      actor: userId,
      description: `Cloned ${originalTask.type || 'task'} "${originalTask.title}" as "${clonedTask.title}"`,
      metadata: { taskKey: clonedTask.key, clonedFrom: originalTask.key },
    }).catch((err: unknown) => logger.error('Failed to record clone activity:', err));

    const populatedTask = await Task.findById(clonedTask._id)
      .populate('assignee', 'name profile.firstName profile.lastName profile.avatar email')
      .populate('reporter', 'name profile.firstName profile.lastName profile.avatar email')
      .populate('sprintId', 'name goal startDate endDate status');

    res.status(201).json({
      success: true,
      data: { task: populatedTask },
      message: 'Task cloned successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Clone task error:', { error });
    res.status(500).json({ success: false, error: 'Failed to clone task' } as ApiResponse);
  }
};

// ==================== ISSUE TYPES (WORK TYPES) ====================

export const getIssueTypes = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId).select('issueTypes').lean();
    if (!project) {
      res.status(404).json({ success: false, error: 'Project not found' } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: { issueTypes: project.issueTypes || [] },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get issue types error:', error);
    res.status(500).json({ success: false, error: 'Failed to get issue types' } as ApiResponse);
  }
};

export const addIssueType = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { id, name, icon, color, description } = req.body;
    const userId = req.user?.id;

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ success: false, error: 'Project not found' } as ApiResponse);
      return;
    }

    if (!userId || !permissions.canCreateTask(project.members, userId)) {
      res.status(403).json({ success: false, error: 'Insufficient permissions' } as ApiResponse);
      return;
    }

    // Check for duplicate id
    const existing = (project.issueTypes || []).find((t: { id: string }) => t.id === id);
    if (existing) {
      res.status(409).json({ success: false, error: `Issue type with id "${id}" already exists` } as ApiResponse);
      return;
    }

    const newType = { id, name, icon, color, description };
    await Project.findByIdAndUpdate(projectId, { $push: { issueTypes: newType } });

    res.status(201).json({
      success: true,
      data: { issueType: newType },
      message: 'Issue type added successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Add issue type error:', error);
    res.status(500).json({ success: false, error: 'Failed to add issue type' } as ApiResponse);
  }
};

export const updateIssueType = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId, typeId } = req.params;
    const { name, icon, color, description } = req.body;
    const userId = req.user?.id;

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ success: false, error: 'Project not found' } as ApiResponse);
      return;
    }

    if (!userId || !permissions.canCreateTask(project.members, userId)) {
      res.status(403).json({ success: false, error: 'Insufficient permissions' } as ApiResponse);
      return;
    }

    const typeIndex = (project.issueTypes || []).findIndex((t: { id: string }) => t.id === typeId);
    if (typeIndex === -1) {
      res.status(404).json({ success: false, error: 'Issue type not found' } as ApiResponse);
      return;
    }

    const updateFields: Record<string, string> = {};
    if (name !== undefined) updateFields[`issueTypes.${typeIndex}.name`] = name;
    if (icon !== undefined) updateFields[`issueTypes.${typeIndex}.icon`] = icon;
    if (color !== undefined) updateFields[`issueTypes.${typeIndex}.color`] = color;
    if (description !== undefined) updateFields[`issueTypes.${typeIndex}.description`] = description;

    const updated = await Project.findByIdAndUpdate(
      projectId,
      { $set: updateFields },
      { new: true }
    ).select('issueTypes').lean();

    const updatedType = updated?.issueTypes?.[typeIndex];

    res.status(200).json({
      success: true,
      data: { issueType: updatedType },
      message: 'Issue type updated successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Update issue type error:', error);
    res.status(500).json({ success: false, error: 'Failed to update issue type' } as ApiResponse);
  }
};

export const deleteIssueType = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId, typeId } = req.params;
    const userId = req.user?.id;

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ success: false, error: 'Project not found' } as ApiResponse);
      return;
    }

    if (!userId || !permissions.canCreateTask(project.members, userId)) {
      res.status(403).json({ success: false, error: 'Insufficient permissions' } as ApiResponse);
      return;
    }

    const exists = (project.issueTypes || []).some((t: { id: string }) => t.id === typeId);
    if (!exists) {
      res.status(404).json({ success: false, error: 'Issue type not found' } as ApiResponse);
      return;
    }

    // Check if any tasks use this type
    const tasksUsingType = await Task.countDocuments({ projectId, type: typeId });
    if (tasksUsingType > 0) {
      res.status(409).json({
        success: false,
        error: `Cannot delete: ${tasksUsingType} task(s) use this type. Reassign them first.`,
      } as ApiResponse);
      return;
    }

    await Project.findByIdAndUpdate(projectId, {
      $pull: { issueTypes: { id: typeId } },
    });

    res.status(200).json({
      success: true,
      message: 'Issue type deleted successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Delete issue type error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete issue type' } as ApiResponse);
  }
};
