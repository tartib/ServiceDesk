/**
 * Notification Consumer
 * 
 * Handles events that trigger notifications
 */

import eventBus from '../event-bus';
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
} from '../event.types';
import logger from '../../../../../utils/logger';

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

  logger.info('📬 Notification consumer initialized');
}

/**
 * Handle all created events
 */
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

/**
 * Handle transition events
 */
async function handleTransitionEvent(event: DomainEvent<unknown>): Promise<void> {
  logger.debug('Processing transition event for notification', { type: event.type });

  if (event.type === 'pm.work_item.transitioned') {
    await notifyWorkItemTransitioned(event as DomainEvent<WorkItemTransitionedEvent>);
  }
}

/**
 * Notify about work order creation
 */
async function notifyWorkOrderCreated(
  event: DomainEvent<WorkOrderCreatedEvent>
): Promise<void> {
  const { workOrderId, assigneeId, productName, priority } = event.data;

  if (assigneeId) {
    // TODO: Send notification to assignee
    logger.info('Sending work order assignment notification', {
      workOrderId,
      assigneeId,
      productName,
      priority,
    });

    // Integration point: Push notification, email, in-app notification
  }
}

/**
 * Handle work order overdue event
 */
async function handleWorkOrderOverdue(
  event: DomainEvent<WorkOrderOverdueEvent>
): Promise<void> {
  const { workOrderId, assigneeId, overdueMinutes } = event.data;

  logger.warn('Work order overdue - sending urgent notification', {
    workOrderId,
    overdueMinutes,
  });

  // TODO: Send urgent notification to assignee and supervisor
  // - Push notification with high priority
  // - SMS if configured
  // - Dashboard alert
}

/**
 * Handle work order escalation event
 */
async function handleWorkOrderEscalated(
  event: DomainEvent<WorkOrderEscalatedEvent>
): Promise<void> {
  const { workOrderId, escalatedTo, reason } = event.data;

  logger.warn('Work order escalated - notifying manager', {
    workOrderId,
    escalatedTo,
    reason,
  });

  // TODO: Send notification to escalation target (manager)
  // - High priority push notification
  // - Email with details
}

/**
 * Notify about work item transition
 */
async function notifyWorkItemTransitioned(
  event: DomainEvent<WorkItemTransitionedEvent>
): Promise<void> {
  const { itemId, from, to, transitionedBy } = event.data;

  logger.debug('Work item transitioned', {
    itemId,
    from,
    to,
    transitionedBy,
  });

  // TODO: Notify watchers about status change
}

/**
 * Handle sprint started event
 */
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

  // TODO: Notify all project members about sprint start
}

/**
 * Handle sprint completed event
 */
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

  // TODO: Send sprint completion summary to team
}

export default initNotificationConsumer;
