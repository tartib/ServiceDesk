/**
 * Notification Consumer
 *
 * Handles domain events that trigger notifications.
 * Moved from shared/events/consumers/notification.consumer.ts
 * into the notifications module for proper domain ownership.
 */

import eventBus from '../../../shared/events/event-bus';
import {
  DomainEvent,
  QUEUES,
  ROUTING_PATTERNS,
  WorkOrderCreatedEvent,
  WorkOrderOverdueEvent,
  WorkOrderEscalatedEvent,
  WorkItemTransitionedEvent,
  SprintStartedEvent,
  SprintCompletedEvent,
  ServiceRequestCreatedEvent,
  ServiceRequestAssignedEvent,
  ServiceRequestStatusChangedEvent,
  ServiceRequestApprovedEvent,
  CICreatedEvent,
  CIRetiredEvent,
  WorkflowInstanceStartedEvent,
  WorkflowInstanceTransitionedEvent,
  WorkflowInstanceCompletedEvent,
} from '../../../shared/events/event.types';
import { notificationDispatcher } from '../services/NotificationDispatcher';
import {
  NotificationType,
  NotificationSource,
  NotificationLevel,
} from '../domain/interfaces';
import logger from '../../../utils/logger';

const QUEUE_NAME = QUEUES.NOTIFICATIONS;

/**
 * Initialize notification consumer
 */
export async function initNotificationConsumer(): Promise<void> {
  // Subscribe to all created events
  await eventBus.subscribe(
    QUEUE_NAME,
    ROUTING_PATTERNS.ALL_CREATED,
    handleCreatedEvent
  );

  // Subscribe to transition events
  await eventBus.subscribe(
    QUEUE_NAME,
    ROUTING_PATTERNS.ALL_TRANSITIONS,
    handleTransitionEvent
  );

  // Subscribe to OPS work order events (overdue, escalation)
  await eventBus.subscribe(
    QUEUE_NAME,
    'ops.work_order.overdue',
    handleWorkOrderOverdue
  );

  await eventBus.subscribe(
    QUEUE_NAME,
    'ops.work_order.escalated',
    handleWorkOrderEscalated
  );

  // Subscribe to sprint events
  await eventBus.subscribe(
    QUEUE_NAME,
    'pm.sprint.started',
    handleSprintStarted
  );

  await eventBus.subscribe(
    QUEUE_NAME,
    'pm.sprint.completed',
    handleSprintCompleted
  );

  // Subscribe to ITSM service request events
  await eventBus.subscribe(
    QUEUE_NAME,
    ROUTING_PATTERNS.ITSM_SERVICE_REQUEST_ALL,
    handleItsmServiceRequestEvent
  );

  // Subscribe to ITSM CI events
  await eventBus.subscribe(
    QUEUE_NAME,
    ROUTING_PATTERNS.ITSM_CI_ALL,
    handleItsmCIEvent
  );

  // Subscribe to Workflow instance events
  await eventBus.subscribe(
    QUEUE_NAME,
    ROUTING_PATTERNS.WF_INSTANCE_ALL,
    handleWorkflowEvent
  );

  logger.info('📬 Notification consumer initialized (module-owned)');
}

// ============================================================
// GENERIC HANDLERS
// ============================================================

async function handleCreatedEvent(event: DomainEvent<unknown>): Promise<void> {
  logger.debug('Processing created event for notification', { type: event.type });

  switch (event.type) {
    case 'ops.work_order.created':
      await notifyWorkOrderCreated(event as DomainEvent<WorkOrderCreatedEvent>);
      break;
    case 'pm.work_item.created':
      // Notify assignee if assigned
      break;
    default:
      logger.debug('No notification handler for event type', { type: event.type });
  }
}

async function handleTransitionEvent(event: DomainEvent<unknown>): Promise<void> {
  logger.debug('Processing transition event for notification', { type: event.type });

  if (event.type === 'pm.work_item.transitioned') {
    await notifyWorkItemTransitioned(event as DomainEvent<WorkItemTransitionedEvent>);
  }
}

// ============================================================
// OPS HANDLERS
// ============================================================

