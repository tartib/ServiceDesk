/**
 * Growth Engine
 *
 * Manages level calculation and growth state transitions.
 * Levels are derived from total points using a formula.
 * Growth states are threshold-based and admin-configurable.
 */

import mongoose from 'mongoose';
import { GamificationProfile, GrowthStateConfig } from '../models';
import { GrowthState, LevelChangeResult } from '../domain';
import logger from '../../../utils/logger';

// Default growth state thresholds (used when no org-specific config exists)
const DEFAULT_GROWTH_THRESHOLDS: Array<{ state: GrowthState; minPoints: number; minLevel: number }> = [
  { state: GrowthState.SEED, minPoints: 0, minLevel: 0 },
  { state: GrowthState.SPROUT, minPoints: 100, minLevel: 2 },
  { state: GrowthState.BUD, minPoints: 500, minLevel: 5 },
  { state: GrowthState.BLOOM, minPoints: 2000, minLevel: 10 },
  { state: GrowthState.FULL_BLOOM, minPoints: 10000, minLevel: 20 },
];

export class GrowthEngine {
  /**
   * Calculate level from total points.
   * Formula: floor(sqrt(totalPoints / 100))
   */
  calculateLevel(totalPoints: number): number {
    if (totalPoints <= 0) return 0;
    return Math.floor(Math.sqrt(totalPoints / 100));
  }

  /**
   * Recalculate level and growth state for a user profile.
   * Returns what changed for event emission.
   */
  async recalculate(userId: string, organizationId: string): Promise<LevelChangeResult> {
    const profile = await GamificationProfile.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });

    if (!profile) {
      return {
        levelChanged: false,
        growthStateChanged: false,
        previousLevel: 0,
        newLevel: 0,
        previousGrowthState: GrowthState.SEED,
        newGrowthState: GrowthState.SEED,
      };
    }

    const previousLevel = profile.currentLevel;
    const previousGrowthState = profile.growthState;

    const newLevel = this.calculateLevel(profile.totalPoints);
    const newGrowthState = await this._resolveGrowthState(
      profile.totalPoints,
      newLevel,
      organizationId,
    );

    const levelChanged = newLevel !== previousLevel;
    const growthStateChanged = newGrowthState !== previousGrowthState;

    if (levelChanged || growthStateChanged) {
      await GamificationProfile.updateOne(
        { _id: profile._id },
        {
          $set: {
            currentLevel: newLevel,
            growthState: newGrowthState,
          },
        },
      );

      logger.info('[GrowthEngine] Level/state updated', {
        userId,
        previousLevel,
        newLevel,
        previousGrowthState,
        newGrowthState,
      });
    }

    return {
      levelChanged,
      growthStateChanged,
      previousLevel,
      newLevel,
      previousGrowthState,
      newGrowthState,
    };
  }

  /**
   * Resolve the growth state based on thresholds.
   */
  private async _resolveGrowthState(
    totalPoints: number,
    level: number,
    organizationId: string,
  ): Promise<GrowthState> {
    // Check org-specific configs first
    const orgConfigs = await GrowthStateConfig.find({
      $or: [
        { organizationId: new mongoose.Types.ObjectId(organizationId) },
        { organizationId: null },
        { organizationId: { $exists: false } },
      ],
    })
      .sort({ minPoints: -1 })
      .lean();

    const thresholds = orgConfigs.length > 0
      ? orgConfigs.map((c) => ({ state: c.state, minPoints: c.minPoints, minLevel: c.minLevel }))
      : DEFAULT_GROWTH_THRESHOLDS;

    // Sort descending by minPoints to find highest matching state
    const sorted = [...thresholds].sort((a, b) => b.minPoints - a.minPoints);

    for (const t of sorted) {
      if (totalPoints >= t.minPoints && level >= t.minLevel) {
        return t.state;
      }
    }

    return GrowthState.SEED;
  }
}

export const growthEngine = new GrowthEngine();
