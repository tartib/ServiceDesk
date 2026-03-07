/**
 * SLA Clock Engine
 *
 * State machine for SLA metric instances. Manages transitions between
 * running, paused, met, breached, and cancelled states.
 * All mutations return a new state object (immutable style) plus an audit event descriptor.
 */

import {
  ISlaMetricInstanceEntity,
  ISlaCalendarResolved,
  SlaMetricStatus,
  SlaEventType,
  SlaEventSource,
} from '../domain';
import { businessTimeCalculator } from './BusinessTimeCalculator';

export interface ClockStateChange {
  metric: Partial<ISlaMetricInstanceEntity>;
  eventType: SlaEventType;
  payload: Record<string, unknown>;
}

export class SlaClockEngine {
  /**
   * Start a metric clock. Computes due_at using business time.
   */
  startMetric(
    metric: ISlaMetricInstanceEntity,
    calendar: ISlaCalendarResolved,
    now: Date = new Date()
  ): ClockStateChange {
    const dueAt = businessTimeCalculator.addBusinessMinutes(now, metric.targetMinutes, calendar);
    const remainingSec = metric.targetMinutes * 60;

    return {
      metric: {
        status: SlaMetricStatus.RUNNING,
        startedAt: now,
        dueAt,
        remainingBusinessSeconds: remainingSec,
        elapsedBusinessSeconds: 0,
        lastStateChangeAt: now,
        pausedAt: undefined,
        stoppedAt: undefined,
        breachedAt: undefined,
      },
      eventType: SlaEventType.METRIC_STARTED,
      payload: {
        metricKey: metric.metricKey,
        targetMinutes: metric.targetMinutes,
        dueAt: dueAt.toISOString(),
      },
    };
  }

  /**
   * Pause a running metric. Snapshots elapsed time.
   */
  pauseMetric(
    metric: ISlaMetricInstanceEntity,
    calendar: ISlaCalendarResolved,
    now: Date = new Date()
  ): ClockStateChange | null {
    if (metric.status !== SlaMetricStatus.RUNNING) return null;

    // Calculate elapsed business seconds since last state change
    const additionalSec = businessTimeCalculator.getElapsedBusinessSeconds(
      metric.lastStateChangeAt,
      now,
      calendar
    );
    const totalElapsed = metric.elapsedBusinessSeconds + additionalSec;
    const totalTargetSec = metric.targetMinutes * 60;
    const remaining = Math.max(0, totalTargetSec - totalElapsed);

    return {
      metric: {
        status: SlaMetricStatus.PAUSED,
        pausedAt: now,
        elapsedBusinessSeconds: totalElapsed,
        remainingBusinessSeconds: remaining,
        lastStateChangeAt: now,
      },
      eventType: SlaEventType.METRIC_PAUSED,
      payload: {
        metricKey: metric.metricKey,
        elapsedBusinessSeconds: totalElapsed,
        remainingBusinessSeconds: remaining,
      },
    };
  }

  /**
   * Resume a paused metric. Recomputes due_at from remaining time.
   */
  resumeMetric(
    metric: ISlaMetricInstanceEntity,
    calendar: ISlaCalendarResolved,
    now: Date = new Date()
  ): ClockStateChange | null {
    if (metric.status !== SlaMetricStatus.PAUSED) return null;

    const remainingSec = metric.remainingBusinessSeconds ?? (metric.targetMinutes * 60 - metric.elapsedBusinessSeconds);
    const remainingMin = Math.ceil(remainingSec / 60);
    const dueAt = businessTimeCalculator.addBusinessMinutes(now, remainingMin, calendar);

    return {
      metric: {
        status: SlaMetricStatus.RUNNING,
        pausedAt: undefined,
        dueAt,
        remainingBusinessSeconds: remainingSec,
        lastStateChangeAt: now,
      },
      eventType: SlaEventType.METRIC_RESUMED,
      payload: {
        metricKey: metric.metricKey,
        remainingBusinessSeconds: remainingSec,
        newDueAt: dueAt.toISOString(),
      },
    };
  }

