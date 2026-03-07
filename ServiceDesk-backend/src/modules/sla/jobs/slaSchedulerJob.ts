/**
 * SLA Scheduler Job
 *
 * Runs on a configurable interval to detect near-breach and breached metrics,
 * mark them accordingly, and trigger escalation rules.
 */

import { getSlaRepos } from '../infrastructure/repositories/SlaRepositoryFactory';
import { slaClockEngine } from '../services/SlaClockEngine';
import { escalationEngine, EscalationContext } from '../services/EscalationEngine';
import { publishSlaEvent } from '../publishers/sla.publisher';
import { SlaMetricStatus, SlaEventType, SlaEventSource } from '../domain';
import logger from '../../../utils/logger';

let intervalHandle: NodeJS.Timeout | null = null;

const DEFAULT_INTERVAL_MS = 30_000; // 30 seconds
const WARNING_THRESHOLD_SECONDS = 15 * 60; // 15 minutes before breach

/**
 * Single tick of the scheduler.
 * 1. Find running metrics past due_at → mark breached
 * 2. Find running metrics near breach → evaluate pre-breach escalation rules
 */
async function tick(): Promise<void> {
  try {
    const repos = getSlaRepos();

    // ── Step 1: Breach detection ─────────────────────────────
    const breachedMetrics = await repos.metricRepo.findBreached(500);

    for (const metric of breachedMetrics) {
      try {
        const calendar = metric.calendarId
          ? await repos.calendarRepo.resolve(metric.calendarId)
          : null;

        if (!calendar) {
          logger.warn('[SLA:Scheduler] No calendar for metric, skipping breach', {
            metricId: metric.id,
          });
          continue;
        }

        const now = new Date();
        const change = slaClockEngine.markBreached(metric, calendar, now);
        if (!change) continue;

        await repos.metricRepo.update(metric.id!, change.metric);

        // Get instance for tenant/ticket context
        const instance = await repos.instanceRepo.findById(metric.instanceId);
        if (!instance) continue;

        // Write audit event
        await repos.eventRepo.append({
          tenantId: instance.tenantId,
          instanceId: instance.id!,
          metricInstanceId: metric.id,
          ticketId: instance.ticketId,
          eventType: SlaEventType.METRIC_BREACHED,
          eventSource: SlaEventSource.SCHEDULER,
          payload: change.payload,
          occurredAt: now,
        });

        // Publish domain event
        await publishSlaEvent(
          SlaEventType.METRIC_BREACHED,
          instance.tenantId,
          'system',
          {
            ticketId: instance.ticketId,
            instanceId: instance.id,
            metricKey: metric.metricKey,
            ...change.payload,
          }
        );

        // Evaluate on_breach escalation rules
        if (metric.goalId) {
          const rules = await repos.policyRepo.findEscalationRulesByGoalId(metric.goalId);
          const context: EscalationContext = {
            tenantId: instance.tenantId,
            ticketId: instance.ticketId,
            instanceId: instance.id!,
            metricInstanceId: metric.id!,
            metricKey: metric.metricKey,
            targetMinutes: metric.targetMinutes,
            elapsedSeconds: metric.elapsedBusinessSeconds,
            remainingSeconds: 0,
            dueAt: metric.dueAt,
          };

          const triggerable = escalationEngine.evaluateRules(metric, rules, calendar, now);
          if (triggerable.length > 0) {
            const results = await escalationEngine.executeEscalations(triggerable, context);

            for (const r of results) {
              await repos.eventRepo.append({
                tenantId: instance.tenantId,
                instanceId: instance.id!,
                metricInstanceId: metric.id,
                ticketId: instance.ticketId,
                eventType: SlaEventType.ESCALATION_TRIGGERED,
                eventSource: SlaEventSource.SCHEDULER,
                payload: { ruleId: r.ruleId, actionType: r.actionType, success: r.success },
                occurredAt: now,
              });
            }
          }
        }

        logger.info('[SLA:Scheduler] Metric breached', {
          ticketId: instance.ticketId,
          metricKey: metric.metricKey,
        });
      } catch (err) {
        logger.error('[SLA:Scheduler] Error processing breached metric', {
          metricId: metric.id,
          error: err,
        });
      }
    }

    // ── Step 2: Near-breach warning ──────────────────────────
    const nearBreachMetrics = await repos.metricRepo.findRunningNearBreach(
      WARNING_THRESHOLD_SECONDS,
      500
    );

    for (const metric of nearBreachMetrics) {
      // Skip already-breached (they were handled above)
      if (metric.status !== SlaMetricStatus.RUNNING) continue;
      if (metric.dueAt && metric.dueAt <= new Date()) continue;

      try {
        if (!metric.goalId) continue;

        const calendar = metric.calendarId
          ? await repos.calendarRepo.resolve(metric.calendarId)
          : null;
        if (!calendar) continue;

        const instance = await repos.instanceRepo.findById(metric.instanceId);
        if (!instance) continue;

        const rules = await repos.policyRepo.findEscalationRulesByGoalId(metric.goalId);
        const now = new Date();

        const context: EscalationContext = {
          tenantId: instance.tenantId,
          ticketId: instance.ticketId,
          instanceId: instance.id!,
          metricInstanceId: metric.id!,
          metricKey: metric.metricKey,
          targetMinutes: metric.targetMinutes,
          elapsedSeconds: metric.elapsedBusinessSeconds,
          remainingSeconds: slaClockEngine.getRemainingSeconds(metric, calendar, now),
          dueAt: metric.dueAt,
        };

        const triggerable = escalationEngine.evaluateRules(metric, rules, calendar, now);
        if (triggerable.length > 0) {
          await escalationEngine.executeEscalations(triggerable, context);
        }
      } catch (err) {
        logger.error('[SLA:Scheduler] Error processing near-breach metric', {
          metricId: metric.id,
          error: err,
        });
      }
    }
  } catch (err) {
    logger.error('[SLA:Scheduler] Tick failed', { error: err });
  }
}

/**
 * Start the SLA scheduler job.
 */
export function startSlaSchedulerJob(intervalMs: number = DEFAULT_INTERVAL_MS): void {
  if (intervalHandle) {
    logger.warn('[SLA:Scheduler] Already running, skipping start');
    return;
  }

  logger.info(`[SLA:Scheduler] Starting (interval=${intervalMs}ms)`);
  intervalHandle = setInterval(tick, intervalMs);
}

/**
 * Stop the SLA scheduler job.
 */
export function stopSlaSchedulerJob(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    logger.info('[SLA:Scheduler] Stopped');
  }
}
