/**
 * Gamification Event Publisher
 *
 * Publishes gamification domain events to the event bus.
 */

import { v4 as uuidv4 } from 'uuid';
import eventBus from '../../../shared/events/event-bus';
import {
  PointsAwardedPayload,
  LevelChangedPayload,
  GrowthStateChangedPayload,
  AchievementUnlockedPayload,
  StreakUpdatedPayload,
  StreakBrokenPayload,
  TeamMilestonePayload,
  GamificationEventType,
} from '../domain';
import { DomainEvent } from '../../../shared/events/event.types';
import logger from '../../../utils/logger';

function createEvent<T>(type: GamificationEventType, data: T, orgId: string, userId: string): DomainEvent<T> {
  return {
    id: uuidv4(),
    type,
    timestamp: new Date().toISOString(),
    version: '1.0',
    organizationId: orgId,
    userId,
    data,
  };
}

export class GamificationPublisher {
  async publishPointsAwarded(payload: PointsAwardedPayload): Promise<void> {
    const event = createEvent(
      GamificationEventType.POINTS_AWARDED,
      payload,
      payload.organizationId,
      payload.userId,
    );
    await this._publish(event);
  }

  async publishLevelChanged(payload: LevelChangedPayload): Promise<void> {
    const event = createEvent(
      GamificationEventType.LEVEL_CHANGED,
      payload,
      payload.organizationId,
      payload.userId,
    );
    await this._publish(event);
  }

  async publishGrowthStateChanged(payload: GrowthStateChangedPayload): Promise<void> {
    const event = createEvent(
      GamificationEventType.GROWTH_STATE_CHANGED,
      payload,
      payload.organizationId,
      payload.userId,
    );
    await this._publish(event);
  }

  async publishAchievementUnlocked(payload: AchievementUnlockedPayload): Promise<void> {
    const event = createEvent(
      GamificationEventType.ACHIEVEMENT_UNLOCKED,
      payload,
      payload.organizationId,
      payload.userId,
    );
    await this._publish(event);
  }

  async publishStreakUpdated(payload: StreakUpdatedPayload): Promise<void> {
    const event = createEvent(
      GamificationEventType.STREAK_UPDATED,
      payload,
      payload.organizationId,
      payload.userId,
    );
    await this._publish(event);
  }

  async publishStreakBroken(payload: StreakBrokenPayload): Promise<void> {
    const event = createEvent(
      GamificationEventType.STREAK_BROKEN,
      payload,
      payload.organizationId,
      payload.userId,
    );
    await this._publish(event);
  }

  async publishTeamMilestone(payload: TeamMilestonePayload): Promise<void> {
    const event = createEvent(
      GamificationEventType.TEAM_MILESTONE,
      payload,
      payload.organizationId,
      '',
    );
    await this._publish(event);
  }

  private async _publish(event: DomainEvent<unknown>): Promise<void> {
    try {
      await eventBus.publish(event);
      logger.debug('[GamificationPublisher] Event published', { type: event.type, id: event.id });
    } catch (err) {
      logger.error('[GamificationPublisher] Failed to publish event', { type: event.type, error: err });
    }
  }
}

export const gamificationPublisher = new GamificationPublisher();
