/**
 * Gamification Scheduler Jobs
 *
 * - Streak break checker: evaluates and breaks stale streaks
 * - Streak reminder: notifies at-risk users
 */

import { streakEngine } from '../services/StreakEngine';
import { celebrationService } from '../services/CelebrationService';
import { gamificationPublisher } from '../publishers/gamification.publisher';
import { OrgGamificationConfig } from '../models';
import logger from '../../../utils/logger';

let streakBreakInterval: ReturnType<typeof setInterval> | null = null;
let streakReminderInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start all gamification background jobs.
 */
export function startGamificationJobs(
  breakIntervalMs: number = 60_000,
  reminderIntervalMs: number = 300_000,
): void {
  // Streak break checker
  streakBreakInterval = setInterval(async () => {
    try {
      await runStreakBreakCheck();
    } catch (err) {
      logger.error('[GamificationJobs] Streak break check failed', { error: err });
    }
  }, breakIntervalMs);

  // Streak reminder
  streakReminderInterval = setInterval(async () => {
    try {
      await runStreakReminders();
    } catch (err) {
      logger.error('[GamificationJobs] Streak reminder failed', { error: err });
    }
  }, reminderIntervalMs);

  logger.info('🎮 Gamification jobs started', { breakIntervalMs, reminderIntervalMs });
}

/**
 * Stop all gamification background jobs.
 */
export function stopGamificationJobs(): void {
  if (streakBreakInterval) {
    clearInterval(streakBreakInterval);
    streakBreakInterval = null;
  }
  if (streakReminderInterval) {
    clearInterval(streakReminderInterval);
    streakReminderInterval = null;
  }
  logger.info('🎮 Gamification jobs stopped');
}

/**
 * Evaluate streak breaks for all organizations.
 */
async function runStreakBreakCheck(): Promise<void> {
  const orgConfigs = await OrgGamificationConfig.find({ streaksEnabled: true }).lean();

  for (const config of orgConfigs) {
    const orgId = config.organizationId.toString();
    const broken = await streakEngine.evaluateStreakBreaks(orgId);

    for (const { userId, previousStreak } of broken) {
      await gamificationPublisher.publishStreakBroken({
        userId,
        organizationId: orgId,
        previousStreak,
      });
    }
  }
}

/**
 * Send streak reminders to at-risk users.
 */
async function runStreakReminders(): Promise<void> {
  const orgConfigs = await OrgGamificationConfig.find({ streaksEnabled: true }).lean();

  for (const config of orgConfigs) {
    const orgId = config.organizationId.toString();
    const atRiskUsers = await streakEngine.findAtRiskUsers(orgId);

    for (const userId of atRiskUsers) {
      const status = await streakEngine.getStreakStatus(userId, orgId);
      await celebrationService.sendStreakReminder(userId, orgId, status.currentStreak);

      const today = new Date().toISOString().slice(0, 10);
      await streakEngine.markReminderSent(userId, today);
    }
  }
}
