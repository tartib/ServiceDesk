/**
 * SLA Internal API Facade
 *
 * Implements ISlaApi for inter-module communication.
 * Other modules use this via the InternalApiRegistry to interact with SLA.
 */

import { ISlaApi } from '../../../shared/internal-api/types';
import { SlaOrchestrator } from '../services/SlaOrchestrator';
import { getSlaRepos } from '../infrastructure/repositories/SlaRepositoryFactory';
import { slaClockEngine } from '../services/SlaClockEngine';
import { SlaEntityType, SlaMetricStatus } from '../domain';

export class SlaApiImpl implements ISlaApi {
  readonly moduleName = 'sla';

  private _orchestrator: SlaOrchestrator | null = null;

  private getOrchestrator(): SlaOrchestrator {
    if (!this._orchestrator) {
      const repos = getSlaRepos();
      this._orchestrator = new SlaOrchestrator({
        policyRepo: {
          findActiveByEntityType: (t, e) => repos.policyRepo.findActiveByEntityType(t, e),
          findById: (id) => repos.policyRepo.findById(id),
        },
        goalRepo: {
          findByPolicyId: (id) => repos.policyRepo.findGoalsByPolicyId(id),
        },
        calendarRepo: {
          resolve: (id) => repos.calendarRepo.resolve(id),
          resolveDefault: (t) => repos.calendarRepo.resolveDefault(t),
        },
        instanceRepo: {
          create: (d) => repos.instanceRepo.create(d),
          findByTicket: (t, id) => repos.instanceRepo.findByTicket(t, id),
          update: (id, d) => repos.instanceRepo.update(id, d) as any,
        },
        metricRepo: {
          create: (d) => repos.metricRepo.create(d),
          findByInstanceId: (id) => repos.metricRepo.findByInstanceId(id),
          findByMetricKey: (iid, mk) => repos.metricRepo.findByMetricKey(iid, mk),
          update: (id, d) => repos.metricRepo.update(id, d) as any,
        },
        eventRepo: {
          append: (e) => repos.eventRepo.append(e),
        },
      });
    }
    return this._orchestrator;
  }

  async getTicketSla(tenantId: string, ticketId: string): Promise<any | null> {
    const repos = getSlaRepos();
    const instance = await repos.instanceRepo.findByTicket(tenantId, ticketId);
    if (!instance) return null;

    const policy = await repos.policyRepo.findById(instance.policyId);
    const metrics = await repos.metricRepo.findByInstanceId(instance.id!);
    const now = new Date();

    const metricViews = [];
    for (const m of metrics) {
      let remainingSeconds = 0;
      if (m.status === SlaMetricStatus.RUNNING || m.status === SlaMetricStatus.PAUSED) {
        const calendar = m.calendarId ? await repos.calendarRepo.resolve(m.calendarId) : null;
        if (calendar) {
          remainingSeconds = slaClockEngine.getRemainingSeconds(m, calendar, now);
        }
      }
      metricViews.push({
        metricKey: m.metricKey,
        status: m.status,
        targetMinutes: m.targetMinutes,
        dueAt: m.dueAt,
        breachedAt: m.breachedAt,
        remainingBusinessSeconds: remainingSeconds,
        breached: m.status === SlaMetricStatus.BREACHED,
      });
    }

    return {
      ticketId,
      policy: policy ? { id: policy.id, code: policy.code, name: policy.name } : null,
      instanceId: instance.id,
      instanceStatus: instance.status,
      metrics: metricViews,
    };
  }

  async onTicketCreated(
    tenantId: string,
    ticketId: string,
    ticketType: string,
    attributes: Record<string, any>
  ): Promise<any> {
    return this.getOrchestrator().onTicketCreated(
      tenantId,
      ticketId,
      ticketType as SlaEntityType,
      { ...attributes, entityType: ticketType }
    );
  }

  async onTicketStatusChanged(tenantId: string, ticketId: string, newStatus: string): Promise<void> {
    return this.getOrchestrator().onTicketStatusChanged(tenantId, ticketId, newStatus);
  }

  async onTicketResolved(tenantId: string, ticketId: string): Promise<void> {
    return this.getOrchestrator().onTicketResolved(tenantId, ticketId);
  }

  async onTicketCancelled(tenantId: string, ticketId: string): Promise<void> {
    return this.getOrchestrator().onTicketCancelled(tenantId, ticketId);
  }
}
