/**
 * Ticket SLA Controller
 *
 * Provides the read-only SLA view for a specific ticket,
 * including policy, all metric instances with live remaining time.
 */

import { Request, Response } from 'express';
import { getSlaRepos } from '../infrastructure/repositories/SlaRepositoryFactory';
import { slaClockEngine } from '../services/SlaClockEngine';
import {
  ITicketSlaView,
  ITicketSlaMetricView,
  SlaMetricStatus,
} from '../domain';
import logger from '../../../utils/logger';

const asyncHandler = (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response) => fn(req, res).catch((err) => {
    logger.error('[SLA:TicketSlaController] Unhandled error', { error: err });
    res.status(500).json({ success: false, message: 'Internal server error' });
  });

export const getTicketSla = asyncHandler(async (req: Request, res: Response) => {
  const repos = getSlaRepos();
  const tenantId = (req as any).user?.organizationId || req.headers['x-organization-id'] as string;
  if (!tenantId) return void res.status(400).json({ success: false, message: 'Missing organization context' });

  const { ticketId } = req.params;
  const instance = await repos.instanceRepo.findByTicket(tenantId, ticketId);
  if (!instance) {
    return void res.status(404).json({ success: false, message: 'No SLA instance found for this ticket' });
  }

  const policy = await repos.policyRepo.findById(instance.policyId);
  if (!policy) {
    return void res.status(404).json({ success: false, message: 'SLA policy not found' });
  }

  const metrics = await repos.metricRepo.findByInstanceId(instance.id!);
  const now = new Date();

  const metricViews: ITicketSlaMetricView[] = [];
  for (const m of metrics) {
    let remainingSeconds = 0;
    if (m.status === SlaMetricStatus.RUNNING || m.status === SlaMetricStatus.PAUSED) {
      const calendar = m.calendarId ? await repos.calendarRepo.resolve(m.calendarId) : null;
      if (calendar) {
        remainingSeconds = slaClockEngine.getRemainingSeconds(m, calendar, now);
      } else {
        remainingSeconds = m.remainingBusinessSeconds ?? 0;
      }
    }

    metricViews.push({
      metricKey: m.metricKey as any,
      status: m.status as SlaMetricStatus,
      targetMinutes: m.targetMinutes,
      startedAt: m.startedAt?.toISOString?.() ?? String(m.startedAt),
      stoppedAt: m.stoppedAt?.toISOString?.() ?? undefined,
      dueAt: m.dueAt?.toISOString?.() ?? undefined,
      breachedAt: m.breachedAt?.toISOString?.() ?? undefined,
      elapsedBusinessSeconds: m.elapsedBusinessSeconds,
      remainingBusinessSeconds: remainingSeconds,
      breached: m.status === SlaMetricStatus.BREACHED,
      paused: m.status === SlaMetricStatus.PAUSED,
    });
  }

  const view: ITicketSlaView = {
    ticketId,
    ticketType: instance.ticketType as any,
    policy: {
      id: policy.id!,
      code: policy.code,
      name: policy.name,
      nameAr: policy.nameAr,
    },
    instanceId: instance.id!,
    instanceStatus: instance.status as any,
    metrics: metricViews,
  };

  res.json({ success: true, data: view });
});

export const getTicketSlaEvents = asyncHandler(async (req: Request, res: Response) => {
  const repos = getSlaRepos();
  const { ticketId } = req.params;
  const events = await repos.eventRepo.findByTicket(ticketId, 200);
  res.json({ success: true, data: events });
});
