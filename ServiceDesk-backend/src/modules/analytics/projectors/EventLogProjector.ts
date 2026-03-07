/**
 * EventLog Projector
 *
 * Persists every domain event to the EventLog read model.
 * Replaces the TODO in analytics.consumer.ts.
 */

import { DomainEvent } from '../../../shared/events/event.types';
import EventLog from '../read-models/EventLog';
import logger from '../../../utils/logger';
import { isAnalyticsPostgres, getAnalyticsRepos } from '../infrastructure/repositories';

/**
 * Parse an event type string like 'ops.work_order.created'
 * into { domain, entity, action }.
 */
function parseEventType(eventType: string): { domain: string; entity: string; action: string } {
  const parts = eventType.split('.');
  if (parts.length >= 3) {
    return {
      domain: parts[0],
      entity: parts.slice(1, parts.length - 1).join('.'),
      action: parts[parts.length - 1],
    };
  }
  return {
    domain: parts[0] || 'unknown',
    entity: parts[1] || 'unknown',
    action: parts[2] || 'unknown',
  };
}

export class EventLogProjector {
  /**
   * Persist a domain event to the EventLog collection.
   * Idempotent — uses eventId as unique key.
   */
  async project(event: DomainEvent<unknown>): Promise<void> {
    try {
      const { domain, entity, action } = parseEventType(event.type);

      // ── PostgreSQL path ──
      if (isAnalyticsPostgres()) {
        const repo = getAnalyticsRepos().eventLog;
        await repo.upsertByEventId({
          eventId: event.id,
          eventType: event.type,
          domain,
          entity,
          action,
          organizationId: event.organizationId,
          userId: event.userId,
          payload: event.data as Record<string, any>,
          timestamp: new Date(event.timestamp),
        });
        return;
      }

      // ── MongoDB path ──
      await EventLog.updateOne(
        { eventId: event.id },
        {
          $setOnInsert: {
            eventId: event.id,
            eventType: event.type,
            domain,
            entity,
            action,
            organizationId: event.organizationId,
            userId: event.userId,
            payload: event.data as Record<string, any>,
            timestamp: event.timestamp,
            processedAt: new Date(),
          },
        },
        { upsert: true }
      );
    } catch (error: any) {
      // Duplicate key is expected for replayed events — not an error
      if (error?.code === 11000 || error?.code === '23505') {
        logger.debug('EventLog: duplicate event skipped', { eventId: event.id });
        return;
      }
      logger.error('EventLogProjector failed', { eventId: event.id, error });
    }
  }
}

export const eventLogProjector = new EventLogProjector();
