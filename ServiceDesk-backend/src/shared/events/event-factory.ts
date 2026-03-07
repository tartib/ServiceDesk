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
  ServiceRequestCreatedEvent,
  ServiceRequestStatusChangedEvent,
  ServiceRequestApprovedEvent,
  ServiceRequestAssignedEvent,
  ServiceRequestCancelledEvent,
  CICreatedEvent,
  CIUpdatedEvent,
  CIRetiredEvent,
  AutomationRuleTriggeredEvent,
  AutomationRuleExecutedEvent,
  WorkflowInstanceStartedEvent,
  WorkflowInstanceTransitionedEvent,
  WorkflowInstanceCompletedEvent,
  WorkflowInstanceCancelledEvent,
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
// ITSM DOMAIN EVENT CREATORS
// ============================================================

export const ItsmEvents = {
  serviceRequestCreated: (
    data: ServiceRequestCreatedEvent,
    context: EventContext
  ): DomainEvent<ServiceRequestCreatedEvent> => {
    return createEvent(EVENT_TYPES.ITSM_SERVICE_REQUEST_CREATED, data, context);
  },

  serviceRequestStatusChanged: (
    data: ServiceRequestStatusChangedEvent,
    context: EventContext
  ): DomainEvent<ServiceRequestStatusChangedEvent> => {
    return createEvent(EVENT_TYPES.ITSM_SERVICE_REQUEST_STATUS_CHANGED, data, context);
  },

  serviceRequestApproved: (
    data: ServiceRequestApprovedEvent,
    context: EventContext
  ): DomainEvent<ServiceRequestApprovedEvent> => {
    return createEvent(EVENT_TYPES.ITSM_SERVICE_REQUEST_APPROVED, data, context);
  },

  serviceRequestAssigned: (
    data: ServiceRequestAssignedEvent,
    context: EventContext
  ): DomainEvent<ServiceRequestAssignedEvent> => {
    return createEvent(EVENT_TYPES.ITSM_SERVICE_REQUEST_ASSIGNED, data, context);
  },

  serviceRequestCancelled: (
    data: ServiceRequestCancelledEvent,
    context: EventContext
  ): DomainEvent<ServiceRequestCancelledEvent> => {
    return createEvent(EVENT_TYPES.ITSM_SERVICE_REQUEST_CANCELLED, data, context);
  },

  ciCreated: (
    data: CICreatedEvent,
    context: EventContext
  ): DomainEvent<CICreatedEvent> => {
    return createEvent(EVENT_TYPES.ITSM_CI_CREATED, data, context);
  },

  ciUpdated: (
    data: CIUpdatedEvent,
    context: EventContext,
    changes?: FieldChange[]
  ): DomainEvent<CIUpdatedEvent> => {
    return createEvent(EVENT_TYPES.ITSM_CI_UPDATED, data, context, changes);
  },

  ciRetired: (
    data: CIRetiredEvent,
    context: EventContext
  ): DomainEvent<CIRetiredEvent> => {
    return createEvent(EVENT_TYPES.ITSM_CI_RETIRED, data, context);
  },

  automationRuleTriggered: (
    data: AutomationRuleTriggeredEvent,
    context: EventContext
  ): DomainEvent<AutomationRuleTriggeredEvent> => {
    return createEvent(EVENT_TYPES.ITSM_AUTOMATION_RULE_TRIGGERED, data, context);
  },

  automationRuleExecuted: (
    data: AutomationRuleExecutedEvent,
    context: EventContext
  ): DomainEvent<AutomationRuleExecutedEvent> => {
    return createEvent(EVENT_TYPES.ITSM_AUTOMATION_RULE_EXECUTED, data, context);
  },
};

// ============================================================
// WORKFLOW DOMAIN EVENT CREATORS
// ============================================================

export const WorkflowEvents = {
  instanceStarted: (
    data: WorkflowInstanceStartedEvent,
    context: EventContext
  ): DomainEvent<WorkflowInstanceStartedEvent> => {
    return createEvent(EVENT_TYPES.WF_INSTANCE_STARTED, data, context);
  },

  instanceTransitioned: (
    data: WorkflowInstanceTransitionedEvent,
    context: EventContext
  ): DomainEvent<WorkflowInstanceTransitionedEvent> => {
    return createEvent(EVENT_TYPES.WF_INSTANCE_TRANSITIONED, data, context);
  },

  instanceCompleted: (
    data: WorkflowInstanceCompletedEvent,
    context: EventContext
  ): DomainEvent<WorkflowInstanceCompletedEvent> => {
    return createEvent(EVENT_TYPES.WF_INSTANCE_COMPLETED, data, context);
  },

  instanceCancelled: (
    data: WorkflowInstanceCancelledEvent,
    context: EventContext
  ): DomainEvent<WorkflowInstanceCancelledEvent> => {
    return createEvent(EVENT_TYPES.WF_INSTANCE_CANCELLED, data, context);
  },
};

// ============================================================
// UNIFIED EVENT PUBLISHER
// ============================================================

export { createEvent };
