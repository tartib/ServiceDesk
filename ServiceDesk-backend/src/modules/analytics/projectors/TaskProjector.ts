/**
 * Task Projector
 *
 * Materializes PM + OPS task events into the TaskSnapshot read model.
 * Upserts on each event so the snapshot stays current without full recalc.
 */

import mongoose from 'mongoose';
import {
  DomainEvent,
  WorkOrderCreatedEvent,
  WorkOrderCompletedEvent,
  WorkItemCreatedEvent,
  WorkItemTransitionedEvent,
} from '../../../shared/events/event.types';
import TaskSnapshot from '../read-models/TaskSnapshot';
import logger from '../../../utils/logger';
import { isAnalyticsPostgres, getAnalyticsRepos } from '../infrastructure/repositories';

export class TaskProjector {
  // ── PM events ────────────────────────────────────────────────

  async onWorkItemCreated(event: DomainEvent<WorkItemCreatedEvent>): Promise<void> {
    const { itemId, projectId, type, priority, assigneeId, title } = event.data;

    try {
      // ── PostgreSQL path ──
      if (isAnalyticsPostgres()) {
        const repo = getAnalyticsRepos().taskSnapshot;
        await repo.upsertBySource(itemId, 'pm', {
          projectId: projectId || null,
          organizationId: event.organizationId || null,
          title,
          type,
          priority,
          status: 'new',
          statusCategory: 'todo',
          assigneeId: assigneeId || null,
          lastEventType: event.type,
          lastEventAt: new Date(event.timestamp),
          createdAt: new Date(event.timestamp),
        });
        logger.debug('TaskProjector: PM work item created snapshot upserted (PG)', { itemId });
        return;
      }

      // ── MongoDB path ──
      await TaskSnapshot.updateOne(
        { sourceId: new mongoose.Types.ObjectId(itemId), sourceModule: 'pm' },
        {
          $set: {
            projectId: projectId ? new mongoose.Types.ObjectId(projectId) : undefined,
            organizationId: event.organizationId
              ? new mongoose.Types.ObjectId(event.organizationId)
              : undefined,
            title,
            type,
            priority,
            status: 'new',
            statusCategory: 'todo',
            assigneeId: assigneeId ? new mongoose.Types.ObjectId(assigneeId) : undefined,
            lastEventType: event.type,
            lastEventAt: event.timestamp,
          },
          $setOnInsert: {
            sourceId: new mongoose.Types.ObjectId(itemId),
            sourceModule: 'pm',
            createdAt: event.timestamp,
          },
        },
        { upsert: true }
      );

      logger.debug('TaskProjector: PM work item created snapshot upserted', { itemId });
    } catch (error) {
      logger.error('TaskProjector: failed to project WorkItemCreated', { itemId, error });
    }
  }

  async onWorkItemTransitioned(event: DomainEvent<WorkItemTransitionedEvent>): Promise<void> {
    const { itemId, from, to } = event.data;

    try {
      const statusCategory = this.inferStatusCategory(to);
      const update: Record<string, any> = {
        status: to,
        statusCategory,
        lastEventType: event.type,
        lastEventAt: new Date(event.timestamp),
        updatedAt: new Date(event.timestamp),
      };

      // If transitioning to 'done', record completion time
      if (statusCategory === 'done') {
        update.completedAt = new Date(event.timestamp);
      }

      // ── PostgreSQL path ──
      if (isAnalyticsPostgres()) {
        const repo = getAnalyticsRepos().taskSnapshot;
        const snapshot = await repo.updateBySource(itemId, 'pm', update);

        // Compute duration if completed
        if (snapshot && statusCategory === 'done' && snapshot.createdAt) {
          const durationMs = new Date(event.timestamp).getTime() - new Date(snapshot.createdAt).getTime();
          const durationHours = Math.round((durationMs / (1000 * 60 * 60)) * 100) / 100;
          const isOnTime = snapshot.dueDate
            ? new Date(event.timestamp) <= new Date(snapshot.dueDate)
            : true;
          await repo.updateBySource(itemId, 'pm', { durationHours, isOnTime, isOverdue: false });
        }

        logger.debug('TaskProjector: PM work item transitioned (PG)', { itemId, from, to });
        return;
      }

      // ── MongoDB path ──
      const snapshot = await TaskSnapshot.findOneAndUpdate(
        { sourceId: new mongoose.Types.ObjectId(itemId), sourceModule: 'pm' },
        { $set: { ...update, lastEventAt: event.timestamp, updatedAt: event.timestamp, completedAt: update.completedAt || undefined } },
        { new: true }
      );

      // Compute duration if completed
      if (snapshot && statusCategory === 'done' && snapshot.createdAt) {
        const durationMs = new Date(event.timestamp).getTime() - new Date(snapshot.createdAt).getTime();
        const durationHours = Math.round((durationMs / (1000 * 60 * 60)) * 100) / 100;
        const isOnTime = snapshot.dueDate
          ? new Date(event.timestamp) <= new Date(snapshot.dueDate)
          : true;

        await TaskSnapshot.updateOne(
          { _id: snapshot._id },
          { $set: { durationHours, isOnTime, isOverdue: false } }
        );
      }

      logger.debug('TaskProjector: PM work item transitioned', { itemId, from, to });
    } catch (error) {
      logger.error('TaskProjector: failed to project WorkItemTransitioned', { itemId, error });
    }
  }

