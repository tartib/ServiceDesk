/**
 * SLA Orchestrator
 *
 * High-level coordinator that wires together policy assignment, clock engine,
 * and repository operations. Consumed by event handlers and the scheduler.
 */

import {
  ISlaInstanceEntity,
  ISlaMetricInstanceEntity,
  ISlaCalendarResolved,
  ISlaGoalEntity,
  ISlaPolicyEntity,
  ISlaEventEntity,
  SlaInstanceStatus,
  SlaMetricStatus,
  SlaMetricKey,
  SlaEventType,
  SlaEventSource,
  SlaEntityType,
} from '../domain';
import { policyAssignmentEngine, TicketAttributes } from './PolicyAssignmentEngine';
import { slaClockEngine, ClockStateChange } from './SlaClockEngine';
import logger from '../../../utils/logger';

// ── Repository interfaces (dependency-injected) ──────────────

export interface ISlaRepositories {
  policyRepo: {
    findActiveByEntityType(tenantId: string, entityType: string): Promise<ISlaPolicyEntity[]>;
    findById(id: string): Promise<ISlaPolicyEntity | null>;
  };
  goalRepo: {
    findByPolicyId(policyId: string): Promise<ISlaGoalEntity[]>;
  };
  calendarRepo: {
    resolve(calendarId: string): Promise<ISlaCalendarResolved | null>;
    resolveDefault(tenantId: string): Promise<ISlaCalendarResolved | null>;
  };
  instanceRepo: {
    create(data: Partial<ISlaInstanceEntity>): Promise<ISlaInstanceEntity>;
    findByTicket(tenantId: string, ticketId: string): Promise<ISlaInstanceEntity | null>;
    update(id: string, data: Partial<ISlaInstanceEntity>): Promise<ISlaInstanceEntity | null>;
  };
  metricRepo: {
    create(data: Partial<ISlaMetricInstanceEntity>): Promise<ISlaMetricInstanceEntity>;
    findByInstanceId(instanceId: string): Promise<ISlaMetricInstanceEntity[]>;
    findByMetricKey(instanceId: string, metricKey: string): Promise<ISlaMetricInstanceEntity | null>;
    update(id: string, data: Partial<ISlaMetricInstanceEntity>): Promise<ISlaMetricInstanceEntity | null>;
  };
  eventRepo: {
    append(event: Partial<ISlaEventEntity>): Promise<ISlaEventEntity>;
  };
}

export interface SlaOrchestratorResult {
  instanceId?: string;
  policyCode?: string;
  metricsStarted?: string[];
  errors: string[];
}

export class SlaOrchestrator {
  constructor(private repos: ISlaRepositories) {}

