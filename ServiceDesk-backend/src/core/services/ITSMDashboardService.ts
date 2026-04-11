import Incident from '../entities/Incident';
import Problem from '../entities/Problem';
import Change from '../entities/Change';
import PostIncidentReview from '../entities/PostIncidentReview';
import { IncidentStatus, ProblemStatus, ChangeStatus } from '../types/itsm.types';

export interface IncidentKPIs {
  total_open: number;
  total_in_progress: number;
  total_resolved_today: number;
  total_closed_today: number;
  total_major_open: number;
  breached_sla: number;
  avg_resolution_hours: number;
  by_priority: Record<string, number>;
  by_category: { category_id: string; count: number }[];
}

export interface ProblemKPIs {
  total_open: number;
  total_in_rca: number;
  total_known_errors: number;
  total_resolved_this_month: number;
  avg_age_days: number;
}

export interface ChangeKPIs {
  total_pending_approval: number;
  total_scheduled: number;
  total_implemented_this_month: number;
  total_failed_this_month: number;
  success_rate_percent: number;
  emergency_changes_this_month: number;
}

export interface SLAComplianceData {
  period: string;
  total_incidents: number;
  breached: number;
  compliant: number;
  compliance_rate: number;
}

export interface TrendPoint {
  date: string;
  created: number;
  resolved: number;
  breached: number;
}

