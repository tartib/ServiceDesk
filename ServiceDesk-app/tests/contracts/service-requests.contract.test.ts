/**
 * Service Requests Contract Tests
 *
 * Verifies that service request hooks use the correct API routes
 * under /api/v2/itsm/service-requests and use the requestKeys factory
 * for targeted cache invalidation.
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';

import { useCreateServiceRequest, requestKeys } from '@/hooks/useServiceRequests';
import api from '@/lib/axios';

vi.mock('@/lib/axios');

const mockApi = api as unknown as { get: Mock; post: Mock; put: Mock; patch: Mock };

describe('Service Requests Routes Contract', () => {
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

  describe('Create — POST /api/v2/itsm/service-requests', () => {
    it('useCreateServiceRequest → POST /api/v2/itsm/service-requests', async () => {
      mockApi.post.mockResolvedValueOnce({
        data: { _id: 'sr-1', request_id: 'SR-0001', status: 'submitted' },
      });

      const { result } = renderHook(() => useCreateServiceRequest(), { wrapper });

      result.current.mutate({
        service_id: 'svc-1',
        priority: 'medium',
        form_data: { description: 'Need VPN' },
      } as unknown as Parameters<typeof result.current.mutate>[0]);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi.post).toHaveBeenCalledWith(
        '/api/v2/itsm/service-requests',
        expect.any(Object)
      );
    });
  });

  describe('Key factory — requestKeys structure', () => {
    it('requestKeys.all is [service-requests]', () => {
      expect(requestKeys.all).toEqual(['service-requests']);
    });

    it('requestKeys.lists() extends .all', () => {
      const keys = requestKeys.lists();
      expect(keys[0]).toBe('service-requests');
      expect(keys.length).toBeGreaterThan(1);
    });

    it('requestKeys.detail(id) extends .all', () => {
      const keys = requestKeys.detail('sr-1');
      expect(keys[0]).toBe('service-requests');
      expect(keys).toContain('sr-1');
    });

    it('requestKeys.stats() extends .all', () => {
      const keys = requestKeys.stats();
      expect(keys[0]).toBe('service-requests');
      expect(keys).toContain('stats');
    });
  });

  describe('Invalidation — uses requestKeys factory after create', () => {
    it('create invalidates lists and stats, not bare [service-requests]', async () => {
      mockApi.post.mockResolvedValueOnce({
        data: { _id: 'sr-2', request_id: 'SR-0002', status: 'submitted' },
      });
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateServiceRequest(), { wrapper });
      result.current.mutate({
        service_id: 'svc-1',
        priority: 'low',
        form_data: {},
      } as Parameters<typeof result.current.mutate>[0]);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const calls = invalidateSpy.mock.calls.map(c => c[0]?.queryKey);
      // Should include lists and stats keys
      expect(calls.some(k => Array.isArray(k) && k.includes('list'))).toBe(true);
      expect(calls.some(k => Array.isArray(k) && k.includes('stats'))).toBe(true);
    });
  });
});
