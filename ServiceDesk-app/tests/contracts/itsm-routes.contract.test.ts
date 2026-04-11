/**
 * ITSM Routes Contract Tests
 *
 * Verifies that incident, problem, and change hooks use the correct
 * API routes and narrowed query key invalidation patterns.
 *
 * Key contract decisions:
 * - All ITSM routes are prefixed with /api/v2/itsm/
 * - Mutations use setQueryData for the mutated entity
 * - List invalidations use key factory .lists(), never bare collection keys
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';

import { useCreateIncident } from '@/hooks/useIncidents';
import { useCreateProblem } from '@/hooks/useProblems';
import { useCreateChange } from '@/hooks/useChanges';
import api from '@/lib/axios';

vi.mock('@/lib/axios');

const mockApi = api as unknown as { get: Mock; post: Mock; put: Mock; patch: Mock };

describe('ITSM Routes Contract', () => {
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

  describe('Incident routes — /api/v2/itsm/incidents', () => {
    it('useCreateIncident → POST /api/v2/itsm/incidents', async () => {
      mockApi.post.mockResolvedValueOnce({
        data: { incident: { _id: 'inc-1', title: 'Test' } },
      });

      const { result } = renderHook(() => useCreateIncident(), { wrapper });

      result.current.mutate({
        title: 'Test Incident',
        description: 'desc',
        priority: 'high',
        category_id: 'cat-1',
      } as unknown as Parameters<typeof result.current.mutate>[0]);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi.post).toHaveBeenCalledWith(
        '/api/v2/itsm/incidents',
        expect.any(Object)
      );
    });
  });

  describe('Problem routes — /api/v2/itsm/problems', () => {
    it('useCreateProblem → POST /api/v2/itsm/problems', async () => {
      mockApi.post.mockResolvedValueOnce({
        data: { problem: { _id: 'prob-1', title: 'Test' } },
      });

      const { result } = renderHook(() => useCreateProblem(), { wrapper });

      result.current.mutate({
        title: 'Test Problem',
        description: 'desc',
        priority: 'high',
        category_id: 'cat-1',
      } as Parameters<typeof result.current.mutate>[0]);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi.post).toHaveBeenCalledWith(
        '/api/v2/itsm/problems',
        expect.any(Object)
      );
    });
  });

  describe('Change routes — /api/v2/itsm/changes', () => {
    it('useCreateChange → POST /api/v2/itsm/changes', async () => {
      mockApi.post.mockResolvedValueOnce({
        data: { change: { _id: 'chg-1', title: 'Test' } },
      });

      const { result } = renderHook(() => useCreateChange(), { wrapper });

      result.current.mutate({
        title: 'Test Change',
        description: 'desc',
        type: 'normal',
        priority: 'medium',
        category_id: 'cat-1',
      } as unknown as Parameters<typeof result.current.mutate>[0]);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi.post).toHaveBeenCalledWith(
        '/api/v2/itsm/changes',
        expect.any(Object)
      );
    });
  });

  describe('Key factory pattern — no bare collection keys in mutations', () => {
    it('invalidation spy shows targeted keys after incident creation', async () => {
      mockApi.post.mockResolvedValueOnce({
        data: { incident: { _id: 'inc-2', title: 'X' } },
      });
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateIncident(), { wrapper });
      result.current.mutate({
        title: 'X',
        description: 'd',
        priority: 'low',
        category_id: 'c',
      } as unknown as Parameters<typeof result.current.mutate>[0]);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Should use targeted keys like ['incidents', 'list'] not bare ['incidents']
      const calls = invalidateSpy.mock.calls.map(c => c[0]?.queryKey);
      for (const key of calls) {
        expect(Array.isArray(key)).toBe(true);
        if (key && key[0] === 'incidents') {
          expect(key.length).toBeGreaterThan(1);
        }
      }
    });
  });
});
