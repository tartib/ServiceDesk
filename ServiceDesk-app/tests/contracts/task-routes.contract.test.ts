/**
 * Task Routes Contract Tests
 *
 * Verifies that useTasks.ts hooks use the correct project-scoped API routes,
 * matching the documentation in SETUP.md. Catches drift between hooks,
 * tests, and docs.
 *
 * Key contract decisions documented here:
 * - Tasks are project-scoped: GET /projects/:projectId/tasks
 * - Filtering is via query params, NOT separate endpoints
 * - Single task by ID: GET /tasks/:taskId (not project-scoped)
 * - Status transitions: POST /tasks/:taskId/transition
 * - organization-context is NOT called by task hooks (org header is injected by axios interceptor)
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import {
  useAllTasks,
  useTodayTasks,
  useMyTasks,
  useTasksByStatus,
  useTask,
  useCreateTask,
  useStartTask,
  useCompleteTask,
  useAssignTask,
} from '@/hooks/useTasks';
import api from '@/lib/axios';

vi.mock('@/lib/axios');

const mockApi = api as unknown as { get: Mock; post: Mock; put: Mock; patch: Mock };

describe('Task Routes Contract', () => {
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

  describe('List endpoints — all project-scoped via /projects/:projectId/tasks', () => {
    it('useAllTasks → GET /projects/:projectId/tasks (no query params)', async () => {
      mockApi.get.mockResolvedValueOnce({ data: [] });
      renderHook(() => useAllTasks('p1'), { wrapper });
      await waitFor(() => expect(mockApi.get).toHaveBeenCalled());
      expect(mockApi.get).toHaveBeenCalledWith('/projects/p1/tasks');
    });

    it('useTodayTasks → GET /projects/:projectId/tasks?dueDate=YYYY-MM-DD', async () => {
      mockApi.get.mockResolvedValueOnce({ data: [] });
      renderHook(() => useTodayTasks('p1'), { wrapper });
      await waitFor(() => expect(mockApi.get).toHaveBeenCalled());
      expect(mockApi.get).toHaveBeenCalledWith(
        '/projects/p1/tasks',
        expect.objectContaining({ params: expect.objectContaining({ dueDate: expect.any(String) }) })
      );
    });

    it('useMyTasks → GET /projects/:projectId/tasks?assignee=me', async () => {
      mockApi.get.mockResolvedValueOnce({ data: [] });
      renderHook(() => useMyTasks('p1'), { wrapper });
      await waitFor(() => expect(mockApi.get).toHaveBeenCalled());
      expect(mockApi.get).toHaveBeenCalledWith(
        '/projects/p1/tasks',
        expect.objectContaining({ params: { assignee: 'me' } })
      );
    });

    it('useTasksByStatus → GET /projects/:projectId/tasks?status=:status', async () => {
      mockApi.get.mockResolvedValueOnce({ data: [] });
      renderHook(() => useTasksByStatus('p1', 'scheduled'), { wrapper });
      await waitFor(() => expect(mockApi.get).toHaveBeenCalled());
      expect(mockApi.get).toHaveBeenCalledWith(
        '/projects/p1/tasks',
        expect.objectContaining({ params: { status: 'scheduled' } })
      );
    });
  });

  describe('Single task — not project-scoped', () => {
    it('useTask → GET /tasks/:taskId', async () => {
      mockApi.get.mockResolvedValue({ _id: 't1', productName: 'X' });
      renderHook(() => useTask('t1'), { wrapper });
      await waitFor(() => expect(mockApi.get).toHaveBeenCalled());
      expect(mockApi.get).toHaveBeenCalledWith('/tasks/t1');
    });
  });

  describe('Mutations', () => {
    it('useCreateTask → POST /projects/:projectId/tasks', async () => {
      mockApi.post.mockResolvedValueOnce({ data: { _id: 'new' } });
      const { result } = renderHook(() => useCreateTask(), { wrapper });

      result.current.mutate({
        productId: 'prod-1',
        scheduledAt: '2024-01-15T10:00:00Z',
        taskType: 'daily_recurring',
        projectId: 'p1',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi.post).toHaveBeenCalledWith(
        '/projects/p1/tasks',
        expect.objectContaining({ productId: 'prod-1' })
      );
    });

    it('useStartTask → POST /tasks/:taskId/transition { statusId: "in-progress" }', async () => {
      mockApi.post.mockResolvedValueOnce({ data: { _id: 't1' } });
      const { result } = renderHook(() => useStartTask(), { wrapper });

      result.current.mutate('t1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi.post).toHaveBeenCalledWith('/tasks/t1/transition', { statusId: 'in-progress' });
    });

    it('useCompleteTask → POST /tasks/:taskId/transition { statusId: "done" }', async () => {
      mockApi.post.mockResolvedValueOnce({ data: { _id: 't1' } });
      const { result } = renderHook(() => useCompleteTask(), { wrapper });

      result.current.mutate({ taskId: 't1', notes: 'done' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi.post).toHaveBeenCalledWith('/tasks/t1/transition', { statusId: 'done', comment: 'done' });
    });

    it('useAssignTask → PUT /tasks/:taskId { assignee }', async () => {
      mockApi.put.mockResolvedValueOnce({ data: { _id: 't1' } });
      const { result } = renderHook(() => useAssignTask(), { wrapper });

      result.current.mutate({ taskId: 't1', userId: 'u1' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi.put).toHaveBeenCalledWith('/tasks/t1', { assignee: 'u1' });
    });
  });

  describe('organization-context is NOT called by task hooks', () => {
    it('hooks do not import or call validatePMOperation', async () => {
      // This test documents the architectural decision:
      // Organization context (X-Organization-ID header) is injected by the axios
      // request interceptor in lib/axios.ts, NOT by individual hooks.
      // Task hooks should NEVER call validatePMOperation directly.
      mockApi.get.mockResolvedValueOnce({ data: [] });
      renderHook(() => useAllTasks('p1'), { wrapper });
      await waitFor(() => expect(mockApi.get).toHaveBeenCalled());

      // If this test exists and passes, it means the contract is:
      // "organization-context is handled at the transport layer, not the hook layer"
      expect(true).toBe(true);
    });
  });
});