async function notifyWorkOrderCreated(
  event: DomainEvent<WorkOrderCreatedEvent>
): Promise<void> {
  const { workOrderId, assigneeId, productName, priority } = event.data;

  if (assigneeId) {
    await notificationDispatcher.dispatch({
      userId: assigneeId,
      type: NotificationType.ASSIGNMENT,
      source: NotificationSource.OPS,
      level: NotificationLevel.INFO,
      title: 'New Work Order Assigned',
      message: `Work order for "${productName}" (priority: ${priority}) has been assigned to you.`,
      relatedEntityId: workOrderId,
      relatedEntityType: 'WorkOrder',
      organizationId: event.organizationId,
      actionRequired: true,
      actionUrl: `/work-orders/${workOrderId}`,
      metadata: { priority },
    });
  }
}

async function handleWorkOrderOverdue(
  event: DomainEvent<WorkOrderOverdueEvent>
): Promise<void> {
  const { workOrderId, assigneeId, overdueMinutes } = event.data;

  logger.warn('Work order overdue - sending urgent notification', {
    workOrderId,
    overdueMinutes,
  });

  if (assigneeId) {
    await notificationDispatcher.dispatch({
      userId: assigneeId,
      type: NotificationType.OVERDUE,
      source: NotificationSource.OPS,
      level: NotificationLevel.WARNING,
      title: 'Work Order Overdue',
      message: `Work order ${workOrderId} is overdue by ${overdueMinutes} minutes.`,
      relatedEntityId: workOrderId,
      relatedEntityType: 'WorkOrder',
      organizationId: event.organizationId,
      actionRequired: true,
      actionUrl: `/work-orders/${workOrderId}`,
      metadata: { overdueMinutes },
    });
  }
}

async function handleWorkOrderEscalated(
  event: DomainEvent<WorkOrderEscalatedEvent>
): Promise<void> {
  const { workOrderId, escalatedTo, reason } = event.data;

  logger.warn('Work order escalated - notifying manager', {
    workOrderId,
    escalatedTo,
    reason,
  });

  if (escalatedTo) {
    await notificationDispatcher.dispatch({
      userId: escalatedTo,
      type: NotificationType.ESCALATION,
      source: NotificationSource.OPS,
      level: NotificationLevel.CRITICAL,
      title: 'Work Order Escalated',
      message: `Work order ${workOrderId} has been escalated. Reason: ${reason}`,
      relatedEntityId: workOrderId,
      relatedEntityType: 'WorkOrder',
      organizationId: event.organizationId,
      isEscalation: true,
      actionRequired: true,
      actionUrl: `/work-orders/${workOrderId}`,
      metadata: { reason },
    });
  }
}

// ============================================================
// PM HANDLERS
// ============================================================

async function notifyWorkItemTransitioned(
  event: DomainEvent<WorkItemTransitionedEvent>
): Promise<void> {
  const { itemId, from, to, transitionedBy } = event.data;

  logger.debug('Work item transitioned', { itemId, from, to, transitionedBy });

  // TODO: Notify watchers about status change via dispatcher
}

async function handleSprintStarted(
  event: DomainEvent<SprintStartedEvent>
): Promise<void> {
  const { sprintId, projectId, itemCount, totalPoints } = event.data;

  logger.info('Sprint started - notifying team', {
    sprintId,
    projectId,
    itemCount,
    totalPoints,
  });

  // TODO: Notify all project members about sprint start via dispatcher
}

async function handleSprintCompleted(
  event: DomainEvent<SprintCompletedEvent>
): Promise<void> {
  const { sprintId, velocity, completedItems, incompleteItems } = event.data;

  logger.info('Sprint completed - sending summary', {
    sprintId,
    velocity,
    completedItems,
    incompleteItems,
  });

  // TODO: Send sprint completion summary to team via dispatcher
}

// ============================================================
// ITSM HANDLERS
// ============================================================

