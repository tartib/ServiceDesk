/**
 * Analytics Consumer (Module-owned)
 *
 * Subscribes to domain events and delegates to CQRS projectors
 * that materialize read models. Moved from shared/events/consumers/.
 */

import eventBus from '../../../shared/events/event-bus';
import {
  DomainEvent,
  QUEUES,
  ROUTING_PATTERNS,
  WorkOrderCreatedEvent,
  WorkOrderCompletedEvent,
  WorkItemCreatedEvent,
  WorkItemTransitionedEvent,
  SprintCompletedEvent,
} from '../../../shared/events/event.types';
import { eventLogProjector } from '../projectors/EventLogProjector';
import { taskProjector } from '../projectors/TaskProjector';
import { kpiProjector } from '../projectors/KPIProjector';
import logger from '../../../utils/logger';

const QUEUE_NAME = QUEUES.ANALYTICS;

/**
 * Initialize analytics consumer with CQRS projectors.
 */
export async function initAnalyticsConsumer(): Promise<void> {
  // Every event → EventLog (raw event store)
  await eventBus.subscribe(
    QUEUE_NAME,
    ROUTING_PATTERNS.ALL_EVENTS,
    handleAllEvents
  );

  // PM work item events → TaskSnapshot + KPI
  await eventBus.subscribe(
    QUEUE_NAME,
    'pm.work_item.created',
    handleWorkItemCreated
  );

  await eventBus.subscribe(
    QUEUE_NAME,
    'pm.work_item.transitioned',
    handleWorkItemTransitioned
  );

  // OPS work order events → TaskSnapshot + KPI
  await eventBus.subscribe(
    QUEUE_NAME,
    'ops.work_order.created',
    handleWorkOrderCreated
  );

  await eventBus.subscribe(
    QUEUE_NAME,
    'ops.work_order.completed',
    handleWorkOrderCompleted
  );

  // Sprint completion → metrics tracking
  await eventBus.subscribe(
    QUEUE_NAME,
    'pm.sprint.completed',
    handleSprintCompleted
  );

  logger.info('📊 Analytics consumer initialized (CQRS projectors wired)');
}

// ============================================================
// HANDLERS
// ============================================================

/**
 * Every domain event → EventLog read model
 */
async function handleAllEvents(event: DomainEvent<unknown>): Promise<void> {
  await eventLogProjector.project(event);
}

/**
 * PM work item created → TaskSnapshot + DailyKPI
 */
async function handleWorkItemCreated(event: DomainEvent<WorkItemCreatedEvent>): Promise<void> {
  await Promise.all([
    taskProjector.onWorkItemCreated(event),
    kpiProjector.onWorkItemCreated(event),
  ]);
}

/**
 * PM work item transitioned → TaskSnapshot + DailyKPI
 */
async function handleWorkItemTransitioned(event: DomainEvent<WorkItemTransitionedEvent>): Promise<void> {
  await Promise.all([
    taskProjector.onWorkItemTransitioned(event),
    kpiProjector.onWorkItemTransitioned(event),
  ]);
}

/**
 * OPS work order created → TaskSnapshot + DailyKPI
 */
async function handleWorkOrderCreated(event: DomainEvent<WorkOrderCreatedEvent>): Promise<void> {
  await Promise.all([
    taskProjector.onWorkOrderCreated(event),
    kpiProjector.onWorkOrderCreated(event),
  ]);
}

/**
 * OPS work order completed → TaskSnapshot + DailyKPI
 */
async function handleWorkOrderCompleted(event: DomainEvent<WorkOrderCompletedEvent>): Promise<void> {
  await Promise.all([
    taskProjector.onWorkOrderCompleted(event),
    kpiProjector.onWorkOrderCompleted(event),
  ]);
}

/**
 * Sprint completed → log metrics (future: SprintSnapshot read model)
 */
async function handleSprintCompleted(event: DomainEvent<SprintCompletedEvent>): Promise<void> {
  const { sprintId, velocity, completedItems, incompleteItems } = event.data;

  logger.info('Analytics: Sprint completed', {
    sprintId,
    velocity,
    completedItems,
    incompleteItems,
    completionRate: completedItems / (completedItems + incompleteItems),
  });

  // EventLog already captures this via handleAllEvents
  // TODO: Future — SprintSnapshot read model for velocity trends
}

export default initAnalyticsConsumer;