  /**
   * Handle a new ticket. Match policy → create instance → start metric clocks.
   */
  async onTicketCreated(
    tenantId: string,
    ticketId: string,
    ticketType: SlaEntityType,
    attributes: TicketAttributes
  ): Promise<SlaOrchestratorResult> {
    const result: SlaOrchestratorResult = { metricsStarted: [], errors: [] };

    // Check if instance already exists (idempotency)
    const existing = await this.repos.instanceRepo.findByTicket(tenantId, ticketId);
    if (existing) {
      result.instanceId = existing.id;
      result.errors.push('SLA instance already exists for this ticket');
      return result;
    }

    // Find matching policy
    const policies = await this.repos.policyRepo.findActiveByEntityType(tenantId, ticketType);
    const policy = policyAssignmentEngine.matchPolicy(
      { ...attributes, entityType: ticketType },
      policies
    );

    if (!policy) {
      logger.info('[SLA:Orchestrator] No matching policy for ticket', { tenantId, ticketId, ticketType });
      return result;
    }

    result.policyCode = policy.code;
    const now = new Date();

    // Create SLA instance
    const instance = await this.repos.instanceRepo.create({
      tenantId,
      ticketId,
      ticketType,
      policyId: policy.id!,
      status: SlaInstanceStatus.ACTIVE,
      startedAt: now,
    });
    result.instanceId = instance.id;

    // Log policy match event
    await this.repos.eventRepo.append({
      tenantId,
      instanceId: instance.id!,
      ticketId,
      eventType: SlaEventType.POLICY_MATCHED,
      eventSource: SlaEventSource.SYSTEM,
      payload: { policyId: policy.id, policyCode: policy.code },
      occurredAt: now,
    });

    // Get goals for this policy
    const goals = await this.repos.goalRepo.findByPolicyId(policy.id!);

    // Start metric clocks for goals whose startEvent is 'ticket_created'
    for (const goal of goals) {
      if (goal.startEvent !== 'ticket_created') continue;

      try {
        const calendar = await this.resolveCalendar(goal.calendarId, tenantId);
        if (!calendar) {
          result.errors.push(`No calendar found for goal ${goal.metricKey}`);
          continue;
        }

        const metricEntity: ISlaMetricInstanceEntity = {
          instanceId: instance.id!,
          goalId: goal.id,
          metricKey: goal.metricKey as SlaMetricKey,
          status: SlaMetricStatus.RUNNING,
          targetMinutes: goal.targetMinutes,
          elapsedBusinessSeconds: 0,
          startedAt: now,
          lastStateChangeAt: now,
          calendarId: calendar.id,
        } as ISlaMetricInstanceEntity;

        const change = slaClockEngine.startMetric(metricEntity, calendar, now);
        const metric = await this.repos.metricRepo.create({
          ...metricEntity,
          ...change.metric,
        });

        await this.repos.eventRepo.append({
          tenantId,
          instanceId: instance.id!,
          metricInstanceId: metric.id,
          ticketId,
          eventType: change.eventType,
          eventSource: SlaEventSource.SYSTEM,
          payload: change.payload,
          occurredAt: now,
        });

        result.metricsStarted!.push(goal.metricKey);
      } catch (err) {
        logger.error('[SLA:Orchestrator] Failed to start metric', {
          metricKey: goal.metricKey,
          error: err,
        });
        result.errors.push(`Failed to start ${goal.metricKey}: ${(err as Error).message}`);
      }
    }

    return result;
  }

  /**
   * Handle ticket status change. Pause or resume metrics based on goal configuration.
   */
  async onTicketStatusChanged(
    tenantId: string,
    ticketId: string,
    newStatus: string
  ): Promise<void> {
    const instance = await this.repos.instanceRepo.findByTicket(tenantId, ticketId);
    if (!instance || instance.status !== SlaInstanceStatus.ACTIVE) return;

    const metrics = await this.repos.metricRepo.findByInstanceId(instance.id!);
    const now = new Date();

    for (const metric of metrics) {
      const goals = metric.goalId
        ? await this.repos.goalRepo.findByPolicyId(instance.policyId)
        : [];
      const goal = goals.find((g) => g.id === metric.goalId);
      if (!goal) continue;

      const calendar = await this.resolveCalendar(metric.calendarId, tenantId);
      if (!calendar) continue;

      // Check if should pause
      if (
        metric.status === SlaMetricStatus.RUNNING &&
        goal.pauseOnStatuses.includes(newStatus)
      ) {
        const change = slaClockEngine.pauseMetric(metric, calendar, now);
        if (change) {
          await this.applyChange(tenantId, ticketId, instance.id!, metric.id!, change, now);
        }
      }

      // Check if should resume
      if (
        metric.status === SlaMetricStatus.PAUSED &&
        goal.resumeOnStatuses.includes(newStatus)
      ) {
        const change = slaClockEngine.resumeMetric(metric, calendar, now);
        if (change) {
          await this.applyChange(tenantId, ticketId, instance.id!, metric.id!, change, now);
        }
      }
    }
  }

  /**
   * Handle first response on a ticket. Stops the first_response metric.
   */
  async onTicketFirstResponse(tenantId: string, ticketId: string): Promise<void> {
    await this.stopMetricByKey(tenantId, ticketId, SlaMetricKey.FIRST_RESPONSE);
  }

