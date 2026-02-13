import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

// Analytics Types
export interface AnalyticsMetric {
  count?: number;
  percent?: number;
  hours?: number;
  changePercent: number;
  changeLabel: string;
}

export interface DashboardAnalytics {
  totalTasks: AnalyticsMetric;
  completionRate: AnalyticsMetric;
  avgPrepTime: AnalyticsMetric;
  onTimeTasks: AnalyticsMetric;
}

interface AnalyticsResponse {
  success: boolean;
  message: string;
  data: {
    analytics: DashboardAnalytics;
  };
}

// Report Types
interface DailyReportResponse {
  success: boolean;
  message: string;
  data: {
    report: {
      date: string;
      totalTasks: number;
      completedTasks: number;
      pendingTasks: number;
      overdueTasks: number;
      completionRate: number;
      avgPrepTime: number;
      tasksByCategory: Record<string, number>;
      tasksByUser: Array<{ userId: string; userName: string; count: number }>;
    };
  };
}

interface WeeklyReportResponse {
  success: boolean;
  message: string;
  data: {
    report: {
      weekStart: string;
      weekEnd: string;
      totalTasks: number;
      completedTasks: number;
      completionRate: number;
      avgPrepTime: number;
      dailyBreakdown: Array<{ date: string; completed: number; total: number }>;
    };
  };
}

interface MonthlyReportResponse {
  success: boolean;
  message: string;
  data: {
    report: {
      month: number;
      year: number;
      totalTasks: number;
      completedTasks: number;
      completionRate: number;
      avgPrepTime: number;
      weeklyBreakdown: Array<{ week: number; completed: number; total: number }>;
    };
  };
}

// Dashboard Analytics Hook
export const useDashboardAnalytics = () => {
  return useQuery({
    queryKey: ['reports', 'analytics'],
    queryFn: async () => {
      const response = await api.get('/reports/analytics');
      const apiResponse = response as unknown as AnalyticsResponse;
      console.log('🔍 Analytics API Response:', apiResponse);
      return apiResponse.data?.analytics;
    },
  });
};

// Daily Report Hook
export const useDailyReport = (date?: string) => {
  return useQuery({
    queryKey: ['reports', 'daily', date],
    queryFn: async () => {
      const url = date ? `/reports/daily?date=${date}` : '/reports/daily';
      const response = await api.get(url);
      const apiResponse = response as unknown as DailyReportResponse;
      console.log('🔍 Daily Report API Response:', apiResponse);
      return apiResponse.data?.report;
    },
  });
};

// Weekly Report Hook
export const useWeeklyReport = (weekStart?: string) => {
  return useQuery({
    queryKey: ['reports', 'weekly', weekStart],
    queryFn: async () => {
      const url = weekStart ? `/reports/weekly?weekStart=${weekStart}` : '/reports/weekly';
      const response = await api.get(url);
      const apiResponse = response as unknown as WeeklyReportResponse;
      console.log('🔍 Weekly Report API Response:', apiResponse);
      return apiResponse.data?.report;
    },
  });
};

// Monthly Report Hook
export const useMonthlyReport = (month?: number, year?: number) => {
  return useQuery({
    queryKey: ['reports', 'monthly', month, year],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (month !== undefined) params.append('month', month.toString());
      if (year !== undefined) params.append('year', year.toString());
      
      const url = `/reports/monthly${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(url);
      const apiResponse = response as unknown as MonthlyReportResponse;
      console.log('🔍 Monthly Report API Response:', apiResponse);
      return apiResponse.data?.report;
    },
  });
};
