import { Response } from 'express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Task from '../../models/pm/Task';
import Project from '../../models/pm/Project';
import Workflow from '../../models/pm/Workflow';
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

    res.status(200).json({
      success: true,
      data: { task, transitions, permissions: taskPermissions, isWatching },
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
        
        (task as unknown as Record<string, unknown>)[key] = value;
      }
    }

    task.updatedBy = new mongoose.Types.ObjectId(userId);
    await task.save();

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

    const task = await workflowService.transitionTask(taskId, statusId, userId!, comment);

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
    const { taskId } = req.params;
    const { statusId, columnOrder, sprintId } = req.body;
    const userId = req.user?.id;

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
      });

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
        }
      }

      await workflowService.transitionTask(taskId, resolvedStatusId, userId!);
    }

    // Update position
    if (columnOrder !== undefined) {
      task.columnOrder = columnOrder;
    }

    if (sprintId !== undefined) {
      task.sprintId = sprintId ? new mongoose.Types.ObjectId(sprintId) : undefined;
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
