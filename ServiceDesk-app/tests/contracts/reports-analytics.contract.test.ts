/**
 * Reports & Analytics Contract Tests
 *
 * Verifies that the new ITSM/PM analytics hooks and legacy report hooks
 * use the correct API routes and the reportKeys factory for query keys.
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';

import {
  reportKeys,
  useItsmAnalytics,
  useItsmIncidentTrend,
  usePmAnalytics,
  usePmVelocityTrend,
  useDashboardAnalytics,
} from '@/hooks/useReports';
import api from '@/lib/axios';

vi.mock('@/lib/axios');

const mockApi = api as unknown as { get: Mock; post: Mock };

describe('Reports & Analytics Routes Contract', () => {
  let queryClient: QueryClient;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let wrapper: any;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);
  });

  // ── reportKeys factory structure ─────────────────────────
  describe('reportKeys factory', () => {
    it('.all is [reports]', () => {
      expect(reportKeys.all).toEqual(['reports']);
    });

    it('.itsmSummary() nests under itsm', () => {
      const key = reportKeys.itsmSummary();
      expect(key[0]).toBe('reports');
      expect(key[1]).toBe('itsm');
      expect(key).toContain('summary');
    });

    it('.pmSummary() nests under pm', () => {
      const key = reportKeys.pmSummary();
      expect(key[0]).toBe('reports');
      expect(key[1]).toBe('pm');
      expect(key).toContain('summary');
    });

    it('.itsmIncidentTrend(14) includes days param', () => {
      const key = reportKeys.itsmIncidentTrend(14);
      expect(key).toContain(14);
    });

    it('.pmVelocityTrend(10) includes limit param', () => {
      const key = reportKeys.pmVelocityTrend(10);
      expect(key).toContain(10);
    });

    it('legacy keys nest under legacy', () => {
      const key = reportKeys.analytics();
      expect(key[0]).toBe('reports');
      expect(key).toContain('legacy');
    });
  });

  // ── ITSM Analytics routes ────────────────────────────────
  describe('ITSM Analytics — /analytics/itsm/*', () => {
    it('useItsmAnalytics → GET /analytics/itsm/summary', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: { incidents: {}, problems: {}, changes: {}, sla: {}, generated_at: '' },
      });

      const { result } = renderHook(() => useItsmAnalytics(), { wrapper });

      await waitFor(() => expect(result.current.isFetching).toBe(false));
      expect(mockApi.get).toHaveBeenCalledWith('/analytics/itsm/summary');
    });

    it('useItsmIncidentTrend → GET /analytics/itsm/incident-trend?days=14', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: { trend: [] },
      });

      const { result } = renderHook(() => useItsmIncidentTrend(14), { wrapper });

      await waitFor(() => expect(result.current.isFetching).toBe(false));
      expect(mockApi.get).toHaveBeenCalledWith('/analytics/itsm/incident-trend?days=14');
    });
  });

  // ── PM Analytics routes ──────────────────────────────────
  describe('PM Analytics — /analytics/pm/*', () => {
    it('usePmAnalytics → GET /analytics/pm/summary', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: { projects: {}, tasks: {}, sprints: {}, story_points: {}, generated_at: '' },
      });

      const { result } = renderHook(() => usePmAnalytics(), { wrapper });

      await waitFor(() => expect(result.current.isFetching).toBe(false));
      expect(mockApi.get).toHaveBeenCalledWith('/analytics/pm/summary');
    });

    it('usePmVelocityTrend → GET /analytics/pm/velocity-trend?limit=10', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: { trend: [] },
      });

      const { result } = renderHook(() => usePmVelocityTrend(10), { wrapper });

      await waitFor(() => expect(result.current.isFetching).toBe(false));
      expect(mockApi.get).toHaveBeenCalledWith('/analytics/pm/velocity-trend?limit=10');
    });
  });

  // ── Legacy report routes ─────────────────────────────────
  describe('Legacy Reports — /analytics/reports/*', () => {
    it('useDashboardAnalytics → GET /analytics/reports/dashboard', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: { analytics: { totalTasks: { count: 10, changePercent: 5, changeLabel: '+5' } } },
      });

      const { result } = renderHook(() => useDashboardAnalytics(), { wrapper });

      await waitFor(() => expect(result.current.isFetching).toBe(false));
      expect(mockApi.get).toHaveBeenCalledWith('/analytics/reports/dashboard');
    });
  });
});
