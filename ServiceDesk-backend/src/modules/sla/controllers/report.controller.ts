/**
 * SLA Report Controller
 *
 * Compliance, breach summary, and statistics endpoints.
 */

import { Request, Response } from 'express';
import { getSlaRepos } from '../infrastructure/repositories/SlaRepositoryFactory';
import { getPool } from '../../../shared/database/PostgresConnectionManager';
import logger from '../../../utils/logger';

const asyncHandler = (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response) => fn(req, res).catch((err) => {
    logger.error('[SLA:ReportController] Unhandled error', { error: err });
    res.status(500).json({ success: false, message: 'Internal server error' });
  });

export const getComplianceReport = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = (req as any).user?.organizationId || req.headers['x-organization-id'] as string;
  if (!tenantId) return void res.status(400).json({ success: false, message: 'Missing organization context' });

  const pool = getPool();
  const { from, to } = req.query;

  const dateFrom = from ? new Date(from as string) : new Date(Date.now() - 30 * 24 * 60 * 60_000);
  const dateTo = to ? new Date(to as string) : new Date();

  const result = await pool.query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE mi.status = 'met')::int AS met,
       COUNT(*) FILTER (WHERE mi.status = 'breached')::int AS breached,
       ROUND(AVG(mi.elapsed_business_seconds) FILTER (WHERE mi.metric_key = 'first_response'))::int AS avg_response_seconds,
       ROUND(AVG(mi.elapsed_business_seconds) FILTER (WHERE mi.metric_key = 'resolution'))::int AS avg_resolution_seconds
     FROM sla_metric_instances mi
     JOIN sla_instances si ON si.id = mi.instance_id
     WHERE si.tenant_id = $1
       AND mi.status IN ('met', 'breached')
       AND mi.stopped_at BETWEEN $2 AND $3`,
    [tenantId, dateFrom, dateTo]
  );

  const row = result.rows[0] || {};
  const total = row.total || 0;
  const met = row.met || 0;
  const breached = row.breached || 0;

  res.json({
    success: true,
    data: {
      period: `${dateFrom.toISOString().slice(0, 10)} - ${dateTo.toISOString().slice(0, 10)}`,
      total,
      met,
      breached,
      compliancePercent: total > 0 ? Math.round((met / total) * 10000) / 100 : 100,
      avgResponseMinutes: row.avg_response_seconds ? Math.round(row.avg_response_seconds / 60) : 0,
      avgResolutionMinutes: row.avg_resolution_seconds ? Math.round(row.avg_resolution_seconds / 60) : 0,
    },
  });
});

export const getBreachSummary = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = (req as any).user?.organizationId || req.headers['x-organization-id'] as string;
  if (!tenantId) return void res.status(400).json({ success: false, message: 'Missing organization context' });

  const pool = getPool();
  const { from, to } = req.query;
  const dateFrom = from ? new Date(from as string) : new Date(Date.now() - 30 * 24 * 60 * 60_000);
  const dateTo = to ? new Date(to as string) : new Date();

  const result = await pool.query(
    `SELECT
       mi.metric_key,
       COUNT(*)::int AS count
     FROM sla_metric_instances mi
     JOIN sla_instances si ON si.id = mi.instance_id
     WHERE si.tenant_id = $1
       AND mi.status = 'breached'
       AND mi.breached_at BETWEEN $2 AND $3
     GROUP BY mi.metric_key
     ORDER BY count DESC`,
    [tenantId, dateFrom, dateTo]
  );

  res.json({
    success: true,
    data: result.rows.map((r: any) => ({
      metricKey: r.metric_key,
      count: r.count,
    })),
  });
});

export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = (req as any).user?.organizationId || req.headers['x-organization-id'] as string;
  if (!tenantId) return void res.status(400).json({ success: false, message: 'Missing organization context' });

  const repos = getSlaRepos();
  const instanceCounts = await repos.instanceRepo.countByStatus(tenantId);

  const pool = getPool();
  const policyCount = await pool.query(
    `SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE is_active = TRUE)::int AS active
     FROM sla_policies WHERE tenant_id = $1`,
    [tenantId]
  );

  const calendarCount = await pool.query(
    `SELECT COUNT(*)::int AS total FROM sla_calendars WHERE tenant_id = $1`,
    [tenantId]
  );

  res.json({
    success: true,
    data: {
      policies: {
        total: policyCount.rows[0]?.total || 0,
        active: policyCount.rows[0]?.active || 0,
      },
      calendars: {
        total: calendarCount.rows[0]?.total || 0,
      },
      instances: instanceCounts,
    },
  });
});
