/**
 * Points Engine
 *
 * Central points processor with idempotency, daily cap enforcement,
 * rule evaluation, and anti-manipulation guards.
 */

import mongoose from 'mongoose';
import { GamificationProfile, PointsLedger, GamificationRule, OrgGamificationConfig } from '../models';
import { ReasonCode } from '../domain';
import logger from '../../../utils/logger';

export interface AwardPointsInput {
  userId: string;
  organizationId: string;
  eventId: string;
  reasonCode: ReasonCode;
  pointsDelta: number;
  sourceModule: string;
  sourceEntityType: string;
  sourceEntityId: string;
  ruleId?: string;
  metadata?: Record<string, unknown>;
}

export interface RuleEvalContext {
  eventType: string;
  userId: string;
  organizationId: string;
  sourceEntityType?: string;
  priority?: string;
  statusCategory?: string;
  completedAt?: Date;
  dueDate?: Date;
  storyPoints?: number;
  [key: string]: unknown;
}

export interface AppliedRule {
  ruleId: string;
  ruleCode: string;
  pointsDelta: number;
  reasonCode: string;
}

export class PointsEngine {
  /**
   * Award points to a user — idempotent via (eventId, reasonCode, userId) unique index.
   * Enforces daily cap. Returns the new balance or null if deduplicated/capped.
   */
  async awardPoints(input: AwardPointsInput): Promise<number | null> {
    const { userId, organizationId, eventId, reasonCode, pointsDelta, sourceModule, sourceEntityType, sourceEntityId, ruleId, metadata } = input;

    // Check org config for daily cap
    const orgConfig = await OrgGamificationConfig.findOne({ organizationId }).lean();
    if (orgConfig && !orgConfig.pointsEnabled) {
      logger.debug('[PointsEngine] Points disabled for org', { organizationId });
      return null;
    }

    const today = new Date().toISOString().slice(0, 10);

    // Get or create profile
    let profile = await GamificationProfile.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });

    if (!profile) {
      profile = await GamificationProfile.create({
        userId: new mongoose.Types.ObjectId(userId),
        organizationId: new mongoose.Types.ObjectId(organizationId),
      });
    }

    // Daily cap check
    const dailyCap = orgConfig?.dailyPointsCap ?? 500;
    if (pointsDelta > 0) {
      const dailyEarned = profile.dailyPointsDate === today ? profile.dailyPointsEarned : 0;
      if (dailyEarned >= dailyCap) {
        logger.debug('[PointsEngine] Daily cap reached', { userId, dailyEarned, dailyCap });
        return null;
      }
      // Clamp to remaining cap
      const effective = Math.min(pointsDelta, dailyCap - dailyEarned);
      if (effective <= 0) return null;
      // Use effective delta for positive points
      return this._persistAward({ ...input, pointsDelta: effective }, profile, today);
    }

    // Penalties bypass daily cap
    return this._persistAward(input, profile, today);
  }

  private async _persistAward(
    input: AwardPointsInput,
    profile: InstanceType<typeof GamificationProfile>,
    today: string,
  ): Promise<number | null> {
    const { userId, organizationId, eventId, reasonCode, pointsDelta, sourceModule, sourceEntityType, sourceEntityId, ruleId, metadata } = input;

    const newBalance = profile.totalPoints + pointsDelta;

    // Idempotent insert — duplicate key error means already processed
    try {
      await PointsLedger.create({
        userId: new mongoose.Types.ObjectId(userId),
        organizationId: new mongoose.Types.ObjectId(organizationId),
        pointsDelta,
        reasonCode,
        sourceModule,
        sourceEntityType,
        sourceEntityId,
        eventId,
        ruleId,
        balanceAfter: newBalance,
        metadata,
      });
    } catch (err: any) {
      if (err.code === 11000) {
        logger.debug('[PointsEngine] Duplicate ledger entry (idempotent skip)', { eventId, reasonCode, userId });
        return null;
      }
      throw err;
    }

    // Update profile atomically
    const updateFields: Record<string, any> = {
      $inc: { totalPoints: pointsDelta },
    };

    if (pointsDelta > 0) {
      if (profile.dailyPointsDate === today) {
        updateFields.$inc.dailyPointsEarned = pointsDelta;
      } else {
        updateFields.$set = {
          ...(updateFields.$set || {}),
          dailyPointsDate: today,
          dailyPointsEarned: pointsDelta,
        };
      }
    }

    await GamificationProfile.updateOne(
      { _id: profile._id },
      updateFields,
    );

    logger.info('[PointsEngine] Points awarded', {
      userId,
      pointsDelta,
      reasonCode,
      newBalance,
    });

    return newBalance;
  }

  /**
   * Evaluate rules for a trigger, returning applicable rules sorted by priority.
   */
  async evaluateRules(
    organizationId: string,
    trigger: string,
    context: RuleEvalContext,
  ): Promise<AppliedRule[]> {
    const now = new Date();

    // Load enabled rules for this trigger (global + org-specific)
    const rules = await GamificationRule.find({
      trigger,
      enabled: true,
      $or: [
        { organizationId: null },
        { organizationId: { $exists: false } },
        { organizationId: new mongoose.Types.ObjectId(organizationId) },
      ],
    }).sort({ priority: -1 }).lean();

    const applied: AppliedRule[] = [];

    for (const rule of rules) {
      // Check validity window
      if (rule.validFrom && now < rule.validFrom) continue;
      if (rule.validTo && now > rule.validTo) continue;

      // Evaluate conditions
      if (!this._evaluateConditions(rule.conditions, context)) continue;

      applied.push({
        ruleId: rule._id.toString(),
        ruleCode: rule.code,
        pointsDelta: rule.pointsDelta,
        reasonCode: rule.code,
      });
    }

    return applied;
  }

  /**
   * Evaluate + award for all matching rules. Returns total points awarded.
   */
  async applyRules(
    userId: string,
    organizationId: string,
    eventId: string,
    trigger: string,
    context: RuleEvalContext,
    sourceModule: string,
    sourceEntityType: string,
    sourceEntityId: string,
  ): Promise<{ totalAwarded: number; appliedRules: AppliedRule[] }> {
    const appliedRules = await this.evaluateRules(organizationId, trigger, context);
    let totalAwarded = 0;

    for (const rule of appliedRules) {
      const result = await this.awardPoints({
        userId,
        organizationId,
        eventId,
        reasonCode: rule.reasonCode,
        pointsDelta: rule.pointsDelta,
        sourceModule,
        sourceEntityType,
        sourceEntityId,
        ruleId: rule.ruleId,
      });
      if (result !== null) {
        totalAwarded += rule.pointsDelta;
      }
    }

    return { totalAwarded, appliedRules };
  }

  /**
   * Anti-manipulation: check if an entity was recently completed (reopen abuse).
   * Returns true if the entity should be blocked.
   */
  async checkReopenAbuse(
    userId: string,
    sourceEntityId: string,
    windowMs: number = 300_000, // 5 minutes default
  ): Promise<boolean> {
    const cutoff = new Date(Date.now() - windowMs);
    const recentEntry = await PointsLedger.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      sourceEntityId,
      reasonCode: { $in: ['task_completed', 'work_order_completed'] },
      createdAt: { $gte: cutoff },
    }).lean();

    return !!recentEntry;
  }

  // ── Private helpers ────────────────────────────────────────

  private _evaluateConditions(conditions: Array<{ field: string; operator: string; value: unknown }>, context: RuleEvalContext): boolean {
    for (const cond of conditions) {
      const value = context[cond.field];
      if (!this._evaluateCondition(cond, value)) return false;
    }
    return true;
  }

  private _evaluateCondition(cond: { field: string; operator: string; value: unknown }, value: unknown): boolean {
    switch (cond.operator) {
      case 'eq': return value === cond.value;
      case 'ne': return value !== cond.value;
      case 'gt': return typeof value === 'number' && value > (cond.value as number);
      case 'gte': return typeof value === 'number' && value >= (cond.value as number);
      case 'lt': return typeof value === 'number' && value < (cond.value as number);
      case 'lte': return typeof value === 'number' && value <= (cond.value as number);
      case 'in': return Array.isArray(cond.value) && (cond.value as unknown[]).includes(value);
      case 'nin': return Array.isArray(cond.value) && !(cond.value as unknown[]).includes(value);
      case 'exists': return cond.value ? value !== undefined && value !== null : value === undefined || value === null;
      default: return false;
    }
  }
}

export const pointsEngine = new PointsEngine();
