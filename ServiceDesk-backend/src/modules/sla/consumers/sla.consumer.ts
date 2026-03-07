/**
 * SLA Event Consumer
 *
 * Subscribes to ticket lifecycle events and delegates to the SLA Orchestrator.
 * Replaces the stub in shared/events/consumers/sla-monitor.consumer.ts.
 */

import { DomainEvent, EVENT_TYPES, QUEUES } from '../../../shared/events/event.types';
import { eventBus } from '../../../shared/events/event-bus';
import { SlaOrchestrator } from '../services/SlaOrchestrator';
import { getSlaRepos } from '../infrastructure/repositories/SlaRepositoryFactory';
import { SlaEntityType } from '../domain';
import logger from '../../../utils/logger';

const SLA_QUEUE = QUEUES.SLA_MONITOR;

let orchestrator: SlaOrchestrator | null = null;

function getOrchestrator(): SlaOrchestrator {
  if (!orchestrator) {
    const repos = getSlaRepos();
    orchestrator = new SlaOrchestrator({
      policyRepo: {
        findActiveByEntityType: (t, e) => repos.policyRepo.findActiveByEntityType(t, e),
        findById: (id) => repos.policyRepo.findById(id),
      },
      goalRepo: {
        findByPolicyId: (id) => repos.policyRepo.findGoalsByPolicyId(id),
      },
      calendarRepo: {
        resolve: (id) => repos.calendarRepo.resolve(id),
        resolveDefault: (t) => repos.calendarRepo.resolveDefault(t),
      },
      instanceRepo: {
        create: (d) => repos.instanceRepo.create(d),
        findByTicket: (t, id) => repos.instanceRepo.findByTicket(t, id),
        update: (id, d) => repos.instanceRepo.update(id, d) as any,
      },
      metricRepo: {
        create: (d) => repos.metricRepo.create(d),
        findByInstanceId: (id) => repos.metricRepo.findByInstanceId(id),
        findByMetricKey: (iid, mk) => repos.metricRepo.findByMetricKey(iid, mk),
        update: (id, d) => repos.metricRepo.update(id, d) as any,
      },
      eventRepo: {
        append: (e) => repos.eventRepo.append(e),
      },
    });
  }
  return orchestrator;
}

/**
 * Map ITSM/SD event types to SLA entity types
 */
function resolveEntityType(eventType: string): SlaEntityType | null {
  if (eventType.includes('service_request')) return SlaEntityType.SERVICE_REQUEST;
  if (eventType.includes('incident')) return SlaEntityType.INCIDENT;
  if (eventType.includes('problem')) return SlaEntityType.PROBLEM;
  if (eventType.includes('change')) return SlaEntityType.CHANGE;
  if (eventType.startsWith('sd.ticket')) return SlaEntityType.INCIDENT; // Legacy SD → incident
  return null;
}

/**
 * Initialize the SLA consumer — subscribe to relevant events.
 */
export async function initSlaConsumer(): Promise<void> {
  logger.info('[SLA:Consumer] Initializing SLA event consumer');

  // ── Ticket created events ──────────────────────────────────
  const createdEvents = [
    EVENT_TYPES.ITSM_SERVICE_REQUEST_CREATED,
    EVENT_TYPES.SD_TICKET_CREATED,
  ];

  for (const eventType of createdEvents) {
    await eventBus.subscribe(SLA_QUEUE, eventType, async (event: DomainEvent<any>) => {
      try {
        const entityType = resolveEntityType(event.type);
        if (!entityType) return;

        const tenantId = event.organizationId;
        const ticketId = event.data?.ticketId || event.data?.id || event.data?._id;
        if (!tenantId || !ticketId) return;

        const orch = getOrchestrator();
        const result = await orch.onTicketCreated(tenantId, ticketId, entityType, {
          entityType,
          priority: event.data?.priority,
          category: event.data?.category,
          serviceId: event.data?.serviceId || event.data?.service_id,
          requestType: event.data?.requestType || event.data?.request_type,
          source: event.data?.source,
        });

        if (result.policyCode) {
          logger.info('[SLA:Consumer] SLA assigned to ticket', {
            ticketId,
            policyCode: result.policyCode,
            metricsStarted: result.metricsStarted,
          });
        }
      } catch (err) {
        logger.error('[SLA:Consumer] Error handling ticket created', { error: err, eventType: event.type });
      }
    });
  }

  // ── Status changed events ──────────────────────────────────
  await eventBus.subscribe(
    SLA_QUEUE,
    EVENT_TYPES.ITSM_SERVICE_REQUEST_STATUS_CHANGED,
    async (event: DomainEvent<any>) => {
      try {
        const tenantId = event.organizationId;
        const ticketId = event.data?.ticketId || event.data?.id;
        const newStatus = event.data?.newStatus || event.data?.status;
        if (!tenantId || !ticketId || !newStatus) return;

        const orch = getOrchestrator();
        await orch.onTicketStatusChanged(tenantId, ticketId, newStatus);
      } catch (err) {
        logger.error('[SLA:Consumer] Error handling status change', { error: err });
      }
    }
  );

  // ── Ticket resolved ────────────────────────────────────────
  await eventBus.subscribe(
    SLA_QUEUE,
    EVENT_TYPES.SD_TICKET_RESOLVED,
    async (event: DomainEvent<any>) => {
      try {
        const tenantId = event.organizationId;
        const ticketId = event.data?.ticketId || event.data?.id;
        if (!tenantId || !ticketId) return;

        const orch = getOrchestrator();
        await orch.onTicketResolved(tenantId, ticketId);
      } catch (err) {
        logger.error('[SLA:Consumer] Error handling ticket resolved', { error: err });
      }
    }
  );

  // ── Ticket cancelled ───────────────────────────────────────
  if (EVENT_TYPES.ITSM_SERVICE_REQUEST_CANCELLED) {
    await eventBus.subscribe(
      SLA_QUEUE,
      EVENT_TYPES.ITSM_SERVICE_REQUEST_CANCELLED,
      async (event: DomainEvent<any>) => {
        try {
          const tenantId = event.organizationId;
          const ticketId = event.data?.ticketId || event.data?.id;
          if (!tenantId || !ticketId) return;

          const orch = getOrchestrator();
          await orch.onTicketCancelled(tenantId, ticketId);
        } catch (err) {
          logger.error('[SLA:Consumer] Error handling ticket cancelled', { error: err });
        }
      }
    );
  }

  // ── Ticket assigned (for first_response tracking) ──────────
  if (EVENT_TYPES.ITSM_SERVICE_REQUEST_ASSIGNED) {
    await eventBus.subscribe(
      SLA_QUEUE,
      EVENT_TYPES.ITSM_SERVICE_REQUEST_ASSIGNED,
      async (event: DomainEvent<any>) => {
        try {
          const tenantId = event.organizationId;
          const ticketId = event.data?.ticketId || event.data?.id;
          if (!tenantId || !ticketId) return;

          const orch = getOrchestrator();
          await orch.onTicketFirstResponse(tenantId, ticketId);
        } catch (err) {
          logger.error('[SLA:Consumer] Error handling ticket assigned', { error: err });
        }
      }
    );
  }

  logger.info('[SLA:Consumer] SLA event consumer initialized');
}

/**
 * Reset orchestrator (for testing)
 */
export function resetSlaConsumer(): void {
  orchestrator = null;
}