  /**
   * Stop a metric (goal achieved). Determines if met or breached.
   */
  stopMetric(
    metric: ISlaMetricInstanceEntity,
    calendar: ISlaCalendarResolved,
    now: Date = new Date()
  ): ClockStateChange | null {
    if (metric.status !== SlaMetricStatus.RUNNING && metric.status !== SlaMetricStatus.PAUSED) {
      return null;
    }

    let totalElapsed = metric.elapsedBusinessSeconds;
    if (metric.status === SlaMetricStatus.RUNNING) {
      totalElapsed += businessTimeCalculator.getElapsedBusinessSeconds(
        metric.lastStateChangeAt,
        now,
        calendar
      );
    }

    const targetSec = metric.targetMinutes * 60;
    const isMet = totalElapsed <= targetSec;
    const newStatus = isMet ? SlaMetricStatus.MET : SlaMetricStatus.BREACHED;

    return {
      metric: {
        status: newStatus,
        stoppedAt: now,
        elapsedBusinessSeconds: totalElapsed,
        remainingBusinessSeconds: 0,
        breachedAt: isMet ? undefined : now,
        lastStateChangeAt: now,
        pausedAt: undefined,
      },
      eventType: isMet ? SlaEventType.METRIC_MET : SlaEventType.METRIC_BREACHED,
      payload: {
        metricKey: metric.metricKey,
        elapsedBusinessSeconds: totalElapsed,
        targetSeconds: targetSec,
        met: isMet,
      },
    };
  }

  /**
   * Mark a running metric as breached (called by scheduler when due_at passes).
   */
  markBreached(
    metric: ISlaMetricInstanceEntity,
    calendar: ISlaCalendarResolved,
    now: Date = new Date()
  ): ClockStateChange | null {
    if (metric.status !== SlaMetricStatus.RUNNING) return null;

    const additionalSec = businessTimeCalculator.getElapsedBusinessSeconds(
      metric.lastStateChangeAt,
      now,
      calendar
    );
    const totalElapsed = metric.elapsedBusinessSeconds + additionalSec;

    return {
      metric: {
        status: SlaMetricStatus.BREACHED,
        breachedAt: now,
        elapsedBusinessSeconds: totalElapsed,
        remainingBusinessSeconds: 0,
        lastStateChangeAt: now,
      },
      eventType: SlaEventType.METRIC_BREACHED,
      payload: {
        metricKey: metric.metricKey,
        elapsedBusinessSeconds: totalElapsed,
        targetSeconds: metric.targetMinutes * 60,
        dueAt: metric.dueAt?.toISOString(),
      },
    };
  }

  /**
   * Cancel a metric (ticket cancelled/deleted).
   */
  cancelMetric(
    metric: ISlaMetricInstanceEntity,
    now: Date = new Date()
  ): ClockStateChange | null {
    if (metric.status === SlaMetricStatus.MET || metric.status === SlaMetricStatus.CANCELLED) {
      return null;
    }

    return {
      metric: {
        status: SlaMetricStatus.CANCELLED,
        stoppedAt: now,
        lastStateChangeAt: now,
        pausedAt: undefined,
      },
      eventType: SlaEventType.METRIC_STOPPED,
      payload: {
        metricKey: metric.metricKey,
        reason: 'cancelled',
      },
    };
  }

  /**
   * Get the live remaining seconds for a running metric.
   */
  getRemainingSeconds(
    metric: ISlaMetricInstanceEntity,
    calendar: ISlaCalendarResolved,
    now: Date = new Date()
  ): number {
    if (metric.status === SlaMetricStatus.PAUSED) {
      return metric.remainingBusinessSeconds ?? 0;
    }
    if (metric.status !== SlaMetricStatus.RUNNING) return 0;

    const additionalSec = businessTimeCalculator.getElapsedBusinessSeconds(
      metric.lastStateChangeAt,
      now,
      calendar
    );
    const totalElapsed = metric.elapsedBusinessSeconds + additionalSec;
    const targetSec = metric.targetMinutes * 60;
    return Math.max(0, targetSec - totalElapsed);
  }
}

export const slaClockEngine = new SlaClockEngine();
