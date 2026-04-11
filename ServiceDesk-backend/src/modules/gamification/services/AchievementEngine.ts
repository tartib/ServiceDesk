/**
 * Achievement Engine
 *
 * Evaluates achievement definitions against user state,
 * unlocks achievements idempotently, and tracks progress.
 */

import mongoose from 'mongoose';
import { GamificationProfile, AchievementDefinition, UserAchievement, OrgGamificationConfig } from '../models';
import { IAchievementDefinitionDoc, IAchievementConditionDoc } from '../models/AchievementDefinition';
import { AchievementUnlockedPayload } from '../domain';
import logger from '../../../utils/logger';

export interface AchievementContext {
  tasksCompletedTotal?: number;
  sprintsCompletedTotal?: number;
  [key: string]: unknown;
}

export class AchievementEngine {
  /**
   * Evaluate all applicable achievements for a user.
   * Returns newly unlocked achievements.
   */
  async evaluateAchievements(
    userId: string,
    organizationId: string,
    context: AchievementContext = {},
  ): Promise<AchievementUnlockedPayload[]> {
    const orgConfig = await OrgGamificationConfig.findOne({ organizationId }).lean();
    if (orgConfig && !orgConfig.achievementsEnabled) return [];

    const profile = await GamificationProfile.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    }).lean();

    if (!profile) return [];

    // Load all definitions (global + org-specific)
    const definitions = await AchievementDefinition.find({
      $or: [
        { organizationId: null },
        { organizationId: { $exists: false } },
        { organizationId: new mongoose.Types.ObjectId(organizationId) },
      ],
    }).lean();

    // Load already unlocked
    const unlocked = await UserAchievement.find({
      userId: new mongoose.Types.ObjectId(userId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    }).lean();

    const unlockedCodes = new Set(unlocked.map((u) => u.achievementCode));
    const newlyUnlocked: AchievementUnlockedPayload[] = [];

    for (const def of definitions) {
      // Skip already unlocked (unless repeatable)
      if (unlockedCodes.has(def.code) && !def.repeatable) continue;

      // Evaluate conditions
      if (this._evaluateConditions(def.conditions, profile, context)) {
        const result = await this.unlockAchievement(userId, organizationId, def);
        if (result) {
          newlyUnlocked.push(result);
        }
      }
    }

    return newlyUnlocked;
  }

  /**
   * Unlock a specific achievement. Idempotent via unique index.
   */
  async unlockAchievement(
    userId: string,
    organizationId: string,
    definition: Pick<IAchievementDefinitionDoc, 'code' | 'name' | 'nameAr' | 'category'>,
  ): Promise<AchievementUnlockedPayload | null> {
    try {
      await UserAchievement.create({
        userId: new mongoose.Types.ObjectId(userId),
        organizationId: new mongoose.Types.ObjectId(organizationId),
        achievementCode: definition.code,
        unlockedAt: new Date(),
        notified: false,
      });

      // Increment achievement count on profile
      await GamificationProfile.updateOne(
        {
          userId: new mongoose.Types.ObjectId(userId),
          organizationId: new mongoose.Types.ObjectId(organizationId),
        },
        { $inc: { achievementCount: 1 } },
      );

      logger.info('[AchievementEngine] Achievement unlocked', {
        userId,
        achievementCode: definition.code,
      });

      return {
        userId,
        organizationId,
        achievementCode: definition.code,
        achievementName: definition.name,
        category: definition.category,
      };
    } catch (err: any) {
      if (err.code === 11000) {
        logger.debug('[AchievementEngine] Achievement already unlocked (idempotent)', {
          userId,
          achievementCode: definition.code,
        });
        return null;
      }
      throw err;
    }
  }

  /**
   * Get all achievements for a user (unlocked + locked with progress).
   */
  async getUserAchievements(
    userId: string,
    organizationId: string,
  ): Promise<Array<{
    code: string;
    name: string;
    nameAr?: string;
    description?: string;
    descriptionAr?: string;
    category: string;
    icon: string;
    hidden: boolean;
    unlocked: boolean;
    unlockedAt?: Date;
    progress?: number;
  }>> {
    const definitions = await AchievementDefinition.find({
      $or: [
        { organizationId: null },
        { organizationId: { $exists: false } },
        { organizationId: new mongoose.Types.ObjectId(organizationId) },
      ],
    }).lean();

    const unlocked = await UserAchievement.find({
      userId: new mongoose.Types.ObjectId(userId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    }).lean();

    const unlockedMap = new Map(unlocked.map((u) => [u.achievementCode, u]));

    return definitions.map((def) => {
      const userAch = unlockedMap.get(def.code);
      return {
        code: def.code,
        name: def.name,
        nameAr: def.nameAr,
        description: def.description,
        descriptionAr: def.descriptionAr,
        category: def.category,
        icon: def.icon,
        hidden: def.hidden && !userAch,
        unlocked: !!userAch,
        unlockedAt: userAch?.unlockedAt,
        progress: userAch?.progress,
      };
    });
  }

  // ── Private helpers ────────────────────────────────────────

  private _evaluateConditions(
    conditions: IAchievementConditionDoc[],
    profile: Record<string, any>,
    context: AchievementContext,
  ): boolean {
    for (const cond of conditions) {
      const value = this._resolveValue(cond.type, cond.customField, profile, context);
      if (!this._compare(value, cond.operator, cond.value)) return false;
    }
    return true;
  }

  private _resolveValue(
    type: string,
    customField: string | undefined,
    profile: Record<string, any>,
    context: AchievementContext,
  ): number {
    switch (type) {
      case 'total_points': return profile.totalPoints ?? 0;
      case 'current_level': return profile.currentLevel ?? 0;
      case 'current_streak': return profile.currentStreak ?? 0;
      case 'tasks_completed': return (context.tasksCompletedTotal as number) ?? 0;
      case 'sprints_completed': return (context.sprintsCompletedTotal as number) ?? 0;
      case 'custom': return customField ? ((context[customField] as number) ?? 0) : 0;
      default: return 0;
    }
  }

  private _compare(value: number, operator: string, target: number): boolean {
    switch (operator) {
      case 'gte': return value >= target;
      case 'eq': return value === target;
      case 'lte': return value <= target;
      default: return false;
    }
  }
}

export const achievementEngine = new AchievementEngine();
