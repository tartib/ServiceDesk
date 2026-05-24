/**
 * useExecutiveDashboard — Section 2, Batch 7
 *
 * Fetches aggregated analytics for the Executive Dashboard MVP.
 */

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

export interface DashboardSummary {
  totalOpen: number;
  totalCompleted: number;
  totalRecords: number;
  slaCompliance: number;
  slaBreached: number;
  avgResolutionHours: number;
  byStatus: Array<{ status: string; count: number }>;
  byWorkspace: Array<{ workspaceType: string; count: number }>;
}

export interface RecordByType {
  requestTypeId: string;
  name: string;
  nameAr: string;
  count: number;
}

export const dashboardKeys = {
  all: ['executive-dashboard'] as const,
  summary: () => [...dashboardKeys.all, 'summary'] as const,
  byType: () => [...dashboardKeys.all, 'by-type'] as const,
};

export function useDashboardSummary() {
  return useQuery({
    queryKey: dashboardKeys.summary(),
    queryFn: async (): Promise<DashboardSummary> => {
      const res = await api.get('/forms/analytics/summary');
      return (res as any)?.data ?? res;
    },
    staleTime: 30_000,
  });
}

export function useRecordsByType() {
  return useQuery({
    queryKey: dashboardKeys.byType(),
    queryFn: async (): Promise<RecordByType[]> => {
      const res = await api.get('/forms/analytics/records-by-type');
      return (res as any)?.data ?? res;
    },
    staleTime: 30_000,
  });
}
