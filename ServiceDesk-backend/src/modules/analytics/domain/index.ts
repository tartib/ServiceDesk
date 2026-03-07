/**
 * Analytics Module — Domain Layer
 *
 * Service-only module. Domain interfaces define what analytics services expose.
 */

export interface IDashboardKPIService {
  getKPIs(period: string, orgId?: string): Promise<any>;
}

export interface IDashboardPerformanceService {
  getPerformance(userId: string, period: string): Promise<any>;
  getTeamPerformance(teamId: string, period: string): Promise<any>;
}

export interface IDashboardAnalyticsService {
  getAnalytics(filters?: Record<string, any>): Promise<any>;
  getTrends(period: string): Promise<any>;
}
