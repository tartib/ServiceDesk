import { Response } from 'express';
import mongoose from 'mongoose';
import logger from '../../utils/logger';
import { validationResult } from 'express-validator';
import Sprint from '../../models/pm/Sprint';
import Task from '../../models/pm/Task';
import Project from '../../models/pm/Project';
import { PMAuthRequest, ApiResponse, StatusCategory } from '../../types/pm';

export const createSprint = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array().map((e: { type?: string; msg: string }) => ({ field: e.type, message: e.msg })),
      } as ApiResponse);
      return;
    }

    const userId = req.user?.id;
    const { projectId } = req.params;

    // Get organizationId from project
    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
      return;
    }

    const organizationId = project.organizationId || req.user?.organizationId;

    // Get next sprint number
    const lastSprint = await Sprint.findOne({ projectId }).sort({ number: -1 });
    const nextNumber = (lastSprint?.number || 0) + 1;

    const { name, goal, startDate, endDate, capacity } = req.body;

    const sprint = new Sprint({
      projectId,
      organizationId,
      name: name || `Sprint ${nextNumber}`,
      goal,
      number: nextNumber,
      status: 'planning',
      startDate,
      endDate,
      capacity: capacity || { planned: 0, committed: 0 },
      createdBy: userId,
    });

    await sprint.save();

    res.status(201).json({
      success: true,
      data: { sprint },
      message: 'Sprint created successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Create sprint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create sprint',
    } as ApiResponse);
  }
};

export const getSprints = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { status } = req.query;

    // Build query - handle projectId as string (Mongoose will cast it)
    const query: Record<string, unknown> = { projectId };
    if (status) {
      const statusStr = status as string;
      query.status = statusStr.includes(',') ? { $in: statusStr.split(',').map(s => s.trim()) } : statusStr;
    }

    // Find all sprints for this project
    const sprints = await Sprint.find(query).sort({ number: -1 });
    
    // If no sprints found, also try to find any sprints (for debugging)
    if (sprints.length === 0) {
      const allSprints = await Sprint.find({}).limit(5);
      console.log(`No sprints found for project ${projectId}. Total sprints in DB: ${allSprints.length}`);
    }

    // Get task counts for each sprint
    const sprintsWithStats = await Promise.all(
      sprints.map(async (sprint) => {
        const tasks = await Task.find({ sprintId: sprint._id });
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t) => t.status.category === StatusCategory.DONE).length;
        const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
        const completedPoints = tasks
          .filter((t) => t.status.category === StatusCategory.DONE)
          .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

        // Calculate progress percentage
        const progressByTasks = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const progressByPoints = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

        return {
          ...sprint.toJSON(),
          stats: {
            totalTasks,
            completedTasks,
            totalPoints,
            completedPoints,
          },
          progress: progressByPoints > 0 ? progressByPoints : progressByTasks,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: { sprints: sprintsWithStats },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get sprints error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sprints',
    } as ApiResponse);
  }
};

export const getSprint = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { sprintId } = req.params;

    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      res.status(404).json({
        success: false,
        error: 'Sprint not found',
      } as ApiResponse);
      return;
    }

    // Get sprint tasks
    const tasks = await Task.find({ sprintId })
      .populate('assignee', 'name profile.firstName profile.lastName profile.avatar email')
      .populate('reporter', 'name profile.firstName profile.lastName profile.avatar email')
      .sort({ columnOrder: 1 });

    // Calculate stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status.category === StatusCategory.DONE).length;
    const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const completedPoints = tasks
      .filter((t) => t.status.category === StatusCategory.DONE)
      .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        sprint,
        tasks,
        stats: {
          totalTasks,
          completedTasks,
          totalPoints,
          completedPoints,
        },
      },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get sprint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sprint',
    } as ApiResponse);
  }
};

export const updateSprint = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array().map((e: { type?: string; msg: string }) => ({ field: e.type, message: e.msg })),
      } as ApiResponse);
      return;
    }

    const { sprintId } = req.params;

    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      res.status(404).json({
        success: false,
        error: 'Sprint not found',
      } as ApiResponse);
      return;
    }

    const { name, goal, startDate, endDate, capacity } = req.body;

    if (name) sprint.name = name;
    if (goal !== undefined) sprint.goal = goal;
    if (startDate) sprint.startDate = startDate;
    if (endDate) sprint.endDate = endDate;
    if (capacity) sprint.capacity = { ...sprint.capacity, ...capacity };

    await sprint.save();

    res.status(200).json({
      success: true,
      data: { sprint },
      message: 'Sprint updated successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Update sprint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update sprint',
    } as ApiResponse);
  }
};

