/**
 * Streak Engine
 *
 * Manages daily streaks with timezone-aware day boundaries,
 * streak break detection, and at-risk identification.
 */

import mongoose from 'mongoose';
import { GamificationProfile, OrgGamificationConfig, StreakReminderLog } from '../models';
import logger from '../../../utils/logger';

export interface StreakStatus {
  currentStreak: number;
  longestStreak: number;
  atRisk: boolean;
  lastActivityDate?: string;
}

export class StreakEngine {
  /**
   * Record a qualifying activity for streak tracking.
   * Uses the org timezone to determine the calendar day.
   */
  async recordActivity(userId: string, organizationId: string, timestamp: Date = new Date()): Promise<void> {
    const orgConfig = await OrgGamificationConfig.findOne({ organizationId }).lean();
    if (orgConfig && !orgConfig.streaksEnabled) return;

    const tz = orgConfig?.timezone ?? 'Asia/Riyadh';
    const today = this._toDateInTz(timestamp, tz);

    const profile = await GamificationProfile.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });

    if (!profile) return;

    const lastDate = profile.lastQualifiedActivityAt
      ? this._toDateInTz(profile.lastQualifiedActivityAt, tz)
      : null;

    // Same day — no streak change
    if (lastDate === today) return;

    const yesterday = this._getYesterday(timestamp, tz);

    if (lastDate === yesterday) {
      // Consecutive day — increment streak
      const newStreak = profile.currentStreak + 1;
      await GamificationProfile.updateOne(
        { _id: profile._id },
        {
          $set: {
            currentStreak: newStreak,
            longestStreak: Math.max(newStreak, profile.longestStreak),
            lastQualifiedActivityAt: timestamp,
          },
        },
      );
    } else {
      // Gap detected — reset streak to 1
      await GamificationProfile.updateOne(
        { _id: profile._id },
        {
          $set: {
            currentStreak: 1,
            longestStreak: Math.max(1, profile.longestStreak),
            lastQualifiedActivityAt: timestamp,
          },
        },
      );
    }
  }

  /**
   * Batch job: find users whose streak should break (last activity before yesterday).
   * Returns array of { userId, previousStreak } for downstream notification.
   */
  async evaluateStreakBreaks(organizationId: string): Promise<Array<{ userId: string; previousStreak: number }>> {
    const orgConfig = await OrgGamificationConfig.findOne({ organizationId }).lean();
    if (orgConfig && !orgConfig.streaksEnabled) return [];

    const tz = orgConfig?.timezone ?? 'Asia/Riyadh';
    const yesterday = this._getYesterday(new Date(), tz);
    const yesterdayDate = this._parseDateInTz(yesterday, tz);

    // Find profiles with active streaks whose last activity is before yesterday
    const staleProfiles = await GamificationProfile.find({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      currentStreak: { $gt: 0 },
      lastQualifiedActivityAt: { $lt: yesterdayDate },
    }).lean();

    const broken: Array<{ userId: string; previousStreak: number }> = [];

    for (const profile of staleProfiles) {
      broken.push({
        userId: profile.userId.toString(),
        previousStreak: profile.currentStreak,
      });

      await GamificationProfile.updateOne(
        { _id: profile._id },
        { $set: { currentStreak: 0 } },
      );
    }

    if (broken.length > 0) {
      logger.info('[StreakEngine] Streaks broken', { organizationId, count: broken.length });
    }

    return broken;
  }

  /**
   * Get streak status for a user.
   */
  async getStreakStatus(userId: string, organizationId: string): Promise<StreakStatus> {
    const profile = await GamificationProfile.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    }).lean();

    if (!profile) {
      return { currentStreak: 0, longestStreak: 0, atRisk: false };
    }

    const orgConfig = await OrgGamificationConfig.findOne({ organizationId }).lean();
    const tz = orgConfig?.timezone ?? 'Asia/Riyadh';
    const today = this._toDateInTz(new Date(), tz);

    const lastDate = profile.lastQualifiedActivityAt
      ? this._toDateInTz(profile.lastQualifiedActivityAt, tz)
      : null;

    // At risk if they have a streak but haven't been active today
    const atRisk = profile.currentStreak > 0 && lastDate !== today;

    return {
      currentStreak: profile.currentStreak,
      longestStreak: profile.longestStreak,
      atRisk,
      lastActivityDate: lastDate || undefined,
    };
  }

  /**
   * Find users at risk of losing their streak (active streak, no activity today).
   * Used by the reminder job.
   */
  async findAtRiskUsers(organizationId: string): Promise<string[]> {
    const orgConfig = await OrgGamificationConfig.findOne({ organizationId }).lean();
    if (orgConfig && !orgConfig.streaksEnabled) return [];

    const tz = orgConfig?.timezone ?? 'Asia/Riyadh';
    const today = this._toDateInTz(new Date(), tz);
    const todayStart = this._parseDateInTz(today, tz);

    const profiles = await GamificationProfile.find({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      currentStreak: { $gt: 0 },
      lastQualifiedActivityAt: { $lt: todayStart },
    }).lean();

    // Filter out users already reminded today
    const userIds = profiles.map((p) => p.userId.toString());
    if (userIds.length === 0) return [];

    const alreadyReminded = await StreakReminderLog.find({
      userId: { $in: userIds.map((id) => new mongoose.Types.ObjectId(id)) },
      date: today,
      sent: true,
    }).lean();

    const remindedSet = new Set(alreadyReminded.map((r) => r.userId.toString()));
    return userIds.filter((id) => !remindedSet.has(id));
  }

  /**
   * Record that a streak reminder was sent.
   */
  async markReminderSent(userId: string, date: string): Promise<void> {
    await StreakReminderLog.updateOne(
      { userId: new mongoose.Types.ObjectId(userId), date },
      { $set: { sent: true } },
      { upsert: true },
    );
  }

  // ── Timezone helpers ────────────────────────────────────────

  private _toDateInTz(date: Date, tz: string): string {
    return date.toLocaleDateString('en-CA', { timeZone: tz }); // YYYY-MM-DD
  }

  private _getYesterday(date: Date, tz: string): string {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    return this._toDateInTz(d, tz);
  }

  private _parseDateInTz(dateStr: string, tz: string): Date {
    // Parse YYYY-MM-DD in the given timezone
    const [year, month, day] = dateStr.split('-').map(Number);
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    // Create date at midnight in given timezone using UTC offset calculation
    const utcDate = new Date(Date.UTC(year, month - 1, day));
    // Adjust for timezone offset
    const parts = formatter.formatToParts(utcDate);
    return utcDate;
  }
}

export const streakEngine = new StreakEngine();
