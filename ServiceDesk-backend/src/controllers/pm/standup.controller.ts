import { Response } from 'express';
import logger from '../../utils/logger';
import { validationResult } from 'express-validator';
import Standup from '../../models/pm/Standup';
import Project from '../../models/pm/Project';
import { PMAuthRequest, ApiResponse } from '../../types/pm';
import { getMemberRole } from '../../utils/pm/permissions';

// Helper to check if user is a leader (lead or manager)
function isLeader(role: string | null): boolean {
  return role === 'lead' || role === 'manager';
}

export const createStandup = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array().map((e: { type?: string; msg: string }) => ({ field: e.type, message: e.msg })),
      } as ApiResponse);
      return;
    }

    const currentUserId = req.user?.id;
    const { projectId } = req.params;
    const { userId, yesterday, today, blockers, status, isTeamStandup } = req.body;

    if (!currentUserId) {
      res.status(401).json({
        success: false,
        error: 'User ID is required',
      } as ApiResponse);
      return;
    }

    // Get project with members
    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
      return;
    }

    const organizationId = project.organizationId || req.user?.organizationId;
    const userRole = getMemberRole(project.members as any, currentUserId!);

    // Determine target user and if this is written by leader for someone else
    const targetUserId = userId || currentUserId;
    const isWritingForOther = targetUserId !== currentUserId;

    // Only leaders can write standup for others
    if (isWritingForOther && !isLeader(userRole)) {
      res.status(403).json({
        success: false,
        error: 'Only team leaders can write standups for other members',
      } as ApiResponse);
      return;
    }

    // Get today's date at midnight
    const today_date = new Date();
    today_date.setHours(0, 0, 0, 0);

    // Check if standup already exists for this user on this date
    const existingStandup = await Standup.findOne({
      projectId,
      userId: targetUserId,
      date: today_date,
      isTeamStandup: isTeamStandup || false,
    });

    if (existingStandup) {
      res.status(400).json({
        success: false,
        error: 'Standup already exists for this user today. Use PUT to update.',
      } as ApiResponse);
      return;
    }

    const standup = new Standup({
      projectId,
      organizationId,
      userId: targetUserId,
      yesterday: yesterday || undefined,
      today,
      blockers: blockers || [],
      status: status || 'draft',
      date: today_date,
      writtenBy: isWritingForOther ? currentUserId : undefined,
      isTeamStandup: isTeamStandup || false,
    });

    await standup.save();

    // Populate user info
    await standup.populate([
      { path: 'userId', select: 'profile.firstName profile.lastName profile.avatar email' },
      { path: 'writtenBy', select: 'profile.firstName profile.lastName profile.avatar email' },
    ]);

    res.status(201).json({
      success: true,
      data: { standup },
      message: 'Standup created successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Create standup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create standup',
    } as ApiResponse);
  }
};

export const getStandups = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { date, userId, status } = req.query;

    const query: Record<string, unknown> = { projectId };

    if (date) {
      const queryDate = new Date(date as string);
      queryDate.setHours(0, 0, 0, 0);
      query.date = queryDate;
    }

    if (userId) {
      query.userId = userId;
    }

    if (status) {
      query.status = status;
    }

    const standups = await Standup.find(query)
      .populate([
        { path: 'userId', select: 'profile.firstName profile.lastName profile.avatar email' },
        { path: 'writtenBy', select: 'profile.firstName profile.lastName profile.avatar email' },
      ])
      .sort({ date: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { standups },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get standups error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch standups',
    } as ApiResponse);
  }
};

export const getStandup = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { standupId } = req.params;

    const standup = await Standup.findById(standupId)
      .populate([
        { path: 'userId', select: 'profile.firstName profile.lastName profile.avatar email' },
        { path: 'writtenBy', select: 'profile.firstName profile.lastName profile.avatar email' },
      ]);

    if (!standup) {
      res.status(404).json({
        success: false,
        error: 'Standup not found',
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: { standup },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get standup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch standup',
    } as ApiResponse);
  }
};

export const updateStandup = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array().map((e: { type?: string; msg: string }) => ({ field: e.type, message: e.msg })),
      } as ApiResponse);
      return;
    }

    const currentUserId = req.user?.id;
    const { standupId } = req.params;

    if (!currentUserId) {
      res.status(401).json({
        success: false,
        error: 'User ID is required',
      } as ApiResponse);
      return;
    }

    const standup = await Standup.findById(standupId);
    if (!standup) {
      res.status(404).json({
        success: false,
        error: 'Standup not found',
      } as ApiResponse);
      return;
    }

    // Get project to check permissions
    const project = await Project.findById(standup.projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
      return;
    }

    const userRole = getMemberRole(project.members as any, currentUserId!);
    const isOwner = standup.userId.toString() === currentUserId;

    // Check if user can edit this standup
    // Users can only edit their own standup, leaders can edit any
    if (!isOwner && !isLeader(userRole)) {
      res.status(403).json({
        success: false,
        error: 'You can only edit your own standup',
      } as ApiResponse);
      return;
    }

    // Check if standup is from today (can only edit same day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const standupDate = new Date(standup.date);
    standupDate.setHours(0, 0, 0, 0);

    if (today.getTime() !== standupDate.getTime() && !isLeader(userRole)) {
      res.status(403).json({
        success: false,
        error: 'You can only edit standups from today',
      } as ApiResponse);
      return;
    }

    const { yesterday, today: todayField, blockers, status } = req.body;

    if (yesterday !== undefined) standup.yesterday = yesterday;
    if (todayField !== undefined) standup.today = todayField;
    if (blockers !== undefined) standup.blockers = blockers;
    if (status !== undefined) standup.status = status;

    await standup.save();

    await standup.populate([
      { path: 'userId', select: 'profile.firstName profile.lastName profile.avatar email' },
      { path: 'writtenBy', select: 'profile.firstName profile.lastName profile.avatar email' },
    ]);

    res.status(200).json({
      success: true,
      data: { standup },
      message: 'Standup updated successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Update standup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update standup',
    } as ApiResponse);
  }
};

