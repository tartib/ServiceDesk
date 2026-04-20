/**
 * Gamification Profile Controller
 */

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { GamificationProfile, PointsLedger } from '../models';
import { streakEngine } from '../services/StreakEngine';
import logger from '../../../utils/logger';

/**
 * GET /gamification/profile/me
 */
export async function getMyProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    const organizationId = (req as any).user?.organizationId;

    if (!userId || !organizationId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    let profile: any = await GamificationProfile.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    }).lean();

    if (!profile) {
      const created = await GamificationProfile.create({
        userId: new mongoose.Types.ObjectId(userId),
        organizationId: new mongoose.Types.ObjectId(organizationId),
      });
      profile = created.toObject();
    }

    const streakStatus = await streakEngine.getStreakStatus(userId, organizationId);

    // Recent ledger entries
    const recentPoints = await PointsLedger.find({
      userId: new mongoose.Types.ObjectId(userId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      data: {
        ...profile,
        streak: streakStatus,
        recentPoints,
      },
    });
  } catch (err) {
    logger.error('[ProfileController] getMyProfile error', { error: err });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

/**
 * GET /gamification/profile/:userId
 */
export async function getUserProfile(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.params;
    const organizationId = (req as any).user?.organizationId;

    if (!organizationId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const profile = await GamificationProfile.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    }).lean();

    if (!profile) {
      res.status(404).json({ success: false, message: 'Profile not found' });
      return;
    }

    const streakStatus = await streakEngine.getStreakStatus(userId, organizationId);

    res.json({
      success: true,
      data: {
        ...profile,
        streak: streakStatus,
      },
    });
  } catch (err) {
    logger.error('[ProfileController] getUserProfile error', { error: err });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
