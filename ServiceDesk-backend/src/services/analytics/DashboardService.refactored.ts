import logger from '../../utils/logger';
import { DashboardKPIService } from './DashboardKPIService';
import { DashboardPerformanceService } from './DashboardPerformanceService';
import { DashboardAnalyticsService } from './DashboardAnalyticsService';
import { TaskKPIs } from './interfaces/IDashboardKPIService';
import { TeamPerformance } from './interfaces/IDashboardPerformanceService';
import { TaskDistribution, TimeAnalysis } from './interfaces/IDashboardAnalyticsService';

export interface DashboardData {
  kpis: TaskKPIs;
  teamPerformance: TeamPerformance;
  taskDistribution: TaskDistribution;
  timeAnalysis: TimeAnalysis;
  recentActivity: unknown[];
  criticalAlerts: unknown[];
  trends: {
    completionRateTrend: number;
    overdueRateTrend: number;
  };
}

/**
 * Dashboard Service (Orchestrator)
 * Coordinates all analytics services to provide comprehensive dashboard data
 */
export class DashboardService {
  private kpiService: DashboardKPIService;
  private performanceService: DashboardPerformanceService;
  private analyticsService: DashboardAnalyticsService;

  constructor(
    kpiService?: DashboardKPIService,
    performanceService?: DashboardPerformanceService,
    analyticsService?: DashboardAnalyticsService
  ) {
    this.kpiService = kpiService || new DashboardKPIService();
    this.performanceService = performanceService || new DashboardPerformanceService();
    this.analyticsService = analyticsService || new DashboardAnalyticsService();
  }

  async getDashboardData(dateFrom?: Date, dateTo?: Date): Promise<DashboardData> {
    try {
      const startDate = dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = dateTo || new Date();

      logger.info(`Dashboard data requested from ${startDate} to ${endDate}`);

      const [kpis, teamPerformance, taskDistribution, timeAnalysis, trends] = await Promise.all([
        this.getKPIs(startDate, endDate),
        this.getTeamPerformance(startDate, endDate),
        this.getTaskDistribution(startDate, endDate),
        this.getTimeAnalysis(startDate, endDate),
        this.getTrends(startDate, endDate),
      ]);

      const dashboardData: DashboardData = {
        kpis,
        teamPerformance,
        taskDistribution,
        timeAnalysis,
        recentActivity: [],
        criticalAlerts: [],
        trends,
      };

      logger.info('Dashboard data compiled successfully');
      return dashboardData;
    } catch (error) {
      logger.error('Error compiling dashboard data:', error);
      throw error;
    }
  }

  async getKPIs(dateFrom?: Date, dateTo?: Date): Promise<TaskKPIs> {
    try {
      logger.info('KPIs requested');
      return await this.kpiService.calculateKPIs(dateFrom, dateTo);
    } catch (error) {
      logger.error('Error fetching KPIs:', error);
      throw error;
    }
  }

  async getTeamPerformance(dateFrom?: Date, dateTo?: Date): Promise<TeamPerformance> {
    try {
      logger.info('Team performance requested');
      return await this.performanceService.getTeamPerformance(dateFrom, dateTo);
    } catch (error) {
      logger.error('Error fetching team performance:', error);
      throw error;
    }
  }

  async getTaskDistribution(dateFrom?: Date, dateTo?: Date): Promise<TaskDistribution> {
    try {
      logger.info('Task distribution requested');
      return await this.analyticsService.getTaskDistribution(dateFrom, dateTo);
    } catch (error) {
      logger.error('Error fetching task distribution:', error);
      throw error;
    }
  }

  async getTimeAnalysis(dateFrom?: Date, dateTo?: Date): Promise<TimeAnalysis> {
    try {
      logger.info('Time analysis requested');
      return await this.analyticsService.getTimeAnalysis(dateFrom, dateTo);
    } catch (error) {
      logger.error('Error fetching time analysis:', error);
      throw error;
    }
  }

  async getRecentActivity(limit?: number): Promise<unknown[]> {
    logger.info(`Recent activity requested (limit: ${limit})`);
    return [];
  }

  async getCriticalAlerts(): Promise<unknown[]> {
    logger.info('Critical alerts requested');
    return [];
  }

  async getTrends(dateFrom?: Date, dateTo?: Date): Promise<{ completionRateTrend: number; overdueRateTrend: number }> {
    try {
      logger.info('Trends requested');

      const [previousKpis, currentKpis] = await Promise.all([
        this.kpiService.calculateKPIs(
          dateFrom ? new Date(dateFrom.getTime() - 30 * 24 * 60 * 60 * 1000) : undefined,
          dateFrom ? new Date(dateFrom.getTime() - 1) : undefined
        ),
        this.kpiService.calculateKPIs(dateFrom, dateTo),
      ]);

      const completionRateTrend = currentKpis.completionRate - previousKpis.completionRate;
      const overdueRateTrend = currentKpis.overdueTasks - previousKpis.overdueTasks;

      return {
        completionRateTrend: Math.round(completionRateTrend * 100) / 100,
        overdueRateTrend,
      };
    } catch (error) {
      logger.error('Error calculating trends:', error);
      return {
        completionRateTrend: 0,
        overdueRateTrend: 0,
      };
    }
  }
}

export const dashboardService = new DashboardService();
