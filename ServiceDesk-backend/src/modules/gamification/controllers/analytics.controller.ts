/**
 * Gamification Analytics Controller
 */

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { GamificationProfile, PointsLedger, UserAchievement } from '../models';
import logger from '../../../utils/logger';

/**
 * GET /gamification/analytics/points-over-time
 */
export async function getPointsOverTime(req: Request, res: Response): Promise<void> {
  try {
    const organizationId = (req as any).user?.organizationId;
    if (!organizationId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const days = parseInt(req.query.days as string) || 30;
    const start = new Date();
    start.setDate(start.getDate() - days);

    const data = await PointsLedger.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          createdAt: { $gte: start },
          pointsDelta: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalPoints: { $sum: '$pointsDelta' },
          transactions: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ success: true, data });
  } catch (err) {
    logger.error('[AnalyticsController] getPointsOverTime error', { error: err });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

/**
 * GET /gamification/analytics/streaks
 */
export async function getStreakAnalytics(req: Request, res: Response): Promise<void> {
  try {
    const organizationId = (req as any).user?.organizationId;
    if (!organizationId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const data = await GamificationProfile.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
      {
        $group: {
          _id: null,
          avgStreak: { $avg: '$currentStreak' },
          maxStreak: { $max: '$longestStreak' },
          activeStreaks: { $sum: { $cond: [{ $gt: ['$currentStreak', 0] }, 1, 0] } },
          totalUsers: { $sum: 1 },
        },
      },
    ]);

    res.json({ success: true, data: data[0] || { avgStreak: 0, maxStreak: 0, activeStreaks: 0, totalUsers: 0 } });
  } catch (err) {
    logger.error('[AnalyticsController] getStreakAnalytics error', { error: err });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

/**
 * GET /gamification/analytics/engagement
 */
export async function getEngagementAnalytics(req: Request, res: Response): Promise<void> {
  try {
    const organizationId = (req as any).user?.organizationId;
    if (!organizationId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const days = parseInt(req.query.days as string) || 7;
    const start = new Date();
    start.setDate(start.getDate() - days);

    const data = await PointsLedger.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          createdAt: { $gte: start },
        },
      },
      {
        $group: {
          _id: '$userId',
          totalPoints: { $sum: '$pointsDelta' },
          transactions: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          activeUsers: { $sum: 1 },
          avgPointsPerUser: { $avg: '$totalPoints' },
          avgTransactionsPerUser: { $avg: '$transactions' },
        },
      },
    ]);

    res.json({ success: true, data: data[0] || { activeUsers: 0, avgPointsPerUser: 0, avgTransactionsPerUser: 0 } });
  } catch (err) {
    logger.error('[AnalyticsController] getEngagementAnalytics error', { error: err });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

/**
 * GET /gamification/analytics/achievements-unlocked
 */
export async function getAchievementsUnlocked(req: Request, res: Response): Promise<void> {
  try {
    const organizationId = (req as any).user?.organizationId;
    if (!organizationId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const days = parseInt(req.query.days as string) || 30;
    const start = new Date();
    start.setDate(start.getDate() - days);

    const data = await UserAchievement.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          unlockedAt: { $gte: start },
        },
      },
      {
        $group: {
          _id: '$achievementCode',
          count: { $sum: 1 },
          latestUnlock: { $max: '$unlockedAt' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({ success: true, data });
  } catch (err) {
    logger.error('[AnalyticsController] getAchievementsUnlocked error', { error: err });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
