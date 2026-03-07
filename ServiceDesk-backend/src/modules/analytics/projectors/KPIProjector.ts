/**
 * KPI Projector
 *
 * Incrementally updates DailyKPISnapshot counters on each domain event.
 * Avoids full recalculation — each event adjusts the relevant counters.
 */

import mongoose from 'mongoose';
import {
  DomainEvent,
  WorkOrderCreatedEvent,
  WorkOrderCompletedEvent,
  WorkItemCreatedEvent,
  WorkItemTransitionedEvent,
} from '../../../shared/events/event.types';
import DailyKPISnapshot from '../read-models/DailyKPISnapshot';
import logger from '../../../utils/logger';
import { isAnalyticsPostgres, getAnalyticsRepos } from '../infrastructure/repositories';

function toDateKey(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export class KPIProjector {
  // ── PM events ────────────────────────────────────────────────

  async onWorkItemCreated(event: DomainEvent<WorkItemCreatedEvent>): Promise<void> {
    const dateKey = toDateKey(event.timestamp);
    const { type, priority } = event.data;

    try {
      const increments: Record<string, number> = {
        totalTasks: 1,
        createdTasks: 1,
        pendingTasks: 1,
        [`byType.${type || 'unknown'}`]: 1,
        [`byPriority.${priority || 'unknown'}`]: 1,
        'byStatus.new': 1,
      };

      // ── PostgreSQL path ──
      if (isAnalyticsPostgres()) {
        const repo = getAnalyticsRepos().dailyKPI;
        await repo.incrementCounters(dateKey, event.organizationId || null, 'pm', increments);
        logger.debug('KPIProjector: PM task created (PG)', { dateKey });
        return;
      }

      // ── MongoDB path ──
      await DailyKPISnapshot.updateOne(
        {
          date: dateKey,
          organizationId: event.organizationId
            ? new mongoose.Types.ObjectId(event.organizationId)
            : null,
          sourceModule: 'pm',
        },
        {
          $inc: increments,
          $set: { lastUpdatedAt: new Date() },
        },
        { upsert: true }
      );

      logger.debug('KPIProjector: PM task created', { dateKey });
    } catch (error) {
      logger.error('KPIProjector: failed on WorkItemCreated', { error });
    }
  }

  async onWorkItemTransitioned(event: DomainEvent<WorkItemTransitionedEvent>): Promise<void> {
    const dateKey = toDateKey(event.timestamp);
    const { from, to } = event.data;
    const fromCat = this.inferStatusCategory(from);
    const toCat = this.inferStatusCategory(to);

    if (fromCat === toCat) return; // No category change

    try {
      const inc: Record<string, number> = {};

      // Decrement old category
      if (fromCat === 'todo') inc.pendingTasks = -1;
      else if (fromCat === 'in_progress') inc.inProgressTasks = -1;
      else if (fromCat === 'done') inc.completedTasks = -1;

      // Increment new category
      if (toCat === 'todo') inc.pendingTasks = 1;
      else if (toCat === 'in_progress') inc.inProgressTasks = 1;
      else if (toCat === 'done') inc.completedTasks = 1;

      // Track status distribution changes
      inc[`byStatus.${to}`] = 1;
      if (from) inc[`byStatus.${from}`] = -1;

      // ── PostgreSQL path ──
      if (isAnalyticsPostgres()) {
        const repo = getAnalyticsRepos().dailyKPI;
        await repo.incrementCounters(dateKey, event.organizationId || null, 'pm', inc);
        await this.recalcCompletionRate(dateKey, event.organizationId, 'pm');
        logger.debug('KPIProjector: PM task transitioned (PG)', { dateKey, from, to });
        return;
      }

      // ── MongoDB path ──
      await DailyKPISnapshot.updateOne(
        {
          date: dateKey,
          organizationId: event.organizationId
            ? new mongoose.Types.ObjectId(event.organizationId)
            : null,
          sourceModule: 'pm',
        },
        {
          $inc: inc,
          $set: { lastUpdatedAt: new Date() },
        },
        { upsert: true }
      );

      // Recalculate completion rate for this date
      await this.recalcCompletionRate(dateKey, event.organizationId, 'pm');

      logger.debug('KPIProjector: PM task transitioned', { dateKey, from, to });
    } catch (error) {
      logger.error('KPIProjector: failed on WorkItemTransitioned', { error });
    }
  }

  // ── OPS events ───────────────────────────────────────────────

  async onWorkOrderCreated(event: DomainEvent<WorkOrderCreatedEvent>): Promise<void> {
    const dateKey = toDateKey(event.timestamp);
    const { type, priority } = event.data;

    try {
      const inc: Record<string, number> = {
        totalTasks: 1,
        createdTasks: 1,
        pendingTasks: 1,
        [`byType.${type || 'unknown'}`]: 1,
        [`byPriority.${priority || 'unknown'}`]: 1,
        'byStatus.created': 1,
      };

      if (priority === 'critical') inc.criticalTasks = 1;

      // ── PostgreSQL path ──
      if (isAnalyticsPostgres()) {
        const repo = getAnalyticsRepos().dailyKPI;
        await repo.incrementCounters(dateKey, event.organizationId || null, 'ops', inc);
        logger.debug('KPIProjector: OPS work order created (PG)', { dateKey });
        return;
      }

      // ── MongoDB path ──
      await DailyKPISnapshot.updateOne(
        {
          date: dateKey,
          organizationId: event.organizationId
            ? new mongoose.Types.ObjectId(event.organizationId)
            : null,
          sourceModule: 'ops',
        },
        {
          $inc: inc,
          $set: { lastUpdatedAt: new Date() },
        },
        { upsert: true }
      );

      logger.debug('KPIProjector: OPS work order created', { dateKey });
    } catch (error) {
      logger.error('KPIProjector: failed on WorkOrderCreated', { error });
    }
  }

  async onWorkOrderCompleted(event: DomainEvent<WorkOrderCompletedEvent>): Promise<void> {
    const dateKey = toDateKey(event.timestamp);
    const { duration } = event.data;
    const durationHours = duration ? duration / 60 : 0;

    try {
      const inc: Record<string, number> = {
        completedTasks: 1,
        pendingTasks: -1,
        'byStatus.completed': 1,
        'byStatus.created': -1,
      };

      if (durationHours > 0) {
        inc.totalCompletionTimeHours = durationHours;
        inc.completedWithDurationCount = 1;
      }

      // ── PostgreSQL path ──
      if (isAnalyticsPostgres()) {
        const repo = getAnalyticsRepos().dailyKPI;
        await repo.incrementCounters(dateKey, event.organizationId || null, 'ops', inc);
        await this.recalcCompletionRate(dateKey, event.organizationId, 'ops');
        await this.recalcAvgCompletionTime(dateKey, event.organizationId, 'ops');
        logger.debug('KPIProjector: OPS work order completed (PG)', { dateKey });
        return;
      }

      // ── MongoDB path ──
      await DailyKPISnapshot.updateOne(
        {
          date: dateKey,
          organizationId: event.organizationId
            ? new mongoose.Types.ObjectId(event.organizationId)
            : null,
          sourceModule: 'ops',
        },
        {
          $inc: inc,
          $set: { lastUpdatedAt: new Date() },
        },
        { upsert: true }
      );

      // Recalculate averages and rates
      await this.recalcCompletionRate(dateKey, event.organizationId, 'ops');
      await this.recalcAvgCompletionTime(dateKey, event.organizationId, 'ops');

      logger.debug('KPIProjector: OPS work order completed', { dateKey });
    } catch (error) {
      logger.error('KPIProjector: failed on WorkOrderCompleted', { error });
    }
  }

  // ── Recalculation helpers ────────────────────────────────────

  private async recalcCompletionRate(
    dateKey: string,
    organizationId: string | undefined,
    sourceModule: 'pm' | 'ops'
  ): Promise<void> {
    // ── PostgreSQL path ──
    if (isAnalyticsPostgres()) {
      const repo = getAnalyticsRepos().dailyKPI;
      const doc = await repo.findSnapshot(dateKey, organizationId || null, sourceModule);
      if (!doc || doc.totalTasks === 0) return;
      const completionRate = Math.round((doc.completedTasks / doc.totalTasks) * 10000) / 10000;
      await repo.updateField(doc.id || doc._id, 'completionRate', completionRate);
      return;
    }

    // ── MongoDB path ──
    const doc = await DailyKPISnapshot.findOne({
      date: dateKey,
      organizationId: organizationId
        ? new mongoose.Types.ObjectId(organizationId)
        : null,
      sourceModule,
    });

    if (!doc || doc.totalTasks === 0) return;

    const completionRate = Math.round((doc.completedTasks / doc.totalTasks) * 10000) / 10000;
    await DailyKPISnapshot.updateOne({ _id: doc._id }, { $set: { completionRate } });
  }

  private async recalcAvgCompletionTime(
    dateKey: string,
    organizationId: string | undefined,
    sourceModule: 'pm' | 'ops'
  ): Promise<void> {
    // ── PostgreSQL path ──
    if (isAnalyticsPostgres()) {
      const repo = getAnalyticsRepos().dailyKPI;
      const doc = await repo.findSnapshot(dateKey, organizationId || null, sourceModule);
      if (!doc || doc.completedWithDurationCount === 0) return;
      const avg = Math.round((doc.totalCompletionTimeHours / doc.completedWithDurationCount) * 100) / 100;
      await repo.updateField(doc.id || doc._id, 'averageCompletionTimeHours', avg);
      return;
    }

    // ── MongoDB path ──
    const doc = await DailyKPISnapshot.findOne({
      date: dateKey,
      organizationId: organizationId
        ? new mongoose.Types.ObjectId(organizationId)
        : null,
      sourceModule,
    });

    if (!doc || doc.completedWithDurationCount === 0) return;

    const avg = Math.round(
      (doc.totalCompletionTimeHours / doc.completedWithDurationCount) * 100
    ) / 100;

    await DailyKPISnapshot.updateOne(
      { _id: doc._id },
      { $set: { averageCompletionTimeHours: avg } }
    );
  }

  // ── Helpers ──────────────────────────────────────────────────

  private inferStatusCategory(status: string): 'todo' | 'in_progress' | 'done' {
    const lower = status.toLowerCase();
    if (['done', 'completed', 'closed', 'resolved', 'cancelled'].includes(lower)) {
      return 'done';
    }
    if (['in_progress', 'in progress', 'active', 'started', 'review', 'testing'].includes(lower)) {
      return 'in_progress';
    }
    return 'todo';
  }
}

export const kpiProjector = new KPIProjector();
