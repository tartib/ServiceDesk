import { Response } from 'express';
import logger from '../../utils/logger';
import Task from '../../models/pm/Task';
import Project from '../../models/pm/Project';
import { PMAuthRequest, ApiResponse } from '../../types/pm';

export const globalSearch = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user?.organizationId;
    const { q, type, limit = '20' } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      res.status(400).json({ success: false, error: 'Search query must be at least 2 characters' } as ApiResponse);
      return;
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    const limitNum = Math.min(parseInt(limit as string, 10), 50);

    const results: { tasks?: unknown[]; projects?: unknown[] } = {};

    if (!type || type === 'tasks') {
      const tasks = await Task.find({
        organizationId,
        $or: [
          { title: searchRegex },
          { key: searchRegex },
          { description: searchRegex },
        ],
      })
        .populate('assignee', 'profile.firstName profile.lastName')
        .populate('projectId', 'name key')
        .select('key title status priority type projectId assignee')
        .limit(limitNum)
        .lean();

      results.tasks = tasks;
    }

    if (!type || type === 'projects') {
      const projects = await Project.find({
        organizationId,
        $or: [
          { name: searchRegex },
          { key: searchRegex },
          { description: searchRegex },
        ],
      })
        .select('key name methodology status')
        .limit(limitNum)
        .lean();

      results.projects = projects;
    }

    res.status(200).json({
      success: true,
      data: results,
    } as ApiResponse);
  } catch (error) {
    logger.error('Search error:', error);
    res.status(500).json({ success: false, error: 'Search failed' } as ApiResponse);
  }
};

export const searchTasks = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user?.organizationId;
    const { projectId } = req.params;
    const {
      q,
      status,
      type,
      priority,
      assignee,
      labels,
      page = '1',
      limit = '20',
    } = req.query;

    const query: Record<string, unknown> = { organizationId };
    if (projectId) query.projectId = projectId;

    if (q && typeof q === 'string' && q.trim().length >= 2) {
      const searchRegex = new RegExp(q.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { key: searchRegex },
        { description: searchRegex },
      ];
    }

    if (status) query['status.id'] = status;
    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (assignee) query.assignee = assignee;
    if (labels) query.labels = { $in: (labels as string).split(',') };

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 100);
    const skip = (pageNum - 1) * limitNum;

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate('assignee', 'profile.firstName profile.lastName profile.avatar')
        .populate('projectId', 'name key')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Task.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        tasks,
        pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
      },
    } as ApiResponse);
  } catch (error) {
    logger.error('Search tasks error:', error);
    res.status(500).json({ success: false, error: 'Search failed' } as ApiResponse);
  }
};