export const deleteStandup = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { standupId } = req.params;

    const standup = await Standup.findById(standupId);
    if (!standup) {
      res.status(404).json({
        success: false,
        error: 'Standup not found',
      } as ApiResponse);
      return;
    }

    await Standup.findByIdAndDelete(standupId);

    res.status(200).json({
      success: true,
      message: 'Standup deleted successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Delete standup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete standup',
    } as ApiResponse);
  }
};

export const getTodayStandups = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const standups = await Standup.find({
      projectId,
      date: today,
      status: 'published',
    })
      .populate([
        { path: 'userId', select: 'profile.firstName profile.lastName profile.avatar email' },
        { path: 'writtenBy', select: 'profile.firstName profile.lastName profile.avatar email' },
      ])
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { standups },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get today standups error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch today standups',
    } as ApiResponse);
  }
};

export const getMyStandup = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { projectId } = req.params;
    const { date } = req.query;

    let queryDate: Date;
    if (date) {
      queryDate = new Date(date as string);
    } else {
      queryDate = new Date();
    }
    queryDate.setHours(0, 0, 0, 0);

    const standup = await Standup.findOne({
      projectId,
      userId,
      date: queryDate,
    }).populate([
      { path: 'userId', select: 'profile.firstName profile.lastName profile.avatar email' },
      { path: 'writtenBy', select: 'profile.firstName profile.lastName profile.avatar email' },
    ]);

    res.status(200).json({
      success: true,
      data: { standup },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get my standup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch standup',
    } as ApiResponse);
  }
};

// Get standup summary for leaders (User Story 5)
export const getStandupSummary = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { date } = req.query;

    // Get project with members
    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
      return;
    }

    let queryDate: Date;
    if (date) {
      queryDate = new Date(date as string);
    } else {
      queryDate = new Date();
    }
    queryDate.setHours(0, 0, 0, 0);

    // Get all standups for the date
    const standups = await Standup.find({
      projectId,
      date: queryDate,
      status: 'published',
    }).populate([
      { path: 'userId', select: 'profile.firstName profile.lastName profile.avatar email' },
      { path: 'writtenBy', select: 'profile.firstName profile.lastName profile.avatar email' },
    ]);

    // Get total team members count
    const totalMembers = project.members?.length || 0;
    const membersWithStandup = standups.length;
    const membersWithoutStandup = totalMembers - membersWithStandup;

    // Collect all blockers
    const allBlockers: Array<{ user: unknown; blocker: string }> = [];
    standups.forEach((standup) => {
      standup.blockers.forEach((blocker) => {
        if (blocker && blocker.trim()) {
          allBlockers.push({
            user: standup.userId,
            blocker,
          });
        }
      });
    });

    // Count task mentions (simple word frequency from "today" field)
    const taskMentions: Record<string, number> = {};
    standups.forEach((standup) => {
      const words = standup.today.toLowerCase().split(/\s+/);
      words.forEach((word) => {
        if (word.length > 4) {
          taskMentions[word] = (taskMentions[word] || 0) + 1;
        }
      });
    });

    // Get top mentioned words
    const topMentions = Object.entries(taskMentions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));

    // Get members who haven't submitted standup
    const standupUserIds = standups.map((s) => s.userId?.toString());
    const membersWithoutStandupList = project.members?.filter(
      (m: any) => {
        const memberId = typeof m.userId === 'string' ? m.userId : m.userId?.toString();
        return !standupUserIds.includes(memberId);
      }
    ) || [];

    res.status(200).json({
      success: true,
      data: {
        summary: {
          date: queryDate,
          totalMembers,
          membersWithStandup,
          membersWithoutStandup,
          completionRate: totalMembers > 0 ? Math.round((membersWithStandup / totalMembers) * 100) : 0,
        },
        blockers: allBlockers,
        blockersCount: allBlockers.length,
        topMentions,
        standups,
        membersWithoutStandup: membersWithoutStandupList,
      },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get standup summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch standup summary',
    } as ApiResponse);
  }
};