export class ITSMDashboardService {
  /**
   * Get Incident KPIs for the dashboard
   */
  async getIncidentKPIs(siteId?: string): Promise<IncidentKPIs> {
    const baseQuery: any = {};
    if (siteId) baseQuery.site_id = siteId;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      totalOpen,
      totalInProgress,
      totalResolvedToday,
      totalClosedToday,
      majorOpen,
      byPriority,
      byCategory,
    ] = await Promise.all([
      Incident.countDocuments({ ...baseQuery, status: IncidentStatus.OPEN }),
      Incident.countDocuments({ ...baseQuery, status: IncidentStatus.IN_PROGRESS }),
      Incident.countDocuments({
        ...baseQuery,
        status: IncidentStatus.RESOLVED,
        updated_at: { $gte: todayStart, $lte: todayEnd },
      }),
      Incident.countDocuments({
        ...baseQuery,
        status: IncidentStatus.CLOSED,
        closed_at: { $gte: todayStart, $lte: todayEnd },
      }),
      Incident.countDocuments({
        ...baseQuery,
        is_major: true,
        status: { $nin: [IncidentStatus.RESOLVED, IncidentStatus.CLOSED] },
      }),
      Incident.aggregate([
        { $match: { ...baseQuery, status: { $nin: [IncidentStatus.CLOSED] } } },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      Incident.aggregate([
        { $match: { ...baseQuery, status: { $nin: [IncidentStatus.CLOSED] } } },
        { $group: { _id: '$category_id', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    // Breached SLA: sla_due_at < now and not closed/resolved
    const now = new Date();
    const breachedSLA = await Incident.countDocuments({
      ...baseQuery,
      'sla.due_at': { $lt: now },
      status: { $nin: [IncidentStatus.RESOLVED, IncidentStatus.CLOSED] },
    });

    // Avg resolution time in hours
    const avgResResult = await Incident.aggregate([
      {
        $match: {
          ...baseQuery,
          status: IncidentStatus.RESOLVED,
          closed_at: { $exists: true },
        },
      },
      {
        $project: {
          resolution_ms: { $subtract: ['$closed_at', '$created_at'] },
        },
      },
      { $group: { _id: null, avg_ms: { $avg: '$resolution_ms' } } },
    ]);

    const avgResHours =
      avgResResult.length > 0 ? Math.round(avgResResult[0].avg_ms / (1000 * 60 * 60)) : 0;

    const byPriorityMap: Record<string, number> = {};
    for (const r of byPriority) {
      byPriorityMap[r._id] = r.count;
    }

    return {
      total_open: totalOpen,
      total_in_progress: totalInProgress,
      total_resolved_today: totalResolvedToday,
      total_closed_today: totalClosedToday,
      total_major_open: majorOpen,
      breached_sla: breachedSLA,
      avg_resolution_hours: avgResHours,
      by_priority: byPriorityMap,
      by_category: byCategory.map((r: any) => ({ category_id: r._id, count: r.count })),
    };
  }

  /**
   * Get Problem KPIs
   */
  async getProblemKPIs(siteId?: string): Promise<ProblemKPIs> {
    const baseQuery: any = {};
    if (siteId) baseQuery.site_id = siteId;

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [totalOpen, totalInRca, totalKnownErrors, resolvedThisMonth] = await Promise.all([
      Problem.countDocuments({
        ...baseQuery,
        status: { $in: [ProblemStatus.LOGGED, ProblemStatus.RCA_IN_PROGRESS] },
      }),
      Problem.countDocuments({ ...baseQuery, status: ProblemStatus.RCA_IN_PROGRESS }),
      Problem.countDocuments({ ...baseQuery, status: ProblemStatus.KNOWN_ERROR }),
      Problem.countDocuments({
        ...baseQuery,
        status: ProblemStatus.RESOLVED,
        updated_at: { $gte: monthStart },
      }),
    ]);

    // Avg age of open problems in days
    const avgAgeResult = await Problem.aggregate([
      {
        $match: {
          ...baseQuery,
          status: { $nin: [ProblemStatus.RESOLVED, ProblemStatus.CLOSED] },
        },
      },
      {
        $project: {
          age_ms: { $subtract: [new Date(), '$created_at'] },
        },
      },
      { $group: { _id: null, avg_ms: { $avg: '$age_ms' } } },
    ]);

    const avgAgeDays =
      avgAgeResult.length > 0 ? Math.round(avgAgeResult[0].avg_ms / (1000 * 60 * 60 * 24)) : 0;

    return {
      total_open: totalOpen,
      total_in_rca: totalInRca,
      total_known_errors: totalKnownErrors,
      total_resolved_this_month: resolvedThisMonth,
      avg_age_days: avgAgeDays,
    };
  }

  /**
   * Get Change KPIs
   */
  async getChangeKPIs(siteId?: string): Promise<ChangeKPIs> {
    const baseQuery: any = {};
    if (siteId) baseQuery.site_id = siteId;

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [pendingApproval, scheduled, implementedThisMonth, failedThisMonth, emergencyThisMonth] =
      await Promise.all([
        Change.countDocuments({ ...baseQuery, status: ChangeStatus.SUBMITTED }),
        Change.countDocuments({ ...baseQuery, status: ChangeStatus.SCHEDULED }),
        Change.countDocuments({
          ...baseQuery,
          status: ChangeStatus.COMPLETED,
          updated_at: { $gte: monthStart },
        }),
        Change.countDocuments({
          ...baseQuery,
          status: ChangeStatus.FAILED,
          updated_at: { $gte: monthStart },
        }),
        Change.countDocuments({
          ...baseQuery,
          type: 'emergency',
          created_at: { $gte: monthStart },
        }),
      ]);

    const totalCompleted = implementedThisMonth + failedThisMonth;
    const successRate =
      totalCompleted > 0 ? Math.round((implementedThisMonth / totalCompleted) * 100) : 100;

    return {
      total_pending_approval: pendingApproval,
      total_scheduled: scheduled,
      total_implemented_this_month: implementedThisMonth,
      total_failed_this_month: failedThisMonth,
      success_rate_percent: successRate,
      emergency_changes_this_month: emergencyThisMonth,
    };
  }

  /**
   * Get SLA compliance for the last N days
   */
  async getSLACompliance(
    days: number = 30,
    siteId?: string
  ): Promise<SLAComplianceData[]> {
    const results: SLAComplianceData[] = [];
    const baseQuery: any = {};
    if (siteId) baseQuery.site_id = siteId;

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const [total, breached] = await Promise.all([
        Incident.countDocuments({
          ...baseQuery,
          created_at: { $gte: dayStart, $lte: dayEnd },
        }),
        Incident.countDocuments({
          ...baseQuery,
          created_at: { $gte: dayStart, $lte: dayEnd },
          'sla.due_at': { $exists: true, $lt: dayEnd },
          status: { $nin: [IncidentStatus.RESOLVED, IncidentStatus.CLOSED] },
        }),
      ]);

      const compliant = Math.max(0, total - breached);
      const complianceRate = total > 0 ? Math.round((compliant / total) * 100) : 100;

      results.push({
        period: dayStart.toISOString().split('T')[0],
        total_incidents: total,
        breached,
        compliant,
        compliance_rate: complianceRate,
      });
    }

    return results;
  }

  /**
   * Get incident volume trend for the last N days
   */
  async getIncidentTrend(days: number = 14, siteId?: string): Promise<TrendPoint[]> {
    const results: TrendPoint[] = [];
    const baseQuery: any = {};
    if (siteId) baseQuery.site_id = siteId;

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const [created, resolved, breached] = await Promise.all([
        Incident.countDocuments({
          ...baseQuery,
          created_at: { $gte: dayStart, $lte: dayEnd },
        }),
        Incident.countDocuments({
          ...baseQuery,
          status: { $in: [IncidentStatus.RESOLVED, IncidentStatus.CLOSED] },
          updated_at: { $gte: dayStart, $lte: dayEnd },
        }),
        Incident.countDocuments({
          ...baseQuery,
          'sla.due_at': { $gte: dayStart, $lte: dayEnd, $lt: dayEnd },
          status: { $nin: [IncidentStatus.RESOLVED, IncidentStatus.CLOSED] },
        }),
      ]);

      results.push({
        date: dayStart.toISOString().split('T')[0],
        created,
        resolved,
        breached,
      });
    }

    return results;
  }

  /**
   * Get full ITSM dashboard summary
   */
  async getDashboardSummary(siteId?: string) {
    const [incidents, problems, changes, slaCompliance, trend] = await Promise.all([
      this.getIncidentKPIs(siteId),
      this.getProblemKPIs(siteId),
      this.getChangeKPIs(siteId),
      this.getSLACompliance(7, siteId),
      this.getIncidentTrend(14, siteId),
    ]);

    return {
      incidents,
      problems,
      changes,
      sla_compliance_7d: slaCompliance,
      incident_trend_14d: trend,
      generated_at: new Date().toISOString(),
    };
  }
}

export default new ITSMDashboardService();
