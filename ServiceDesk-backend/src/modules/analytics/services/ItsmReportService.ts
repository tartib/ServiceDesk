/**
 * ITSM Report Service
 *
 * Aggregates ITSM KPIs into a unified analytics summary for the reports page.
 * Delegates to the existing ITSMDashboardService for raw KPIs.
 */

import itsmDashboardService, {
  IncidentKPIs,
  ProblemKPIs,
  ChangeKPIs,
  SLAComplianceData,
  TrendPoint,
} from '../../../core/services/ITSMDashboardService';
import logger from '../../../utils/logger';

export interface ItsmAnalyticsSummary {
  incidents: {
    total_open: number;
    total_in_progress: number;
    total_resolved_today: number;
    total_major_open: number;
    breached_sla: number;
    mttr_hours: number;
    by_priority: Record<string, number>;
  };
  problems: {
    total_open: number;
    total_in_rca: number;
    total_known_errors: number;
    total_resolved_this_month: number;
    avg_age_days: number;
    resolution_rate_percent: number;
  };
  changes: {
    total_pending_approval: number;
    total_scheduled: number;
    total_implemented_this_month: number;
    total_failed_this_month: number;
    success_rate_percent: number;
    emergency_changes_this_month: number;
  };
  sla: {
    compliance_percent: number;
    total_measured: number;
    total_breached: number;
    avg_response_minutes: number;
    avg_resolution_minutes: number;
  };
  generated_at: string;
}

class ItsmReportService {
  /**
   * Unified ITSM analytics summary combining incidents, problems, changes, and SLA.
   */
  async getSummary(siteId?: string): Promise<ItsmAnalyticsSummary> {
    logger.debug('Generating ITSM analytics summary', { siteId });

    const [incidents, problems, changes, slaCompliance] = await Promise.all([
      itsmDashboardService.getIncidentKPIs(siteId),
      itsmDashboardService.getProblemKPIs(siteId),
      itsmDashboardService.getChangeKPIs(siteId),
      itsmDashboardService.getSLACompliance(30, siteId),
    ]);

    // Compute SLA aggregate from 30-day window
    const slaTotals = slaCompliance.reduce(
      (acc, day) => {
        acc.total += day.total_incidents;
        acc.breached += day.breached;
        return acc;
      },
      { total: 0, breached: 0 }
    );
    const slaCompliancePercent =
      slaTotals.total > 0
        ? Math.round(((slaTotals.total - slaTotals.breached) / slaTotals.total) * 100)
        : 100;

    // Problem resolution rate
    const totalProblems = problems.total_open + problems.total_resolved_this_month;
    const problemResolutionRate =
      totalProblems > 0
        ? Math.round((problems.total_resolved_this_month / totalProblems) * 100)
        : 0;

    return {
      incidents: {
        total_open: incidents.total_open,
        total_in_progress: incidents.total_in_progress,
        total_resolved_today: incidents.total_resolved_today,
        total_major_open: incidents.total_major_open,
        breached_sla: incidents.breached_sla,
        mttr_hours: incidents.avg_resolution_hours,
        by_priority: incidents.by_priority,
      },
      problems: {
        total_open: problems.total_open,
        total_in_rca: problems.total_in_rca,
        total_known_errors: problems.total_known_errors,
        total_resolved_this_month: problems.total_resolved_this_month,
        avg_age_days: problems.avg_age_days,
        resolution_rate_percent: problemResolutionRate,
      },
      changes: {
        total_pending_approval: changes.total_pending_approval,
        total_scheduled: changes.total_scheduled,
        total_implemented_this_month: changes.total_implemented_this_month,
        total_failed_this_month: changes.total_failed_this_month,
        success_rate_percent: changes.success_rate_percent,
        emergency_changes_this_month: changes.emergency_changes_this_month,
      },
      sla: {
        compliance_percent: slaCompliancePercent,
        total_measured: slaTotals.total,
        total_breached: slaTotals.breached,
        avg_response_minutes: 0, // Available from SLA module if needed
        avg_resolution_minutes: 0,
      },
      generated_at: new Date().toISOString(),
    };
  }

  /**
   * Incident volume trend for the last N days.
   */
  async getIncidentTrend(days: number = 14, siteId?: string): Promise<TrendPoint[]> {
    return itsmDashboardService.getIncidentTrend(days, siteId);
  }

  /**
   * SLA compliance trend for the last N days.
   */
  async getSlaComplianceTrend(days: number = 30, siteId?: string): Promise<SLAComplianceData[]> {
    return itsmDashboardService.getSLACompliance(days, siteId);
  }
}

export default new ItsmReportService();