async function handleItsmServiceRequestEvent(event: DomainEvent<unknown>): Promise<void> {
  logger.debug('Processing ITSM service request event for notification', { type: event.type });

  switch (event.type) {
    case 'itsm.service_request.created': {
      const { requestId, serviceName, requesterId, requesterName } =
        (event as DomainEvent<ServiceRequestCreatedEvent>).data;
      await notificationDispatcher.dispatch({
        userId: requesterId,
        type: NotificationType.STATUS_CHANGE,
        source: NotificationSource.ITSM,
        level: NotificationLevel.INFO,
        title: 'Service Request Created',
        message: `Your service request for "${serviceName}" has been created.`,
        relatedEntityId: requestId,
        relatedEntityType: 'ServiceRequest',
        organizationId: event.organizationId,
        actionUrl: `/itsm/service-requests/${requestId}`,
        metadata: { requesterName },
      });
      break;
    }
    case 'itsm.service_request.assigned': {
      const { requestId, assignedTo } =
        (event as DomainEvent<ServiceRequestAssignedEvent>).data;
      await notificationDispatcher.dispatch({
        userId: assignedTo,
        type: NotificationType.ASSIGNMENT,
        source: NotificationSource.ITSM,
        level: NotificationLevel.INFO,
        title: 'Service Request Assigned',
        message: `Service request ${requestId} has been assigned to you.`,
        relatedEntityId: requestId,
        relatedEntityType: 'ServiceRequest',
        organizationId: event.organizationId,
        actionRequired: true,
        actionUrl: `/itsm/service-requests/${requestId}`,
      });
      break;
    }
    case 'itsm.service_request.status_changed': {
      const { requestId, oldStatus, newStatus } =
        (event as DomainEvent<ServiceRequestStatusChangedEvent>).data;
      logger.info('Service request status changed', { requestId, oldStatus, newStatus });
      // TODO: Notify requester of status change
      break;
    }
    case 'itsm.service_request.approved': {
      const { requestId, approvedBy } =
        (event as DomainEvent<ServiceRequestApprovedEvent>).data;
      logger.info('Service request approved', { requestId, approvedBy });
      // TODO: Notify requester of approval
      break;
    }
    default:
      break;
  }
}

async function handleItsmCIEvent(event: DomainEvent<unknown>): Promise<void> {
  logger.debug('Processing ITSM CI event for notification', { type: event.type });

  switch (event.type) {
    case 'itsm.ci.created': {
      const { ciId, name, ciType } = (event as DomainEvent<CICreatedEvent>).data;
      logger.info('CI created - notifying CMDB managers', { ciId, name, ciType });
      // TODO: Notify CMDB managers via dispatcher
      break;
    }
    case 'itsm.ci.retired': {
      const { ciId, name } = (event as DomainEvent<CIRetiredEvent>).data;
      logger.warn('CI retired - notifying dependent service owners', { ciId, name });
      // TODO: Notify owners of dependent services via dispatcher
      break;
    }
    default:
      break;
  }
}

// ============================================================
// WORKFLOW HANDLERS
// ============================================================

async function handleWorkflowEvent(event: DomainEvent<unknown>): Promise<void> {
  logger.debug('Processing workflow event for notification', { type: event.type });

  switch (event.type) {
    case 'wf.instance.started': {
      const { instanceId, definitionName, startedBy } =
        (event as DomainEvent<WorkflowInstanceStartedEvent>).data;
      logger.info('Workflow started - notifying participants', {
        instanceId,
        definitionName,
        startedBy,
      });
      // TODO: Notify workflow participants via dispatcher
      break;
    }
    case 'wf.instance.transitioned': {
      const { instanceId, fromState, toState } =
        (event as DomainEvent<WorkflowInstanceTransitionedEvent>).data;
      logger.info('Workflow transitioned - notifying next assignee', {
        instanceId,
        fromState,
        toState,
      });
      // TODO: Notify assignee of new state via dispatcher
      break;
    }
    case 'wf.instance.completed': {
      const { instanceId, definitionId } =
        (event as DomainEvent<WorkflowInstanceCompletedEvent>).data;
      logger.info('Workflow completed - notifying initiator', {
        instanceId,
        definitionId,
      });
      // TODO: Notify workflow initiator via dispatcher
      break;
    }
    default:
      break;
  }
}

export default initNotificationConsumer;
