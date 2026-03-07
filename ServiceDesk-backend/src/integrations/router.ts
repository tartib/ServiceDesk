/**
 * Integration Outbound Router
 *
 * Subscribes to Kafka event bus topics and dispatches outbound
 * messages to the correct integration adapter based on routing rules.
 */

import eventBus from '../shared/events/event-bus';
import { DomainEvent, QUEUES } from '../shared/events/event.types';
import { adapterRegistry } from './registry';
import { OutboundRule, OutboundPayload } from './types';
import logger from '../utils/logger';

const QUEUE_NAME = 'servicedesk.integrations.outbound';

/**
 * Default outbound routing rules.
 * In the future these can be stored in DB per-organization.
 */
const defaultRules: OutboundRule[] = [
  // Email notifications for all ITSM events
  {
    eventPattern: 'itsm.service_request.created',
    adapterId: 'email',
    action: 'send_notification',
    target: '${data.requesterEmail}',
    enabled: true,
  },
  {
    eventPattern: 'itsm.service_request.status_changed',
    adapterId: 'email',
    action: 'send_notification',
    target: '${data.requesterEmail}',
    enabled: true,
  },
  // Slack notifications for high-priority events
  {
    eventPattern: 'itsm.service_request.created',
    adapterId: 'slack',
    action: 'post_message',
    target: '${config.defaultChannel}',
    enabled: true,
  },
  // Slack for workflow completions
  {
    eventPattern: 'wf.instance.completed',
    adapterId: 'slack',
    action: 'post_message',
    target: '${config.defaultChannel}',
    enabled: true,
  },
  // Monitoring alert acknowledgment
  {
    eventPattern: 'itsm.ci.retired',
    adapterId: 'slack',
    action: 'post_message',
    target: '${config.alertChannel}',
    enabled: true,
  },
];

/**
 * Match an event type against a pattern (supports simple wildcard matching).
 */
function matchesPattern(eventType: string, pattern: string): boolean {
  if (pattern === '#' || pattern === '*') return true;

  const regexStr = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '[^.]+')
    .replace(/#/g, '.*');

  return new RegExp(`^${regexStr}$`).test(eventType);
}

/**
 * Resolve a target template against event data.
 * Supports ${data.field} and ${config.field} placeholders.
 */
function resolveTarget(template: string, event: DomainEvent<unknown>): string {
  return template.replace(/\$\{([^}]+)\}/g, (_match, path: string) => {
    const parts = path.split('.');
    let value: any = event;
    for (const part of parts) {
      value = value?.[part];
      if (value === undefined) return '';
    }
    return String(value || '');
  });
}

/**
 * Process a domain event through outbound routing rules.
 */
async function routeEvent(event: DomainEvent<unknown>): Promise<void> {
  const matchingRules = defaultRules.filter(
    (rule) => rule.enabled && matchesPattern(event.type, rule.eventPattern)
  );

  if (matchingRules.length === 0) return;

  for (const rule of matchingRules) {
    const adapter = adapterRegistry.get(rule.adapterId);

    if (!adapter || !adapter.enabled || !adapter.handleOutbound) {
      continue;
    }

    const payload: OutboundPayload = {
      adapter: rule.adapterId,
      action: rule.action,
      target: resolveTarget(rule.target, event),
      data: {
        eventType: event.type,
        eventData: event.data,
        organizationId: event.organizationId,
        userId: event.userId,
        timestamp: event.timestamp,
      },
      sourceEvent: {
        type: event.type,
        id: event.id,
        correlationId: event.correlationId,
      },
    };

    try {
      const result = await adapter.handleOutbound(payload);
      if (result.success) {
        logger.debug(`Outbound routed: ${event.type} → ${rule.adapterId}/${rule.action}`, {
          externalId: result.externalId,
          duration: result.duration,
        });
      } else {
        logger.warn(`Outbound failed: ${event.type} → ${rule.adapterId}/${rule.action}`, {
          error: result.error,
        });
      }
    } catch (err) {
      logger.error(`Outbound error: ${event.type} → ${rule.adapterId}/${rule.action}`, { error: err });
    }
  }
}

/**
 * Initialize the outbound router.
 * Subscribes to all relevant Kafka topics via the event bus.
 */
export async function initOutboundRouter(): Promise<void> {
  // Subscribe to all events
  await eventBus.subscribe(
    QUEUE_NAME,
    '#',
    routeEvent
  );

  logger.info('🔀 Integration outbound router initialized');
}

export default initOutboundRouter;