export const startSprint = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
      } as ApiResponse);
      return;
    }

    const { sprintId } = req.params;
    const { skipValidation, participants } = req.body;

    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      res.status(404).json({
        success: false,
        error: 'Sprint not found',
      } as ApiResponse);
      return;
    }

    if (sprint.status !== 'planning') {
      res.status(400).json({
        success: false,
        error: 'Sprint can only be started from planning status',
      } as ApiResponse);
      return;
    }

    // Check if there's already an active sprint
    const activeSprint = await Sprint.findOne({
      projectId: sprint.projectId,
      status: 'active',
    });

    if (activeSprint) {
      res.status(400).json({
        success: false,
        error: 'There is already an active sprint. Complete it first.',
      } as ApiResponse);
      return;
    }

    // Get sprint tasks
    const tasks = await Task.find({ sprintId });
    const committedPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    // Validation checks (can be skipped with skipValidation flag)
    const validationErrors: string[] = [];

    if (!skipValidation) {
      // Check 1: Sprint Goal required
      if (sprint.settings?.requireGoal && !sprint.goal) {
        validationErrors.push('Sprint goal is required');
      }

      // Check 2: All tasks must have estimates
      if (sprint.settings?.requireEstimates) {
        const unestimatedTasks = tasks.filter((t) => !t.storyPoints);
        if (unestimatedTasks.length > 0) {
          validationErrors.push(
            `${unestimatedTasks.length} task(s) without estimates: ${unestimatedTasks.map((t) => t.key).join(', ')}`
          );
        }
      }

      // Check 3: Capacity not exceeded
      if (sprint.settings?.enforceCapacity && sprint.capacity.available > 0) {
        if (committedPoints > sprint.capacity.available) {
          validationErrors.push(
            `Committed points (${committedPoints}) exceed available capacity (${sprint.capacity.available})`
          );
        }
      }
    }

    if (validationErrors.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Sprint cannot be started due to validation errors',
        data: { validationErrors },
      } as ApiResponse);
      return;
    }

    // Check for over-capacity and require justification
    const isOverCapacity = sprint.capacity.available > 0 && committedPoints > sprint.capacity.available;
    const capacityUtilization = sprint.capacity.available > 0 
      ? Math.round((committedPoints / sprint.capacity.available) * 100) 
      : 0;

    if (isOverCapacity && skipValidation && !req.body.overCapacityJustification) {
      res.status(400).json({
        success: false,
        error: 'Over-capacity sprint requires justification',
        data: { 
          committedPoints, 
          availableCapacity: sprint.capacity.available,
          utilization: capacityUtilization,
        },
      } as ApiResponse);
      return;
    }

    // Update sprint
    sprint.status = 'active';
    sprint.capacity.committed = committedPoints;
    sprint.velocity = { planned: committedPoints, completed: 0 };
    sprint.overCapacityWarning = isOverCapacity;
    
    // Record commitment
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const participantObjectIds = (participants || []).map((id: string) => new mongoose.Types.ObjectId(id));
    sprint.commitment = {
      committedAt: new Date(),
      committedBy: userObjectId,
      participants: participantObjectIds,
    };

    // Add audit log entry
    if (!sprint.auditLog) sprint.auditLog = [];
    sprint.auditLog.push({
      action: 'sprint_started',
      userId: userObjectId,
      timestamp: new Date(),
      details: `Sprint started with ${committedPoints} points committed (${capacityUtilization}% capacity)`,
      overCapacity: isOverCapacity,
      justification: isOverCapacity ? req.body.overCapacityJustification : undefined,
    });

    await sprint.save();

    res.status(200).json({
      success: true,
      data: { sprint },
      message: 'Sprint started successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Start sprint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start sprint',
    } as ApiResponse);
  }
};

export const completeSprint = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { sprintId } = req.params;
    const { moveIncompleteToBacklog, moveToSprintId } = req.body;

    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      res.status(404).json({
        success: false,
        error: 'Sprint not found',
      } as ApiResponse);
      return;
    }

    if (sprint.status !== 'active') {
      res.status(400).json({
        success: false,
        error: 'Only active sprints can be completed',
      } as ApiResponse);
      return;
    }

    // Get incomplete tasks
    const incompleteTasks = await Task.find({
      sprintId,
      'status.category': { $ne: StatusCategory.DONE },
    });

    // Calculate velocity
    const completedTasks = await Task.find({
      sprintId,
      'status.category': StatusCategory.DONE,
    });
    const completedPoints = completedTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    // Move incomplete tasks
    if (incompleteTasks.length > 0) {
      if (moveIncompleteToBacklog) {
        await Task.updateMany(
          { _id: { $in: incompleteTasks.map((t) => t._id) } },
          { $unset: { sprintId: 1 } }
        );
      } else if (moveToSprintId) {
        await Task.updateMany(
          { _id: { $in: incompleteTasks.map((t) => t._id) } },
          { sprintId: moveToSprintId }
        );
      }
    }

    sprint.status = 'completed';
    if (sprint.velocity) {
      sprint.velocity.completed = completedPoints;
    }
    await sprint.save();

    res.status(200).json({
      success: true,
      data: {
        sprint,
        stats: {
          completedTasks: completedTasks.length,
          incompleteTasks: incompleteTasks.length,
          completedPoints,
        },
      },
      message: 'Sprint completed successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Complete sprint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete sprint',
    } as ApiResponse);
  }
};

