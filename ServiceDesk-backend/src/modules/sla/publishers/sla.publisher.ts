/**
 * SLA Event Publisher
 *
 * Publishes SLA domain events to the event bus for consumption by
 * notifications, analytics, and other modules.
 */

import { v4 as uuidv4 } from 'uuid';
import { DomainEvent, EVENT_TYPES } from '../../../shared/events/event.types';
import { eventBus } from '../../../shared/events/event-bus';
import { SlaEventType } from '../domain';
import logger from '../../../utils/logger';

const EVENT_TYPE_MAP: Record<SlaEventType, string> = {
  [SlaEventType.POLICY_MATCHED]: EVENT_TYPES.SLA_POLICY_MATCHED,
  [SlaEventType.METRIC_STARTED]: EVENT_TYPES.SLA_METRIC_STARTED,
  [SlaEventType.METRIC_PAUSED]: EVENT_TYPES.SLA_METRIC_PAUSED,
  [SlaEventType.METRIC_RESUMED]: EVENT_TYPES.SLA_METRIC_RESUMED,
  [SlaEventType.METRIC_STOPPED]: EVENT_TYPES.SLA_METRIC_MET,
  [SlaEventType.METRIC_MET]: EVENT_TYPES.SLA_METRIC_MET,
  [SlaEventType.METRIC_BREACHED]: EVENT_TYPES.SLA_METRIC_BREACHED,
  [SlaEventType.ESCALATION_TRIGGERED]: EVENT_TYPES.SLA_ESCALATION_TRIGGERED,
  [SlaEventType.MANUALLY_OVERRIDDEN]: EVENT_TYPES.SLA_METRIC_MET, // fallback
};

export async function publishSlaEvent(
  slaEventType: SlaEventType,
  organizationId: string,
  userId: string,
  data: Record<string, unknown>,
  correlationId?: string
): Promise<void> {
  const eventType = EVENT_TYPE_MAP[slaEventType] || `sla.${slaEventType}`;

  const event: DomainEvent<Record<string, unknown>> = {
    id: uuidv4(),
    type: eventType,
    timestamp: new Date().toISOString(),
    version: '1.0',
    organizationId,
    userId,
    correlationId,
    data,
  };

  try {
    await eventBus.publish(event);
  } catch (err) {
    logger.error('[SLA:Publisher] Failed to publish SLA event', {
      eventType,
      error: err,
    });
  }
}