  // ── OPS events ───────────────────────────────────────────────

  async onWorkOrderCreated(event: DomainEvent<WorkOrderCreatedEvent>): Promise<void> {
    const { workOrderId, type, priority, assigneeId, productName } = event.data;

    try {
      // ── PostgreSQL path ──
      if (isAnalyticsPostgres()) {
        const repo = getAnalyticsRepos().taskSnapshot;
        await repo.upsertBySource(workOrderId, 'ops', {
          organizationId: event.organizationId || null,
          title: productName || `Work Order ${workOrderId}`,
          type,
          priority,
          status: 'created',
          statusCategory: 'todo',
          assigneeId: assigneeId || null,
          lastEventType: event.type,
          lastEventAt: new Date(event.timestamp),
          createdAt: new Date(event.timestamp),
        });
        logger.debug('TaskProjector: OPS work order created snapshot upserted (PG)', { workOrderId });
        return;
      }

      // ── MongoDB path ──
      await TaskSnapshot.updateOne(
        { sourceId: new mongoose.Types.ObjectId(workOrderId), sourceModule: 'ops' },
        {
          $set: {
            organizationId: event.organizationId
              ? new mongoose.Types.ObjectId(event.organizationId)
              : undefined,
            title: productName || `Work Order ${workOrderId}`,
            type,
            priority,
            status: 'created',
            statusCategory: 'todo',
            assigneeId: assigneeId ? new mongoose.Types.ObjectId(assigneeId) : undefined,
            lastEventType: event.type,
            lastEventAt: event.timestamp,
          },
          $setOnInsert: {
            sourceId: new mongoose.Types.ObjectId(workOrderId),
            sourceModule: 'ops',
            createdAt: event.timestamp,
          },
        },
        { upsert: true }
      );

      logger.debug('TaskProjector: OPS work order created snapshot upserted', { workOrderId });
    } catch (error) {
      logger.error('TaskProjector: failed to project WorkOrderCreated', { workOrderId, error });
    }
  }

  async onWorkOrderCompleted(event: DomainEvent<WorkOrderCompletedEvent>): Promise<void> {
    const { workOrderId, completedAt, duration } = event.data;

    try {
      const durationHours = duration ? Math.round((duration / 60) * 100) / 100 : undefined;

      // ── PostgreSQL path ──
      if (isAnalyticsPostgres()) {
        const repo = getAnalyticsRepos().taskSnapshot;
        await repo.updateBySource(workOrderId, 'ops', {
          status: 'completed',
          statusCategory: 'done',
          completedAt: completedAt ? new Date(completedAt) : new Date(event.timestamp),
          durationHours: durationHours || null,
          isOverdue: false,
          lastEventType: event.type,
          lastEventAt: new Date(event.timestamp),
          updatedAt: new Date(event.timestamp),
        });
        logger.debug('TaskProjector: OPS work order completed (PG)', { workOrderId });
        return;
      }

      // ── MongoDB path ──
      await TaskSnapshot.updateOne(
        { sourceId: new mongoose.Types.ObjectId(workOrderId), sourceModule: 'ops' },
        {
          $set: {
            status: 'completed',
            statusCategory: 'done',
            completedAt: completedAt || event.timestamp,
            durationHours,
            isOverdue: false,
            lastEventType: event.type,
            lastEventAt: event.timestamp,
            updatedAt: event.timestamp,
          },
        }
      );

      logger.debug('TaskProjector: OPS work order completed', { workOrderId });
    } catch (error) {
      logger.error('TaskProjector: failed to project WorkOrderCompleted', { workOrderId, error });
    }
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

export const taskProjector = new TaskProjector();
