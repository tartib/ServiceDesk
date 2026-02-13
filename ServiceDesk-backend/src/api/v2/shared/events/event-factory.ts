/**
 * Event Factory
 * 
 * Helper functions to create properly structured domain events
 */

import { v4 as uuidv4 } from 'uuid';
import {
  DomainEvent,
  EVENT_TYPES,
  WorkOrderCreatedEvent,
  WorkOrderStartedEvent,
  WorkOrderCompletedEvent,
  WorkOrderOverdueEvent,
  WorkOrderEscalatedEvent,
  WorkItemCreatedEvent,
  WorkItemTransitionedEvent,
  SprintStartedEvent,
  SprintCompletedEvent,
  TicketCreatedEvent,
  TicketResolvedEvent,
  FieldChange,
} from './event.types';

// ============================================================
// BASE EVENT CREATOR
// ============================================================

interface EventContext {
  organizationId: string;
  userId: string;
  correlationId?: string;
}

function createEvent<T>(
  type: string,
  data: T,
  context: EventContext,
  changes?: FieldChange[]
): DomainEvent<T> {
  return {
    id: uuidv4(),
    type,
    timestamp: new Date().toISOString(),
    version: '1.0',
    organizationId: context.organizationId,
    userId: context.userId,
    correlationId: context.correlationId,
    data,
    changes,
  };
}

// ============================================================
// OPS DOMAIN EVENT CREATORS
// ============================================================

export const OpsEvents = {
  workOrderCreated: (
    data: WorkOrderCreatedEvent,
    context: EventContext
  ): DomainEvent<WorkOrderCreatedEvent> => {
    return createEvent(EVENT_TYPES.OPS_WORK_ORDER_CREATED, data, context);
  },

  workOrderStarted: (
    data: WorkOrderStartedEvent,
    context: EventContext
  ): DomainEvent<WorkOrderStartedEvent> => {
    return createEvent(EVENT_TYPES.OPS_WORK_ORDER_STARTED, data, context);
  },

  workOrderCompleted: (
    data: WorkOrderCompletedEvent,
    context: EventContext
  ): DomainEvent<WorkOrderCompletedEvent> => {
    return createEvent(EVENT_TYPES.OPS_WORK_ORDER_COMPLETED, data, context);
  },

  workOrderOverdue: (
    data: WorkOrderOverdueEvent,
    context: EventContext
  ): DomainEvent<WorkOrderOverdueEvent> => {
    return createEvent(EVENT_TYPES.OPS_WORK_ORDER_OVERDUE, data, context);
  },

  workOrderEscalated: (
    data: WorkOrderEscalatedEvent,
    context: EventContext
  ): DomainEvent<WorkOrderEscalatedEvent> => {
    return createEvent(EVENT_TYPES.OPS_WORK_ORDER_ESCALATED, data, context);
  },
};

// ============================================================
// PM DOMAIN EVENT CREATORS
// ============================================================

export const PmEvents = {
  workItemCreated: (
    data: WorkItemCreatedEvent,
    context: EventContext
  ): DomainEvent<WorkItemCreatedEvent> => {
    return createEvent(EVENT_TYPES.PM_WORK_ITEM_CREATED, data, context);
  },

  workItemTransitioned: (
    data: WorkItemTransitionedEvent,
    context: EventContext,
    changes?: FieldChange[]
  ): DomainEvent<WorkItemTransitionedEvent> => {
    return createEvent(EVENT_TYPES.PM_WORK_ITEM_TRANSITIONED, data, context, changes);
  },

  sprintStarted: (
    data: SprintStartedEvent,
    context: EventContext
  ): DomainEvent<SprintStartedEvent> => {
    return createEvent(EVENT_TYPES.PM_SPRINT_STARTED, data, context);
  },

  sprintCompleted: (
    data: SprintCompletedEvent,
    context: EventContext
  ): DomainEvent<SprintCompletedEvent> => {
    return createEvent(EVENT_TYPES.PM_SPRINT_COMPLETED, data, context);
  },
};

// ============================================================
// SD DOMAIN EVENT CREATORS
// ============================================================

export const SdEvents = {
  ticketCreated: (
    data: TicketCreatedEvent,
    context: EventContext
  ): DomainEvent<TicketCreatedEvent> => {
    return createEvent(EVENT_TYPES.SD_TICKET_CREATED, data, context);
  },

  ticketResolved: (
    data: TicketResolvedEvent,
    context: EventContext
  ): DomainEvent<TicketResolvedEvent> => {
    return createEvent(EVENT_TYPES.SD_TICKET_RESOLVED, data, context);
  },
};

// ============================================================
// UNIFIED EVENT PUBLISHER
// ============================================================

export { createEvent };
