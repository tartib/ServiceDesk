/**
 * Leaderboard Service v2
 *
 * Aggregates gamification profiles for org/team/project scopes
 * with period filtering. Supports individual rank lookup and team leaderboards.
 */

import mongoose from 'mongoose';
import { GamificationProfile, PointsLedger, OrgGamificationConfig } from '../models';
import {
  LeaderboardEntry,
  LeaderboardOptions,
  LeaderboardPeriod,
  LeaderboardScope,
  TeamLeaderboardEntry,
} from '../domain';
import logger from '../../../utils/logger';

export class LeaderboardService {
  /**
   * Get leaderboard entries for the given scope and period.
   */
  async getLeaderboard(
    organizationId: string,
    options: LeaderboardOptions,
  ): Promise<LeaderboardEntry[]> {
    const orgConfig = await OrgGamificationConfig.findOne({ organizationId }).lean();
    if (orgConfig && !orgConfig.leaderboardEnabled) return [];

    const limit = options.limit ?? 25;
    const skip = ((options.page ?? 1) - 1) * limit;

    if (options.period === LeaderboardPeriod.ALL_TIME) {
      return this._allTimeLeaderboard(organizationId, limit, skip);
    }

    return this._periodLeaderboard(organizationId, options.period, limit, skip);
  }

  /**
   * Get a specific user's rank even if outside top N.
   */
  async getMyRank(
    userId: string,
    organizationId: string,
    period: LeaderboardPeriod,
  ): Promise<{ rank: number; totalPoints: number } | null> {
    if (period === LeaderboardPeriod.ALL_TIME) {
      const profile = await GamificationProfile.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        organizationId: new mongoose.Types.ObjectId(organizationId),
      }).lean();

      if (!profile) return null;

      const rank = await GamificationProfile.countDocuments({
        organizationId: new mongoose.Types.ObjectId(organizationId),
        totalPoints: { $gt: profile.totalPoints },
      }) + 1;

      return { rank, totalPoints: profile.totalPoints };
    }

    // Period-based rank via ledger aggregation
    const dateFilter = this._getDateFilter(period);
    const pipeline: any[] = [
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          createdAt: dateFilter,
          pointsDelta: { $gt: 0 },
        },
      },
      { $group: { _id: '$userId', totalPoints: { $sum: '$pointsDelta' } } },
      { $sort: { totalPoints: -1 } },
    ];

    const results = await PointsLedger.aggregate(pipeline);
    const idx = results.findIndex((r) => r._id.toString() === userId);

    if (idx === -1) return null;
    return { rank: idx + 1, totalPoints: results[idx].totalPoints };
  }

  /**
   * Team leaderboard: aggregate points by team.
   */
  async getTeamLeaderboard(
    organizationId: string,
    period: LeaderboardPeriod,
    limit: number = 10,
  ): Promise<TeamLeaderboardEntry[]> {
    // For team leaderboard, we aggregate profiles and group by a team field
    // Since team info may come from user records, we do a simple aggregation
    // In a real scenario, you'd join with user/team collections
    logger.debug('[LeaderboardService] Team leaderboard requested', { organizationId, period });

    // For now, return the org-level aggregation as a placeholder
    // Team integration will use the internal API to resolve team membership
    return [];
  }

  // ── Private helpers ────────────────────────────────────────

  private async _allTimeLeaderboard(
    organizationId: string,
    limit: number,
    skip: number,
  ): Promise<LeaderboardEntry[]> {
    const profiles = await GamificationProfile.find({
      organizationId: new mongoose.Types.ObjectId(organizationId),
    })
      .sort({ totalPoints: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name avatar')
      .lean();

    return profiles.map((p, idx) => ({
      rank: skip + idx + 1,
      userId: p.userId?.toString() || '',
      userName: (p.userId as any)?.name,
      avatarUrl: (p.userId as any)?.avatar,
      totalPoints: p.totalPoints,
      currentLevel: p.currentLevel,
      growthState: p.growthState,
      currentStreak: p.currentStreak,
    }));
  }

  private async _periodLeaderboard(
    organizationId: string,
    period: LeaderboardPeriod,
    limit: number,
    skip: number,
  ): Promise<LeaderboardEntry[]> {
    const dateFilter = this._getDateFilter(period);

    const pipeline: any[] = [
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          createdAt: dateFilter,
          pointsDelta: { $gt: 0 },
        },
      },
      { $group: { _id: '$userId', totalPoints: { $sum: '$pointsDelta' } } },
      { $sort: { totalPoints: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'gamification_profiles',
          let: { uid: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$userId', '$$uid'] },
                    { $eq: ['$organizationId', new mongoose.Types.ObjectId(organizationId)] },
                  ],
                },
              },
            },
          ],
          as: 'profile',
        },
      },
      { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
    ];

    const results = await PointsLedger.aggregate(pipeline);

    return results.map((r, idx) => ({
      rank: skip + idx + 1,
      userId: r._id?.toString() || '',
      totalPoints: r.totalPoints,
      currentLevel: r.profile?.currentLevel ?? 0,
      growthState: r.profile?.growthState ?? 'seed',
      currentStreak: r.profile?.currentStreak ?? 0,
    }));
  }

  private _getDateFilter(period: LeaderboardPeriod): { $gte: Date } {
    const now = new Date();
    let start: Date;

    switch (period) {
      case LeaderboardPeriod.DAILY:
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case LeaderboardPeriod.WEEKLY:
        start = new Date(now);
        start.setDate(start.getDate() - start.getDay());
        start.setHours(0, 0, 0, 0);
        break;
      case LeaderboardPeriod.MONTHLY:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        start = new Date(0);
    }

    return { $gte: start };
  }
}

export const leaderboardService = new LeaderboardService();
