/**
 * Service Catalog Contract Tests
 *
 * Verifies that service catalog hooks use the correct API routes
 * and invalidation patterns.
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';

import {
  useCreateServiceCatalogItem,
  useUpdateServiceCatalogItem,
  useDeleteServiceCatalogItem,
} from '@/hooks/useServiceCatalog';
import api from '@/lib/axios';

vi.mock('@/lib/axios');

const mockApi = api as unknown as { get: Mock; post: Mock; patch: Mock; delete: Mock };

describe('Service Catalog Routes Contract', () => {
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

  describe('Create — POST /service-catalog', () => {
    it('useCreateServiceCatalogItem → POST /service-catalog', async () => {
      mockApi.post.mockResolvedValueOnce({
        data: { service: { _id: 'svc-1', name: 'VPN Access' } },
      });

      const { result } = renderHook(() => useCreateServiceCatalogItem(), { wrapper });

      result.current.mutate({ name: 'VPN Access', category: 'Network' } as Parameters<typeof result.current.mutate>[0]);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi.post).toHaveBeenCalledWith(
        '/service-catalog',
        expect.any(Object)
      );
    });
  });

  describe('Update — PATCH /service-catalog/:id', () => {
    it('useUpdateServiceCatalogItem → PATCH /service-catalog/:id', async () => {
      mockApi.patch.mockResolvedValueOnce({
        data: { service: { _id: 'svc-1', name: 'Updated' } },
      });

      const { result } = renderHook(() => useUpdateServiceCatalogItem(), { wrapper });

      result.current.mutate({ id: 'svc-1', data: { name: 'Updated' } });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi.patch).toHaveBeenCalledWith(
        '/service-catalog/svc-1',
        expect.any(Object)
      );
    });
  });

  describe('Delete — DELETE /service-catalog/:id', () => {
    it('useDeleteServiceCatalogItem → DELETE /service-catalog/:id', async () => {
      mockApi.delete.mockResolvedValueOnce({ success: true });

      const { result } = renderHook(() => useDeleteServiceCatalogItem(), { wrapper });

      result.current.mutate('svc-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi.delete).toHaveBeenCalledWith('/service-catalog/svc-1');
    });
  });

  describe('Invalidation — uses [service-catalog] key prefix', () => {
    it('create invalidates service-catalog queries', async () => {
      mockApi.post.mockResolvedValueOnce({
        data: { service: { _id: 'svc-2', name: 'Email' } },
      });
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateServiceCatalogItem(), { wrapper });
      result.current.mutate({ name: 'Email', category: 'Communication' } as Parameters<typeof result.current.mutate>[0]);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const keys = invalidateSpy.mock.calls.map(c => c[0]?.queryKey);
      expect(keys.some(k => Array.isArray(k) && k[0] === 'service-catalog')).toBe(true);
    });
  });
});