  /**
   * Handle ticket resolved. Stops the resolution metric.
   */
  async onTicketResolved(tenantId: string, ticketId: string): Promise<void> {
    await this.stopMetricByKey(tenantId, ticketId, SlaMetricKey.RESOLUTION);

    // Check if all metrics are stopped → mark instance completed
    const instance = await this.repos.instanceRepo.findByTicket(tenantId, ticketId);
    if (!instance) return;

    const metrics = await this.repos.metricRepo.findByInstanceId(instance.id!);
    const allStopped = metrics.every(
      (m) =>
        m.status === SlaMetricStatus.MET ||
        m.status === SlaMetricStatus.BREACHED ||
        m.status === SlaMetricStatus.CANCELLED
    );

    if (allStopped) {
      const anyBreached = metrics.some((m) => m.status === SlaMetricStatus.BREACHED);
      await this.repos.instanceRepo.update(instance.id!, {
        status: anyBreached ? SlaInstanceStatus.BREACHED : SlaInstanceStatus.COMPLETED,
        stoppedAt: new Date(),
      });
    }
  }

  /**
   * Handle ticket reopened. Resumes the resolution metric.
   */
  async onTicketReopened(tenantId: string, ticketId: string): Promise<void> {
    const instance = await this.repos.instanceRepo.findByTicket(tenantId, ticketId);
    if (!instance) return;

    const metric = await this.repos.metricRepo.findByMetricKey(instance.id!, SlaMetricKey.RESOLUTION);
    if (!metric || metric.status !== SlaMetricStatus.PAUSED) return;

    const calendar = await this.resolveCalendar(metric.calendarId, tenantId);
    if (!calendar) return;

    const now = new Date();
    const change = slaClockEngine.resumeMetric(metric, calendar, now);
    if (change) {
      await this.applyChange(tenantId, ticketId, instance.id!, metric.id!, change, now);
      // Re-activate instance
      await this.repos.instanceRepo.update(instance.id!, {
        status: SlaInstanceStatus.ACTIVE,
        stoppedAt: undefined,
      });
    }
  }

  /**
   * Handle ticket cancelled. Cancels all active metrics.
   */
  async onTicketCancelled(tenantId: string, ticketId: string): Promise<void> {
    const instance = await this.repos.instanceRepo.findByTicket(tenantId, ticketId);
    if (!instance || instance.status === SlaInstanceStatus.CANCELLED) return;

    const metrics = await this.repos.metricRepo.findByInstanceId(instance.id!);
    const now = new Date();

    for (const metric of metrics) {
      const change = slaClockEngine.cancelMetric(metric, now);
      if (change) {
        await this.applyChange(tenantId, ticketId, instance.id!, metric.id!, change, now);
      }
    }

    await this.repos.instanceRepo.update(instance.id!, {
      status: SlaInstanceStatus.CANCELLED,
      stoppedAt: now,
    });
  }

  // ── Private helpers ────────────────────────────────────────

  private async stopMetricByKey(
    tenantId: string,
    ticketId: string,
    metricKey: SlaMetricKey
  ): Promise<void> {
    const instance = await this.repos.instanceRepo.findByTicket(tenantId, ticketId);
    if (!instance) return;

    const metric = await this.repos.metricRepo.findByMetricKey(instance.id!, metricKey);
    if (!metric) return;
    if (metric.status !== SlaMetricStatus.RUNNING && metric.status !== SlaMetricStatus.PAUSED) return;

    const calendar = await this.resolveCalendar(metric.calendarId, tenantId);
    if (!calendar) return;

    const now = new Date();
    const change = slaClockEngine.stopMetric(metric, calendar, now);
    if (change) {
      await this.applyChange(tenantId, ticketId, instance.id!, metric.id!, change, now);
    }
  }

  private async applyChange(
    tenantId: string,
    ticketId: string,
    instanceId: string,
    metricId: string,
    change: ClockStateChange,
    now: Date
  ): Promise<void> {
    await this.repos.metricRepo.update(metricId, change.metric);
    await this.repos.eventRepo.append({
      tenantId,
      instanceId,
      metricInstanceId: metricId,
      ticketId,
      eventType: change.eventType,
      eventSource: SlaEventSource.SYSTEM,
      payload: change.payload,
      occurredAt: now,
    });
  }

  private async resolveCalendar(
    calendarId: string | undefined,
    tenantId: string
  ): Promise<ISlaCalendarResolved | null> {
    if (calendarId) {
      return this.repos.calendarRepo.resolve(calendarId);
    }
    return this.repos.calendarRepo.resolveDefault(tenantId);
  }
}
