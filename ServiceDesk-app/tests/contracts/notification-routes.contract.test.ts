/**
 * Notification Routes Contract Tests
 *
 * Verifies that useNotifications hooks call the correct unified API routes.
 * Catches drift between hooks, api layer, and backend endpoints.
 *
 * Contract:
 * - List:          GET /notifications  (with optional ?projectId, ?source, ?isRead, ?limit)
 * - Unread:        GET /notifications/unread
 * - Unread count:  GET /notifications/unread-count
 * - Critical:      GET /notifications/critical
 * - Mark read:     PUT /notifications/:id/read
 * - Mark all read: PUT /notifications/read-all
 * - Delete:        DELETE /notifications/:id
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import {
  useNotifications,
  useNotificationsByProject,
  useUnreadNotifications,
  useUnreadCount,
  useCriticalNotifications,
  useMarkNotificationAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from '@/hooks/useNotifications';
import api from '@/lib/axios';

vi.mock('@/lib/axios');

const mockApi = api as unknown as {
  get: Mock;
  put: Mock;
  delete: Mock;
};

describe('Notification Routes Contract', () => {
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

  describe('Query endpoints', () => {
    it('useNotifications → GET /notifications', async () => {
      mockApi.get.mockResolvedValueOnce({ notifications: [], count: 0, unreadCount: 0 });
      renderHook(() => useNotifications(), { wrapper });
      await waitFor(() => expect(mockApi.get).toHaveBeenCalled());
      expect(mockApi.get).toHaveBeenCalledWith('/notifications', { params: undefined });
    });

    it('useNotificationsByProject → GET /notifications with projectId param', async () => {
      mockApi.get.mockResolvedValueOnce({ notifications: [], count: 0, unreadCount: 0 });
      renderHook(() => useNotificationsByProject('proj-123'), { wrapper });
      await waitFor(() => expect(mockApi.get).toHaveBeenCalled());
      expect(mockApi.get).toHaveBeenCalledWith('/notifications', {
        params: { projectId: 'proj-123' },
      });
    });

    it('useUnreadNotifications → GET /notifications/unread', async () => {
      mockApi.get.mockResolvedValueOnce({ notifications: [] });
      renderHook(() => useUnreadNotifications(), { wrapper });
      await waitFor(() => expect(mockApi.get).toHaveBeenCalled());
      expect(mockApi.get).toHaveBeenCalledWith('/notifications/unread');
    });

    it('useUnreadCount → GET /notifications/unread-count', async () => {
      mockApi.get.mockResolvedValueOnce({ unreadCount: 5 });
      renderHook(() => useUnreadCount(), { wrapper });
      await waitFor(() => expect(mockApi.get).toHaveBeenCalled());
      expect(mockApi.get).toHaveBeenCalledWith('/notifications/unread-count');
    });

    it('useCriticalNotifications → GET /notifications/critical', async () => {
      mockApi.get.mockResolvedValueOnce({ notifications: [] });
      renderHook(() => useCriticalNotifications(), { wrapper });
      await waitFor(() => expect(mockApi.get).toHaveBeenCalled());
      expect(mockApi.get).toHaveBeenCalledWith('/notifications/critical');
    });
  });

  describe('Mutation endpoints', () => {
    it('useMarkNotificationAsRead → PUT /notifications/:id/read', async () => {
      mockApi.put.mockResolvedValueOnce({ notification: { _id: 'n1', isRead: true } });
      const { result } = renderHook(() => useMarkNotificationAsRead(), { wrapper });

      result.current.mutate('n1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi.put).toHaveBeenCalledWith('/notifications/n1/read');
    });

    it('useMarkAllAsRead → PUT /notifications/read-all', async () => {
      mockApi.put.mockResolvedValueOnce({ modifiedCount: 3 });
      const { result } = renderHook(() => useMarkAllAsRead(), { wrapper });

      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi.put).toHaveBeenCalledWith('/notifications/read-all');
    });

    it('useDeleteNotification → DELETE /notifications/:id', async () => {
      mockApi.delete.mockResolvedValueOnce({});
      const { result } = renderHook(() => useDeleteNotification(), { wrapper });

      result.current.mutate('n1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi.delete).toHaveBeenCalledWith('/notifications/n1');
    });
  });
});
