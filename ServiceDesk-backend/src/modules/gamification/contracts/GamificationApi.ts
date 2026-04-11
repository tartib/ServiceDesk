/**
 * Gamification Internal API Implementation
 */

import mongoose from 'mongoose';
import { IGamificationApi } from '../../../shared/internal-api/types';
import { GamificationProfile } from '../models';
import { leaderboardService } from '../services/LeaderboardService';
import { LeaderboardPeriod, LeaderboardScope } from '../domain';

export class GamificationApiImpl implements IGamificationApi {
  readonly moduleName = 'gamification';

  async getProfile(userId: string, organizationId: string): Promise<any | null> {
    return GamificationProfile.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    }).lean();
  }

  async getLeaderboard(organizationId: string, scope?: string, period?: string): Promise<any[]> {
    return leaderboardService.getLeaderboard(organizationId, {
      scope: (scope as LeaderboardScope) || LeaderboardScope.ORGANIZATION,
      period: (period as LeaderboardPeriod) || LeaderboardPeriod.WEEKLY,
    });
  }
}
