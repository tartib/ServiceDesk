/**
 * Leaderboard Controller
 */

import { Request, Response } from 'express';
import { leaderboardService } from '../services/LeaderboardService';
import { LeaderboardPeriod, LeaderboardScope } from '../domain';
import logger from '../../../utils/logger';

/**
 * GET /gamification/leaderboard
 */
export async function getLeaderboard(req: Request, res: Response): Promise<void> {
  try {
    const organizationId = (req as any).user?.organizationId;
    if (!organizationId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const scope = (req.query.scope as LeaderboardScope) || LeaderboardScope.ORGANIZATION;
    const period = (req.query.period as LeaderboardPeriod) || LeaderboardPeriod.WEEKLY;
    const limit = parseInt(req.query.limit as string) || 25;
    const page = parseInt(req.query.page as string) || 1;

    const entries = await leaderboardService.getLeaderboard(organizationId, {
      scope,
      period,
      limit,
      page,
      teamId: req.query.teamId as string,
      projectId: req.query.projectId as string,
    });

    res.json({ success: true, data: entries });
  } catch (err) {
    logger.error('[LeaderboardController] getLeaderboard error', { error: err });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

/**
 * GET /gamification/leaderboard/my-rank
 */
export async function getMyRank(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    const organizationId = (req as any).user?.organizationId;

    if (!userId || !organizationId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const period = (req.query.period as LeaderboardPeriod) || LeaderboardPeriod.WEEKLY;

    const rank = await leaderboardService.getMyRank(userId, organizationId, period);

    res.json({ success: true, data: rank });
  } catch (err) {
    logger.error('[LeaderboardController] getMyRank error', { error: err });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

/**
 * GET /gamification/leaderboard/team
 */
export async function getTeamLeaderboard(req: Request, res: Response): Promise<void> {
  try {
    const organizationId = (req as any).user?.organizationId;
    if (!organizationId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const period = (req.query.period as LeaderboardPeriod) || LeaderboardPeriod.WEEKLY;
    const limit = parseInt(req.query.limit as string) || 10;

    const entries = await leaderboardService.getTeamLeaderboard(organizationId, period, limit);

    res.json({ success: true, data: entries });
  } catch (err) {
    logger.error('[LeaderboardController] getTeamLeaderboard error', { error: err });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
