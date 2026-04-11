/**
 * Achievement Controller
 */

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { achievementEngine } from '../services/AchievementEngine';
import { AchievementDefinition } from '../models';
import logger from '../../../utils/logger';

/**
 * GET /gamification/achievements/me
 */
export async function getMyAchievements(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    const organizationId = (req as any).user?.organizationId;

    if (!userId || !organizationId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const achievements = await achievementEngine.getUserAchievements(userId, organizationId);

    res.json({ success: true, data: achievements });
  } catch (err) {
    logger.error('[AchievementController] getMyAchievements error', { error: err });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

/**
 * GET /gamification/achievements/definitions
 */
export async function getAchievementDefinitions(req: Request, res: Response): Promise<void> {
  try {
    const organizationId = (req as any).user?.organizationId;

    const definitions = await AchievementDefinition.find({
      $or: [
        { organizationId: null },
        { organizationId: { $exists: false } },
        ...(organizationId ? [{ organizationId: new mongoose.Types.ObjectId(organizationId) }] : []),
      ],
    })
      .sort({ category: 1, name: 1 })
      .lean();

    res.json({ success: true, data: definitions });
  } catch (err) {
    logger.error('[AchievementController] getAchievementDefinitions error', { error: err });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

/**
 * GET /gamification/achievements/:userId
 */
export async function getUserAchievements(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.params;
    const organizationId = (req as any).user?.organizationId;

    if (!organizationId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const achievements = await achievementEngine.getUserAchievements(userId, organizationId);

    res.json({ success: true, data: achievements });
  } catch (err) {
    logger.error('[AchievementController] getUserAchievements error', { error: err });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
