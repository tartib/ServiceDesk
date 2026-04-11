/**
 * Gamification Orchestrator
 *
 * Top-level coordinator that connects all engines.
 * Each method is idempotent via eventId dedup in PointsEngine.
 */

import { pointsEngine, RuleEvalContext } from './PointsEngine';
import { streakEngine } from './StreakEngine';
import { growthEngine } from './GrowthEngine';
import { achievementEngine } from './AchievementEngine';
import { celebrationService } from './CelebrationService';
import { gamificationPublisher } from '../publishers/gamification.publisher';
import logger from '../../../utils/logger';

export interface TaskCompletedEvent {
  eventId: string;
  userId: string;
  organizationId: string;
  taskId: string;
  taskType: string;
  priority?: string;
  statusCategory?: string;
  storyPoints?: number;
  completedAt?: Date;
  dueDate?: Date;
}

export interface SprintCompletedEvent {
  eventId: string;
  userId: string;
  organizationId: string;
  sprintId: string;
  velocity?: number;
  completedItems?: number;
  incompleteItems?: number;
}

export interface WorkOrderCompletedEvent {
  eventId: string;
  userId: string;
  organizationId: string;
  workOrderId: string;
  completedAt?: Date;
  dueDate?: Date;
}

export class GamificationOrchestrator {
  /**
   * Handle PM task completion (work_item.transitioned → done).
   */
  async onTaskCompleted(event: TaskCompletedEvent): Promise<void> {
    const { eventId, userId, organizationId, taskId, taskType, priority, storyPoints, completedAt, dueDate } = event;

    logger.info('[GamificationOrchestrator] Processing task completed', { eventId, userId, taskId });

    // Anti-fraud: check reopen abuse
    const isAbuse = await pointsEngine.checkReopenAbuse(userId, taskId);
    if (isAbuse) {
      logger.warn('[GamificationOrchestrator] Reopen abuse detected, skipping', { userId, taskId });
      return;
    }

    // Build rule evaluation context
    const context: RuleEvalContext = {
      eventType: 'pm.work_item.transitioned',
      userId,
      organizationId,
      sourceEntityType: taskType,
      priority,
      statusCategory: 'done',
      storyPoints,
      completedAt,
      dueDate,
    };

    // 1. Apply points rules
    const { totalAwarded, appliedRules } = await pointsEngine.applyRules(
      userId, organizationId, eventId,
      'pm.work_item.transitioned', context,
      'pm', 'task', taskId,
    );

    if (totalAwarded > 0) {
      // Publish points awarded event
      await gamificationPublisher.publishPointsAwarded({
        userId,
        organizationId,
        pointsDelta: totalAwarded,
        reasonCode: 'task_completed',
        newTotal: 0, // will be filled by publisher
        sourceEntityId: taskId,
      });
    }

    // 2. Recalculate level/growth state
    const growthResult = await growthEngine.recalculate(userId, organizationId);

    if (growthResult.levelChanged) {
      await celebrationService.onLevelUp({
        userId,
        organizationId,
        previousLevel: growthResult.previousLevel,
        newLevel: growthResult.newLevel,
        newGrowthState: growthResult.newGrowthState,
      });

      await gamificationPublisher.publishLevelChanged({
        userId,
        organizationId,
        previousLevel: growthResult.previousLevel,
        newLevel: growthResult.newLevel,
        newGrowthState: growthResult.newGrowthState,
      });
    }

    if (growthResult.growthStateChanged) {
      await gamificationPublisher.publishGrowthStateChanged({
        userId,
        organizationId,
        previousState: growthResult.previousGrowthState,
        newState: growthResult.newGrowthState,
      });
    }

    // 3. Evaluate achievements
    const achievements = await achievementEngine.evaluateAchievements(userId, organizationId);
    for (const ach of achievements) {
      await celebrationService.onAchievementUnlocked(ach);
      await gamificationPublisher.publishAchievementUnlocked(ach);
    }

    // 4. Record streak activity
    await streakEngine.recordActivity(userId, organizationId);
  }

  /**
   * Handle OPS work order completion.
   */
  async onWorkOrderCompleted(event: WorkOrderCompletedEvent): Promise<void> {
    const { eventId, userId, organizationId, workOrderId, completedAt, dueDate } = event;

    logger.info('[GamificationOrchestrator] Processing work order completed', { eventId, userId, workOrderId });

    const isAbuse = await pointsEngine.checkReopenAbuse(userId, workOrderId);
    if (isAbuse) {
      logger.warn('[GamificationOrchestrator] Reopen abuse detected for WO', { userId, workOrderId });
      return;
    }

    const context: RuleEvalContext = {
      eventType: 'ops.work_order.completed',
      userId,
      organizationId,
      sourceEntityType: 'work_order',
      statusCategory: 'completed',
      completedAt,
      dueDate,
    };

    const { totalAwarded } = await pointsEngine.applyRules(
      userId, organizationId, eventId,
      'ops.work_order.completed', context,
      'ops', 'work_order', workOrderId,
    );

    if (totalAwarded > 0) {
      await gamificationPublisher.publishPointsAwarded({
        userId,
        organizationId,
        pointsDelta: totalAwarded,
        reasonCode: 'work_order_completed',
        newTotal: 0,
        sourceEntityId: workOrderId,
      });
    }

    const growthResult = await growthEngine.recalculate(userId, organizationId);
    if (growthResult.levelChanged) {
      await celebrationService.onLevelUp({
        userId, organizationId,
        previousLevel: growthResult.previousLevel,
        newLevel: growthResult.newLevel,
        newGrowthState: growthResult.newGrowthState,
      });
    }

    const achievements = await achievementEngine.evaluateAchievements(userId, organizationId);
    for (const ach of achievements) {
      await celebrationService.onAchievementUnlocked(ach);
    }

    await streakEngine.recordActivity(userId, organizationId);
  }

  /**
   * Handle PM sprint completion.
   */
  async onSprintCompleted(event: SprintCompletedEvent): Promise<void> {
    const { eventId, userId, organizationId, sprintId, velocity } = event;

    logger.info('[GamificationOrchestrator] Processing sprint completed', { eventId, sprintId });

    const context: RuleEvalContext = {
      eventType: 'pm.sprint.completed',
      userId,
      organizationId,
      sourceEntityType: 'sprint',
      velocity: velocity as number,
    };

    await pointsEngine.applyRules(
      userId, organizationId, eventId,
      'pm.sprint.completed', context,
      'pm', 'sprint', sprintId,
    );

    await growthEngine.recalculate(userId, organizationId);
    await achievementEngine.evaluateAchievements(userId, organizationId);
  }
}

export const gamificationOrchestrator = new GamificationOrchestrator();
