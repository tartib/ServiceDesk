/**
 * Gamification Admin Controller
 *
 * CRUD for rules, achievement definitions, growth state configs,
 * org gamification config, and audit log.
 */

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import {
  GamificationRule,
  AchievementDefinition,
  GrowthStateConfig,
  OrgGamificationConfig,
  PointsLedger,
} from '../models';
import logger from '../../../utils/logger';

// ── Rules CRUD ──────────────────────────────────────────────

export async function listRules(req: Request, res: Response): Promise<void> {
  try {
    const organizationId = (req as any).user?.organizationId;
    const rules = await GamificationRule.find({
      $or: [
        { organizationId: null },
        { organizationId: { $exists: false } },
        ...(organizationId ? [{ organizationId: new mongoose.Types.ObjectId(organizationId) }] : []),
      ],
    })
      .sort({ priority: -1, code: 1 })
      .lean();

    res.json({ success: true, data: rules });
  } catch (err) {
    logger.error('[AdminController] listRules error', { error: err });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function createRule(req: Request, res: Response): Promise<void> {
  try {
    const organizationId = (req as any).user?.organizationId;
    const rule = await GamificationRule.create({
      ...req.body,
      organizationId: organizationId ? new mongoose.Types.ObjectId(organizationId) : undefined,
    });
    res.status(201).json({ success: true, data: rule });
  } catch (err: any) {
    if (err.code === 11000) {
      res.status(409).json({ success: false, message: 'Rule code already exists' });
      return;
    }
    logger.error('[AdminController] createRule error', { error: err });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function updateRule(req: Request, res: Response): Promise<void> {
  try {
    const rule = await GamificationRule.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true },
    );
    if (!rule) {
      res.status(404).json({ success: false, message: 'Rule not found' });
      return;
    }
    res.json({ success: true, data: rule });
  } catch (err) {
    logger.error('[AdminController] updateRule error', { error: err });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function deleteRule(req: Request, res: Response): Promise<void> {
  try {
    const rule = await GamificationRule.findByIdAndDelete(req.params.id);
    if (!rule) {
      res.status(404).json({ success: false, message: 'Rule not found' });
      return;
    }
    res.json({ success: true, message: 'Rule deleted' });
  } catch (err) {
    logger.error('[AdminController] deleteRule error', { error: err });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ── Achievement Definitions CRUD ─────────────────────────────

export async function listAchievementDefs(req: Request, res: Response): Promise<void> {
  try {
    const organizationId = (req as any).user?.organizationId;
    const defs = await AchievementDefinition.find({
      $or: [
        { organizationId: null },
        { organizationId: { $exists: false } },
        ...(organizationId ? [{ organizationId: new mongoose.Types.ObjectId(organizationId) }] : []),
      ],
    })
      .sort({ category: 1, code: 1 })
      .lean();

    res.json({ success: true, data: defs });
  } catch (err) {
    logger.error('[AdminController] listAchievementDefs error', { error: err });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function createAchievementDef(req: Request, res: Response): Promise<void> {
  try {
    const organizationId = (req as any).user?.organizationId;
    const def = await AchievementDefinition.create({
      ...req.body,
      organizationId: organizationId ? new mongoose.Types.ObjectId(organizationId) : undefined,
    });
    res.status(201).json({ success: true, data: def });
  } catch (err: any) {
    if (err.code === 11000) {
      res.status(409).json({ success: false, message: 'Achievement code already exists' });
      return;
    }
    logger.error('[AdminController] createAchievementDef error', { error: err });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function updateAchievementDef(req: Request, res: Response): Promise<void> {
  try {
    const def = await AchievementDefinition.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true },
    );
    if (!def) {
      res.status(404).json({ success: false, message: 'Achievement definition not found' });
      return;
    }
    res.json({ success: true, data: def });
  } catch (err) {
    logger.error('[AdminController] updateAchievementDef error', { error: err });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function deleteAchievementDef(req: Request, res: Response): Promise<void> {
  try {
    const def = await AchievementDefinition.findByIdAndDelete(req.params.id);
    if (!def) {
      res.status(404).json({ success: false, message: 'Achievement definition not found' });
      return;
    }
    res.json({ success: true, message: 'Achievement definition deleted' });
  } catch (err) {
    logger.error('[AdminController] deleteAchievementDef error', { error: err });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ── Growth State Configs ─────────────────────────────────────

export async function listGrowthStates(req: Request, res: Response): Promise<void> {
  try {
    const organizationId = (req as any).user?.organizationId;
    const configs = await GrowthStateConfig.find({
      $or: [
        { organizationId: null },
        { organizationId: { $exists: false } },
        ...(organizationId ? [{ organizationId: new mongoose.Types.ObjectId(organizationId) }] : []),
      ],
    })
      .sort({ minPoints: 1 })
      .lean();

    res.json({ success: true, data: configs });
  } catch (err) {
    logger.error('[AdminController] listGrowthStates error', { error: err });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function upsertGrowthStates(req: Request, res: Response): Promise<void> {
  try {
    const organizationId = (req as any).user?.organizationId;
    const { states } = req.body; // Array of growth state configs

    if (!Array.isArray(states)) {
      res.status(400).json({ success: false, message: 'states must be an array' });
      return;
    }

    const orgId = organizationId ? new mongoose.Types.ObjectId(organizationId) : undefined;

    // Delete existing org-specific states and recreate
    if (orgId) {
      await GrowthStateConfig.deleteMany({ organizationId: orgId });
    }

    const docs = states.map((s: any) => ({
      ...s,
      organizationId: orgId,
    }));

    const created = await GrowthStateConfig.insertMany(docs);
    res.json({ success: true, data: created });
  } catch (err) {
    logger.error('[AdminController] upsertGrowthStates error', { error: err });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ── Org Gamification Config ──────────────────────────────────

export async function getOrgConfig(req: Request, res: Response): Promise<void> {
  try {
    const organizationId = (req as any).user?.organizationId;
    if (!organizationId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    let config = await OrgGamificationConfig.findOne({
      organizationId: new mongoose.Types.ObjectId(organizationId),
    }).lean();

    if (!config) {
      // Return defaults
      config = {
        organizationId: new mongoose.Types.ObjectId(organizationId),
        pointsEnabled: true,
        streaksEnabled: true,
        leaderboardEnabled: true,
        achievementsEnabled: true,
        celebrationsEnabled: true,
        dailyPointsCap: 500,
        streakMinDailyActivity: 1,
        streakCutoffHour: 0,
        timezone: 'Asia/Riyadh',
      } as any;
    }

    res.json({ success: true, data: config });
  } catch (err) {
    logger.error('[AdminController] getOrgConfig error', { error: err });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function updateOrgConfig(req: Request, res: Response): Promise<void> {
  try {
    const organizationId = (req as any).user?.organizationId;
    if (!organizationId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const config = await OrgGamificationConfig.findOneAndUpdate(
      { organizationId: new mongoose.Types.ObjectId(organizationId) },
      { $set: { ...req.body, organizationId: new mongoose.Types.ObjectId(organizationId) } },
      { new: true, upsert: true },
    );

    res.json({ success: true, data: config });
  } catch (err) {
    logger.error('[AdminController] updateOrgConfig error', { error: err });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ── Audit Log ────────────────────────────────────────────────

export async function getAuditLog(req: Request, res: Response): Promise<void> {
  try {
    const organizationId = (req as any).user?.organizationId;
    if (!organizationId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const page = parseInt(req.query.page as string) || 1;
    const skip = (page - 1) * limit;
    const userId = req.query.userId as string;

    const match: Record<string, any> = {
      organizationId: new mongoose.Types.ObjectId(organizationId),
    };
    if (userId) {
      match.userId = new mongoose.Types.ObjectId(userId);
    }

    const [entries, total] = await Promise.all([
      PointsLedger.find(match)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email')
        .lean(),
      PointsLedger.countDocuments(match),
    ]);

    res.json({
      success: true,
      data: {
        entries,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (err) {
    logger.error('[AdminController] getAuditLog error', { error: err });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