export const deleteSprint = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { sprintId } = req.params;

    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      res.status(404).json({
        success: false,
        error: 'Sprint not found',
      } as ApiResponse);
      return;
    }

    if (sprint.status === 'active') {
      res.status(400).json({
        success: false,
        error: 'Cannot delete an active sprint',
      } as ApiResponse);
      return;
    }

    // Remove sprint from tasks
    await Task.updateMany({ sprintId }, { $unset: { sprintId: 1 } });

    await Sprint.findByIdAndDelete(sprintId);

    res.status(200).json({
      success: true,
      message: 'Sprint deleted successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Delete sprint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete sprint',
    } as ApiResponse);
  }
};

export const getBacklog = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    const tasks = await Task.find({
      projectId,
      sprintId: { $exists: false },
    })
      .populate('assignee', 'name profile.firstName profile.lastName profile.avatar email')
      .populate('reporter', 'name profile.firstName profile.lastName profile.avatar email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { tasks },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get backlog error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch backlog',
    } as ApiResponse);
  }
};

export const getSprintInsights = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { sprintId } = req.params;

    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      res.status(404).json({
        success: false,
        error: 'Sprint not found',
      } as ApiResponse);
      return;
    }

    const tasks = await Task.find({ sprintId });

    const completedTasks = tasks.filter(task => task.status.category === 'done');
    const inProgressTasks = tasks.filter(task => task.status.category === 'in_progress');
    const todoTasks = tasks.filter(task => task.status.category === 'todo');

    const totalStoryPoints = tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
    const completedStoryPoints = completedTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);

    const now = new Date();
    const startDate = new Date(sprint.startDate);
    const endDate = new Date(sprint.endDate);
    
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysPassed = Math.max(0, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysRemaining = Math.max(0, totalDays - daysPassed);

    const completionPercentage = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
    const storyPointsPercentage = totalStoryPoints > 0 ? Math.round((completedStoryPoints / totalStoryPoints) * 100) : 0;
    const timePercentage = totalDays > 0 ? Math.round((daysPassed / totalDays) * 100) : 0;

    const insights = {
      sprint: {
        _id: sprint._id,
        name: sprint.name,
        status: sprint.status,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
      },
      metrics: {
        totalTasks: tasks.length,
        completedTasks: completedTasks.length,
        inProgressTasks: inProgressTasks.length,
        todoTasks: todoTasks.length,
        totalStoryPoints,
        completedStoryPoints,
        velocity: completedStoryPoints,
      },
      progress: {
        completionPercentage,
        storyPointsPercentage,
        timePercentage,
      },
      timeline: {
        totalDays,
        daysPassed,
        daysRemaining,
      },
      analysis: {
        onTrack: completionPercentage >= timePercentage - 10,
        behindSchedule: completionPercentage < timePercentage - 20,
        aheadOfSchedule: completionPercentage > timePercentage + 20,
        tooManyInProgress: inProgressTasks.length > completedTasks.length && timePercentage > 70,
      },
    };

    res.status(200).json({
      success: true,
      data: insights,
    } as ApiResponse);
  } catch (error) {
    logger.error('Get sprint insights error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sprint insights',
    } as ApiResponse);
  }
};

// ==================== TEAM CAPACITY ====================

// Update team capacity for sprint
export const updateTeamCapacity = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array().map((e: { type?: string; msg: string }) => ({ field: e.type, message: e.msg })),
      } as ApiResponse);
      return;
    }

    const { sprintId } = req.params;
    const { teamCapacity } = req.body;

    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      res.status(404).json({
        success: false,
        error: 'Sprint not found',
      } as ApiResponse);
      return;
    }

    if (sprint.status !== 'planning') {
      res.status(400).json({
        success: false,
        error: 'Team capacity can only be updated during planning',
      } as ApiResponse);
      return;
    }

    // Update team capacity
    sprint.teamCapacity = teamCapacity;

    // Calculate total available capacity
    const totalAvailable = teamCapacity.reduce((sum: number, member: any) => {
      const workingDays = member.availableDays - member.plannedLeave;
      const dailyHours = member.hoursPerDay - (member.meetingHours / member.availableDays || 0);
      return sum + (workingDays * dailyHours);
    }, 0);

    sprint.capacity.available = totalAvailable;
    await sprint.save();

    res.status(200).json({
      success: true,
      data: { 
        sprint,
        capacitySummary: {
          totalAvailableHours: totalAvailable,
          teamMembers: teamCapacity.length,
        },
      },
      message: 'Team capacity updated',
    } as ApiResponse);
  } catch (error) {
    logger.error('Update team capacity error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update team capacity',
    } as ApiResponse);
  }
};

