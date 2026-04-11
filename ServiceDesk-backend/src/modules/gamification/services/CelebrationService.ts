/**
 * Celebration Service
 *
 * Handles level-up notifications, achievement unlock notifications,
 * and team milestone celebrations via the Notifications internal API.
 */

import InternalApiRegistry from '../../../shared/internal-api/InternalApiRegistry';
import { INotificationsApi } from '../../../shared/internal-api/types';
import { GrowthState, AchievementUnlockedPayload, LevelChangedPayload, TeamMilestonePayload } from '../domain';
import { OrgGamificationConfig } from '../models';
import logger from '../../../utils/logger';

export class CelebrationService {
  private get notificationsApi(): INotificationsApi | null {
    try {
      return InternalApiRegistry.get<INotificationsApi>('notifications');
    } catch {
      return null;
    }
  }

  /**
   * Send level-up celebration notification.
   */
  async onLevelUp(payload: LevelChangedPayload): Promise<void> {
    const orgConfig = await OrgGamificationConfig.findOne({
      organizationId: payload.organizationId,
    }).lean();

    if (orgConfig && !orgConfig.celebrationsEnabled) return;

    const api = this.notificationsApi;
    if (!api) {
      logger.warn('[CelebrationService] Notifications API not available');
      return;
    }

    const growthLabel = this._growthStateLabel(payload.newGrowthState);

    try {
      await api.send(payload.userId, {
        type: 'gamification_level_up',
        title: `Level Up! You reached Level ${payload.newLevel}`,
        titleAr: `ترقية! وصلت إلى المستوى ${payload.newLevel}`,
        body: `Congratulations! You've grown to ${growthLabel}. Keep up the great work!`,
        bodyAr: `تهانينا! لقد نمت إلى ${growthLabel}. استمر في العمل الرائع!`,
      });

      logger.info('[CelebrationService] Level-up notification sent', {
        userId: payload.userId,
        newLevel: payload.newLevel,
      });
    } catch (err) {
      logger.error('[CelebrationService] Failed to send level-up notification', { error: err });
    }
  }

  /**
   * Send achievement unlock notification.
   */
  async onAchievementUnlocked(payload: AchievementUnlockedPayload): Promise<void> {
    const orgConfig = await OrgGamificationConfig.findOne({
      organizationId: payload.organizationId,
    }).lean();

    if (orgConfig && !orgConfig.celebrationsEnabled) return;

    const api = this.notificationsApi;
    if (!api) return;

    try {
      await api.send(payload.userId, {
        type: 'gamification_achievement',
        title: `Achievement Unlocked: ${payload.achievementName}`,
        titleAr: `إنجاز جديد: ${payload.achievementName}`,
        body: `You've earned the "${payload.achievementName}" badge!`,
        bodyAr: `لقد حصلت على شارة "${payload.achievementName}"!`,
      });
    } catch (err) {
      logger.error('[CelebrationService] Failed to send achievement notification', { error: err });
    }
  }

  /**
   * Send team milestone celebration to all team members.
   */
  async onTeamMilestone(payload: TeamMilestonePayload): Promise<void> {
    const api = this.notificationsApi;
    if (!api) return;

    try {
      // Team milestone — would need team member list from internal API
      // For now, log the milestone event
      logger.info('[CelebrationService] Team milestone', {
        organizationId: payload.organizationId,
        teamId: payload.teamId,
        milestone: payload.milestone,
      });
    } catch (err) {
      logger.error('[CelebrationService] Failed to send team milestone notification', { error: err });
    }
  }

  /**
   * Send streak reminder notification.
   */
  async sendStreakReminder(userId: string, organizationId: string, currentStreak: number): Promise<void> {
    const api = this.notificationsApi;
    if (!api) return;

    try {
      await api.send(userId, {
        type: 'gamification_streak_reminder',
        title: `Don't lose your ${currentStreak}-day streak!`,
        titleAr: `لا تفقد سلسلتك المكونة من ${currentStreak} يوم!`,
        body: `Complete a task today to keep your streak going.`,
        bodyAr: `أكمل مهمة اليوم للحفاظ على سلسلتك.`,
      });
    } catch (err) {
      logger.error('[CelebrationService] Failed to send streak reminder', { error: err });
    }
  }

  private _growthStateLabel(state: GrowthState): string {
    switch (state) {
      case GrowthState.SEED: return 'Seed 🌱';
      case GrowthState.SPROUT: return 'Sprout 🌿';
      case GrowthState.BUD: return 'Bud 🌷';
      case GrowthState.BLOOM: return 'Bloom 🌸';
      case GrowthState.FULL_BLOOM: return 'Full Bloom 🌺';
      default: return state;
    }
  }
}

export const celebrationService = new CelebrationService();
