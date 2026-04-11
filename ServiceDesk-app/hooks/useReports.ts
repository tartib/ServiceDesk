import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

// ── Query Key Factory ────────────────────────────────────────
export const reportKeys = {
  all: ['reports'] as const,
  itsm: () => [...reportKeys.all, 'itsm'] as const,
  itsmSummary: () => [...reportKeys.itsm(), 'summary'] as const,
  itsmIncidentTrend: (days?: number) => [...reportKeys.itsm(), 'incident-trend', days] as const,
  itsmSlaTrend: (days?: number) => [...reportKeys.itsm(), 'sla-trend', days] as const,
  pm: () => [...reportKeys.all, 'pm'] as const,
  pmSummary: () => [...reportKeys.pm(), 'summary'] as const,
  pmVelocityTrend: (limit?: number) => [...reportKeys.pm(), 'velocity-trend', limit] as const,
  legacy: () => [...reportKeys.all, 'legacy'] as const,
  analytics: () => [...reportKeys.legacy(), 'analytics'] as const,
  daily: (date?: string) => [...reportKeys.legacy(), 'daily', date] as const,
  weekly: (weekStart?: string) => [...reportKeys.legacy(), 'weekly', weekStart] as const,
  monthly: (month?: number, year?: number) => [...reportKeys.legacy(), 'monthly', month, year] as const,
};

// ── ITSM Analytics Types ─────────────────────────────────────
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

export interface TrendPoint {
  date: string;
  created: number;
  resolved: number;
  breached: number;
}

export interface SlaCompliancePoint {
  period: string;
  total_incidents: number;
  breached: number;
  compliant: number;
  compliance_rate: number;
}

// ── PM Analytics Types ───────────────────────────────────────
export interface PmAnalyticsSummary {
  projects: { total: number; active: number; archived: number };
  tasks: {
    total: number;
    todo: number;
    in_progress: number;
    done: number;
    overdue: number;
    completion_rate_percent: number;
  };
  sprints: { total: number; active: number; completed: number; avg_velocity: number };
  story_points: { total: number; completed: number; completion_percent: number };
  generated_at: string;
}

export interface VelocityPoint {
  sprint_name: string;
  committed: number;
  completed: number;
}

// ── Legacy Analytics Types ───────────────────────────────────
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

interface ApiWrapper<T> {
  success: boolean;
  message: string;
  data: T;
}

// ── ITSM Analytics Hooks ─────────────────────────────────────
export const useItsmAnalytics = () => {
  return useQuery({
    queryKey: reportKeys.itsmSummary(),
    queryFn: async () => {
      const response = await api.get('/analytics/itsm/summary');
      const wrapper = response as unknown as ApiWrapper<ItsmAnalyticsSummary>;
      return wrapper.data ?? (response as unknown as ItsmAnalyticsSummary);
    },
  });
};

export const useItsmIncidentTrend = (days: number = 14) => {
  return useQuery({
    queryKey: reportKeys.itsmIncidentTrend(days),
    queryFn: async () => {
      const response = await api.get(`/analytics/itsm/incident-trend?days=${days}`);
      const wrapper = response as unknown as ApiWrapper<{ trend: TrendPoint[] }>;
      return wrapper.data?.trend ?? [];
    },
  });
};

export const useItsmSlaTrend = (days: number = 30) => {
  return useQuery({
    queryKey: reportKeys.itsmSlaTrend(days),
    queryFn: async () => {
      const response = await api.get(`/analytics/itsm/sla-trend?days=${days}`);
      const wrapper = response as unknown as ApiWrapper<{ trend: SlaCompliancePoint[] }>;
      return wrapper.data?.trend ?? [];
    },
  });
};

// ── PM Analytics Hooks ───────────────────────────────────────
export const usePmAnalytics = () => {
  return useQuery({
    queryKey: reportKeys.pmSummary(),
    queryFn: async () => {
      const response = await api.get('/analytics/pm/summary');
      const wrapper = response as unknown as ApiWrapper<PmAnalyticsSummary>;
      return wrapper.data ?? (response as unknown as PmAnalyticsSummary);
    },
  });
};

export const usePmVelocityTrend = (limit: number = 10) => {
  return useQuery({
    queryKey: reportKeys.pmVelocityTrend(limit),
    queryFn: async () => {
      const response = await api.get(`/analytics/pm/velocity-trend?limit=${limit}`);
      const wrapper = response as unknown as ApiWrapper<{ trend: VelocityPoint[] }>;
      return wrapper.data?.trend ?? [];
    },
  });
};

// ── Legacy Report Hooks (kept for backward compatibility) ────
export const useDashboardAnalytics = () => {
  return useQuery({
    queryKey: reportKeys.analytics(),
    queryFn: async () => {
      const response = await api.get('/analytics/reports/dashboard');
      const apiResponse = response as unknown as ApiWrapper<{ analytics: DashboardAnalytics }>;
      return apiResponse.data?.analytics;
    },
  });
};

export const useDailyReport = (date?: string) => {
  return useQuery({
    queryKey: reportKeys.daily(date),
    queryFn: async () => {
      const url = date ? `/analytics/reports/daily?date=${date}` : '/analytics/reports/daily';
      const response = await api.get(url);
      const apiResponse = response as unknown as ApiWrapper<{ report: Record<string, unknown> }>;
      return apiResponse.data?.report;
    },
  });
};

export const useWeeklyReport = (weekStart?: string) => {
  return useQuery({
    queryKey: reportKeys.weekly(weekStart),
    queryFn: async () => {
      const url = weekStart ? `/analytics/reports/weekly?weekStart=${weekStart}` : '/analytics/reports/weekly';
      const response = await api.get(url);
      const apiResponse = response as unknown as ApiWrapper<{ report: Record<string, unknown> }>;
      return apiResponse.data?.report;
    },
  });
};

export const useMonthlyReport = (month?: number, year?: number) => {
  return useQuery({
    queryKey: reportKeys.monthly(month, year),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (month !== undefined) params.append('month', month.toString());
      if (year !== undefined) params.append('year', year.toString());
      const url = `/analytics/reports/monthly${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(url);
      const apiResponse = response as unknown as ApiWrapper<{ report: Record<string, unknown> }>;
      return apiResponse.data?.report;
    },
  });
};
