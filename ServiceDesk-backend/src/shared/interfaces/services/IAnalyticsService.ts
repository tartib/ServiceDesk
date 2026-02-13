/**
 * Analytics Service Interface
 */

import {
  ReportDTO,
  DailyReportDTO,
  WeeklyReportDTO,
  MonthlyReportDTO,
  KPIDTO,
  KPIDashboardDTO,
  PerformanceMetricsDTO,
  LeaderboardDTO,
  DashboardDTO,
  AnalyticsFilterDTO,
} from '../../dtos/analytics';

export interface IAnalyticsService {
  // Report generation
  generateDailyReport(date: Date, filter?: AnalyticsFilterDTO): Promise<DailyReportDTO>;
  generateWeeklyReport(startDate: Date, endDate: Date, filter?: AnalyticsFilterDTO): Promise<WeeklyReportDTO>;
  generateMonthlyReport(month: number, year: number, filter?: AnalyticsFilterDTO): Promise<MonthlyReportDTO>;
  getReport(reportId: string): Promise<ReportDTO>;
  listReports(filter: ReportFilterDTO): Promise<ReportDTO[]>;

  // KPI tracking
  getKPIs(period: 'daily' | 'weekly' | 'monthly'): Promise<KPIDTO[]>;
  getKPIDashboard(period: 'daily' | 'weekly' | 'monthly'): Promise<KPIDashboardDTO>;
  updateKPI(kpiId: string, target: number): Promise<KPIDTO>;

  // Performance metrics
  getUserMetrics(userId: string, period: 'daily' | 'weekly' | 'monthly'): Promise<PerformanceMetricsDTO>;
  getTeamMetrics(teamId: string, period: 'daily' | 'weekly' | 'monthly'): Promise<PerformanceMetricsDTO>;
  getDepartmentMetrics(departmentId: string, period: 'daily' | 'weekly' | 'monthly'): Promise<PerformanceMetricsDTO>;

  // Leaderboards
  getLeaderboard(period: 'daily' | 'weekly' | 'monthly', limit?: number): Promise<LeaderboardDTO>;
  getTeamLeaderboard(teamId: string, period: 'daily' | 'weekly' | 'monthly'): Promise<LeaderboardDTO>;

  // Dashboards
  getUserDashboard(userId: string, period: 'daily' | 'weekly' | 'monthly'): Promise<DashboardDTO>;
  getExecutiveDashboard(period: 'daily' | 'weekly' | 'monthly'): Promise<DashboardDTO>;

  // Export
  exportReport(reportId: string, format: 'pdf' | 'excel' | 'csv' | 'json'): Promise<string>;
}

export interface ReportFilterDTO {
  type?: 'daily' | 'weekly' | 'monthly' | 'custom';
  startDate?: Date;
  endDate?: Date;
  generatedBy?: string;
  page?: number;
  limit?: number;
}