// Get sprint planning summary
export const getSprintPlanningSummary = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { sprintId } = req.params;

    const sprint = await Sprint.findById(sprintId)
      .populate('teamCapacity.userId', 'name profile.firstName profile.lastName profile.avatar email')
      .populate('commitment.committedBy', 'name profile.firstName profile.lastName')
      .populate('commitment.participants', 'name profile.firstName profile.lastName');

    if (!sprint) {
      res.status(404).json({
        success: false,
        error: 'Sprint not found',
      } as ApiResponse);
      return;
    }

    // Get sprint tasks
    const tasks = await Task.find({ sprintId })
      .populate('assignee', 'name profile.firstName profile.lastName profile.avatar email')
      .sort({ priority: 1 });

    // Calculate statistics
    const totalTasks = tasks.length;
    const estimatedTasks = tasks.filter((t) => t.storyPoints).length;
    const unestimatedTasks = tasks.filter((t) => !t.storyPoints);
    const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    // Group tasks by type
    const tasksByType: Record<string, number> = {};
    tasks.forEach((t) => {
      tasksByType[t.type] = (tasksByType[t.type] || 0) + 1;
    });

    // Group tasks by priority
    const tasksByPriority: Record<string, number> = {};
    tasks.forEach((t) => {
      tasksByPriority[t.priority] = (tasksByPriority[t.priority] || 0) + 1;
    });

    // Calculate capacity utilization
    const capacityUtilization = sprint.capacity.available > 0
      ? Math.round((totalPoints / sprint.capacity.available) * 100)
      : 0;

    // Get previous sprint velocity for reference
    const previousSprint = await Sprint.findOne({
      projectId: sprint.projectId,
      number: sprint.number - 1,
      status: 'completed',
    });

    const summary = {
      sprint: {
        _id: sprint._id,
        name: sprint.name,
        goal: sprint.goal,
        status: sprint.status,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        estimationMethod: sprint.estimationMethod,
      },
      capacity: {
        planned: sprint.capacity.planned,
        available: sprint.capacity.available,
        committed: totalPoints,
        utilization: capacityUtilization,
        overCommitted: totalPoints > sprint.capacity.available && sprint.capacity.available > 0,
      },
      teamCapacity: sprint.teamCapacity,
      tasks: {
        total: totalTasks,
        estimated: estimatedTasks,
        unestimated: unestimatedTasks.length,
        unestimatedList: unestimatedTasks.map((t) => ({ _id: t._id, key: t.key, title: t.title })),
        totalPoints,
        byType: tasksByType,
        byPriority: tasksByPriority,
      },
      velocity: {
        current: totalPoints,
        previousSprint: previousSprint?.velocity?.completed || null,
        average: sprint.velocity?.average || null,
      },
      readiness: {
        hasGoal: !!sprint.goal,
        allEstimated: unestimatedTasks.length === 0,
        withinCapacity: totalPoints <= sprint.capacity.available || sprint.capacity.available === 0,
        canStart: !!sprint.goal && unestimatedTasks.length === 0 && 
          (totalPoints <= sprint.capacity.available || sprint.capacity.available === 0),
      },
      settings: sprint.settings,
      commitment: sprint.commitment,
    };

    res.status(200).json({
      success: true,
      data: summary,
    } as ApiResponse);
  } catch (error) {
    logger.error('Get sprint planning summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sprint planning summary',
    } as ApiResponse);
  }
};

// Update sprint settings
export const updateSprintSettings = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { sprintId } = req.params;
    const { settings } = req.body;

    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      res.status(404).json({
        success: false,
        error: 'Sprint not found',
      } as ApiResponse);
      return;
    }

    sprint.settings = { ...sprint.settings, ...settings };
    await sprint.save();

    res.status(200).json({
      success: true,
      data: { sprint },
      message: 'Sprint settings updated',
    } as ApiResponse);
  } catch (error) {
    logger.error('Update sprint settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update sprint settings',
    } as ApiResponse);
  }
};
