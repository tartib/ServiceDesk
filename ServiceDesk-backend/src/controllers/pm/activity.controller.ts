import { Response } from 'express';
import logger from '../../utils/logger';
import Activity from '../../models/pm/Activity';
import { PMAuthRequest, ApiResponse } from '../../types/pm';

export const getProjectActivity = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [activities, total] = await Promise.all([
      Activity.find({ projectId })
        .populate('actor', 'profile.firstName profile.lastName profile.avatar email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Activity.countDocuments({ projectId }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        activities,
        pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
      },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get project activity error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch activity' } as ApiResponse);
  }
};

export const getTaskActivity = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;

    const activities = await Activity.find({ taskId })
      .populate('actor', 'profile.firstName profile.lastName profile.avatar email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      data: { activities },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get task activity error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch activity' } as ApiResponse);
  }
};

export const getUserActivity = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;
    const { page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [activities, total] = await Promise.all([
      Activity.find({ organizationId, actor: userId })
        .populate('projectId', 'name key')
        .populate('taskId', 'key title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Activity.countDocuments({ organizationId, actor: userId }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        activities,
        pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
      },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get user activity error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch activity' } as ApiResponse);
  }
};

export const getOrganizationFeed = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user?.organizationId;
    const { page = '1', limit = '30' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [activities, total] = await Promise.all([
      Activity.find({ organizationId })
        .populate('actor', 'profile.firstName profile.lastName profile.avatar email')
        .populate('projectId', 'name key')
        .populate('taskId', 'key title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Activity.countDocuments({ organizationId }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        activities,
        pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
      },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get organization feed error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch feed' } as ApiResponse);
  }
};
