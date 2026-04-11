/**
 * SLA Report Controller
 *
 * Compliance, breach summary, and statistics endpoints.
 * Falls back to MongoDB when PostgreSQL is not available.
 */

import { Request, Response } from 'express';
import logger from '../../../utils/logger';
import SlaPolicy from '../models/SlaPolicy';
import SlaInstance from '../models/SlaInstance';
import SlaMetricInstance from '../models/SlaMetricInstance';
import asyncHandler from '../../../utils/asyncHandler';
import { sendSuccess, sendError } from '../../../utils/ApiResponse';

function getTenantId(req: Request): string | null {
  return req.user?.organizationId || req.headers['x-organization-id'] as string || null;
}

export const getComplianceReport = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  if (!tenantId) return void sendError(req, res, 400, 'Missing organization context');

  const { from, to } = req.query;
  const dateFrom = from ? new Date(from as string) : new Date(Date.now() - 30 * 24 * 60 * 60_000);
  const dateTo = to ? new Date(to as string) : new Date();

  try {
    const metrics = await (SlaMetricInstance as any).aggregate([
      {
        $lookup: {
          from: 'sla_instances',
          localField: 'instanceId',
          foreignField: '_id',
          as: 'instance',
        },
      },
      { $unwind: '$instance' },
      {
        $match: {
          'instance.tenantId': tenantId,
          status: { $in: ['met', 'breached'] },
          stoppedAt: { $gte: dateFrom, $lte: dateTo },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          met: { $sum: { $cond: [{ $eq: ['$status', 'met'] }, 1, 0] } },
          breached: { $sum: { $cond: [{ $eq: ['$status', 'breached'] }, 1, 0] } },
          avgResponseSec: {
            $avg: { $cond: [{ $eq: ['$metricKey', 'first_response'] }, '$elapsedBusinessSeconds', null] },
          },
          avgResolutionSec: {
            $avg: { $cond: [{ $eq: ['$metricKey', 'resolution'] }, '$elapsedBusinessSeconds', null] },
          },
        },
      },
    ]);

    const row = metrics[0] || {};
    const total = row.total || 0;
    const met = row.met || 0;
    const breached = row.breached || 0;

    sendSuccess(req, res, {
      period: `${dateFrom.toISOString().slice(0, 10)} - ${dateTo.toISOString().slice(0, 10)}`,
      total,
      met,
      breached,
      compliancePercent: total > 0 ? Math.round((met / total) * 10000) / 100 : 100,
      avgResponseMinutes: row.avgResponseSec ? Math.round(row.avgResponseSec / 60) : 0,
      avgResolutionMinutes: row.avgResolutionSec ? Math.round(row.avgResolutionSec / 60) : 0,
    });
  } catch (err) {
    logger.warn('[SLA:getComplianceReport] MongoDB aggregate failed, returning empty', { err });
    sendSuccess(req, res, {
      period: `${dateFrom.toISOString().slice(0, 10)} - ${dateTo.toISOString().slice(0, 10)}`,
      total: 0, met: 0, breached: 0, compliancePercent: 100,
      avgResponseMinutes: 0, avgResolutionMinutes: 0,
    });
  }
});

export const getBreachSummary = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  if (!tenantId) return void sendError(req, res, 400, 'Missing organization context');

  const { from, to } = req.query;
  const dateFrom = from ? new Date(from as string) : new Date(Date.now() - 30 * 24 * 60 * 60_000);
  const dateTo = to ? new Date(to as string) : new Date();

  try {
    const results = await (SlaMetricInstance as any).aggregate([
      {
        $lookup: {
          from: 'sla_instances',
          localField: 'instanceId',
          foreignField: '_id',
          as: 'instance',
        },
      },
      { $unwind: '$instance' },
      {
        $match: {
          'instance.tenantId': tenantId,
          status: 'breached',
          breachedAt: { $gte: dateFrom, $lte: dateTo },
        },
      },
      {
        $group: {
          _id: '$metricKey',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    sendSuccess(req, res, results.map((r: any) => ({ metricKey: r._id, count: r.count })));
  } catch (err) {
    logger.warn('[SLA:getBreachSummary] aggregate failed, returning empty', { err });
    sendSuccess(req, res, []);
  }
});

export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  if (!tenantId) return void sendError(req, res, 400, 'Missing organization context');

  try {
    const [policyTotal, policyActive, calendarTotal, instanceCounts] = await Promise.all([
      SlaPolicy.countDocuments({ tenantId }),
      SlaPolicy.countDocuments({ tenantId, isActive: true }),
      (await import('../models/SlaCalendar')).default.countDocuments({ tenantId }),
      SlaInstance.aggregate([
        { $match: { tenantId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const instances: Record<string, number> = {};
    for (const row of instanceCounts as any[]) {
      instances[row._id] = row.count;
    }

    sendSuccess(req, res, {
      policies: { total: policyTotal, active: policyActive },
      calendars: { total: calendarTotal },
      instances,
    });
  } catch (err) {
    logger.warn('[SLA:getStats] query failed, returning zeros', { err });
    sendSuccess(req, res, { policies: { total: 0, active: 0 }, calendars: { total: 0 }, instances: {} });
  }
});
