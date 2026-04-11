/**
 * Gamification Consumer
 *
 * Subscribes to PM and OPS domain events and delegates
 * to the GamificationOrchestrator for point calculation,
 * streaks, achievements, and celebrations.
 */

import eventBus from '../../../shared/events/event-bus';
import { DomainEvent } from '../../../shared/events/event.types';
import { gamificationOrchestrator } from '../services/GamificationOrchestrator';
import logger from '../../../utils/logger';

const QUEUE_NAME = 'servicedesk.gamification.consumers';

/**
 * Initialize gamification event consumer.
 */
export async function initGamificationConsumer(): Promise<void> {
  // PM work item transitioned (filter for done status in handler)
  await eventBus.subscribe(
    QUEUE_NAME,
    'pm.work_item.transitioned',
    handleWorkItemTransitioned,
  );

  // OPS work order completed
  await eventBus.subscribe(
    QUEUE_NAME,
    'ops.work_order.completed',
    handleWorkOrderCompleted,
  );

  // PM sprint completed
  await eventBus.subscribe(
    QUEUE_NAME,
    'pm.sprint.completed',
    handleSprintCompleted,
  );

  logger.info('🎮 Gamification consumer initialized');
}

// ── Handlers ──────────────────────────────────────────────────

async function handleWorkItemTransitioned(event: DomainEvent<any>): Promise<void> {
  try {
    const { data } = event;

    // Only process transitions to "done" status category
    if (data.toStatusCategory !== 'done' && data.to?.category !== 'done') {
      return;
    }

    await gamificationOrchestrator.onTaskCompleted({
      eventId: event.id,
      userId: event.userId,
      organizationId: event.organizationId,
      taskId: data.taskId || data.workItemId || data.id,
      taskType: data.taskType || data.type || 'task',
      priority: data.priority,
      statusCategory: 'done',
      storyPoints: data.storyPoints,
      completedAt: new Date(event.timestamp),
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    });
  } catch (err) {
    logger.error('[GamificationConsumer] Error handling work item transitioned', {
      eventId: event.id,
      error: err,
    });
  }
}

async function handleWorkOrderCompleted(event: DomainEvent<any>): Promise<void> {
  try {
    const { data } = event;

    await gamificationOrchestrator.onWorkOrderCompleted({
      eventId: event.id,
      userId: event.userId,
      organizationId: event.organizationId,
      workOrderId: data.workOrderId || data.id,
      completedAt: new Date(event.timestamp),
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    });
  } catch (err) {
    logger.error('[GamificationConsumer] Error handling work order completed', {
      eventId: event.id,
      error: err,
    });
  }
}

async function handleSprintCompleted(event: DomainEvent<any>): Promise<void> {
  try {
    const { data } = event;

    await gamificationOrchestrator.onSprintCompleted({
      eventId: event.id,
      userId: event.userId,
      organizationId: event.organizationId,
      sprintId: data.sprintId || data.id,
      velocity: data.velocity,
      completedItems: data.completedItems,
      incompleteItems: data.incompleteItems,
    });
  } catch (err) {
    logger.error('[GamificationConsumer] Error handling sprint completed', {
      eventId: event.id,
      error: err,
    });
  }
}

export default initGamificationConsumer;
