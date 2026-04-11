/**
 * Ticket SLA Controller
 *
 * Provides the read-only SLA view for a specific ticket,
 * including policy, all metric instances with live remaining time.
 */

import { Request, Response } from 'express';
import SlaInstance from '../models/SlaInstance';
import SlaPolicy from '../models/SlaPolicy';
import SlaMetricInstance from '../models/SlaMetricInstance';
import SlaEvent from '../models/SlaEvent';
import { SlaMetricStatus } from '../domain';
import asyncHandler from '../../../utils/asyncHandler';
import { sendSuccess, sendError } from '../../../utils/ApiResponse';

function getTenant(req: Request): string | null {
  return req.user?.organizationId || req.headers['x-organization-id'] as string || null;
}

export const getTicketSla = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = getTenant(req);
  if (!tenantId) return void sendError(req, res, 400, 'Missing organization context');

  const { ticketId } = req.params;
  const instance = await SlaInstance.findOne({ tenantId, ticketId });
  if (!instance) {
    return void sendError(req, res, 404, 'No SLA instance found for this ticket');
  }

  const policy = await SlaPolicy.findById(instance.policyId);
  if (!policy) {
    return void sendError(req, res, 404, 'SLA policy not found');
  }

  const metrics = await SlaMetricInstance.find({ instanceId: instance._id.toString() });

  const metricViews = metrics.map((m) => ({
    metricKey: m.metricKey,
    status: m.status,
    targetMinutes: m.targetMinutes,
    startedAt: m.startedAt?.toISOString?.(),
    stoppedAt: m.stoppedAt?.toISOString?.(),
    dueAt: m.dueAt?.toISOString?.(),
    breachedAt: m.breachedAt?.toISOString?.(),
    elapsedBusinessSeconds: m.elapsedBusinessSeconds,
    remainingBusinessSeconds: m.remainingBusinessSeconds ?? 0,
    breached: m.status === SlaMetricStatus.BREACHED,
    paused: m.status === SlaMetricStatus.PAUSED,
  }));

  sendSuccess(req, res, {
    ticketId,
    ticketType: instance.ticketType,
    policy: {
      id: policy._id.toString(),
      code: policy.code,
      name: policy.name,
      nameAr: policy.nameAr,
    },
    instanceId: instance._id.toString(),
    instanceStatus: instance.status,
    metrics: metricViews,
  });
});

export const getTicketSlaEvents = asyncHandler(async (req: Request, res: Response) => {
  const { ticketId } = req.params;
  const events = await SlaEvent.find({ ticketId }).sort({ createdAt: -1 }).limit(200);
  sendSuccess(req, res, events);
});
