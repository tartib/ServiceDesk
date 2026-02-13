import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { vi } from 'vitest';
import {
  useAllTasks,
  useTask,
  useCreateTask,
  useAssignTask,
  useStartTask,
  useCompleteTask,
} from '@/hooks/useTasks';

// Mock axios
vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock organization context
vi.mock('@/lib/api/organization-context', () => ({
  validatePMOperation: vi.fn(() => 'org-123'),
  requireOrganizationId: vi.fn(() => 'org-123'),
  hasOrganizationContext: vi.fn(() => true),
  getOrganizationId: vi.fn(() => 'org-123'),
}));

describe('useTasks Hooks - Basic Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  const createWrapper = () => {
    return ({ children }: any) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

  describe('useAllTasks', () => {
    it('should fetch all tasks for a project', async () => {
      const mockTasks = [
        { _id: '1', name: 'Task 1', status: 'todo' },
        { _id: '2', name: 'Task 2', status: 'in-progress' },
      ];

      const api = require('@/lib/axios').default;
      api.get.mockResolvedValueOnce({ data: mockTasks });

      const { result } = renderHook(() => useAllTasks('project-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
      expect(api.get).toHaveBeenCalledWith('/projects/project-123/tasks');
    });

    it('should not fetch if projectId is empty', () => {
      const api = require('@/lib/axios').default;
      api.get.mockResolvedValueOnce({ data: [] });

      const { result } = renderHook(() => useAllTasks(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(api.get).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      const api = require('@/lib/axios').default;
      api.get.mockRejectedValueOnce(new Error('API Error'));

      const { result } = renderHook(() => useAllTasks('project-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('useTask', () => {
    it('should fetch a single task by ID', async () => {
      const mockTask = { _id: 'task-1', name: 'Single Task' };
      const api = require('@/lib/axios').default;
      api.get.mockResolvedValueOnce({ data: mockTask });

      const { result } = renderHook(() => useTask('task-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.name).toBe('Single Task');
      expect(api.get).toHaveBeenCalledWith('/tasks/task-1');
    });

    it('should not fetch if taskId is empty', () => {
      const api = require('@/lib/axios').default;
      api.get.mockResolvedValueOnce({ data: {} });

      const { result } = renderHook(() => useTask(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(api.get).not.toHaveBeenCalled();
    });
  });

  describe('useCreateTask', () => {
    it('should create a new task', async () => {
      const newTask = { _id: 'new-1', name: 'New Task' };
      const api = require('@/lib/axios').default;
      api.post.mockResolvedValueOnce({ data: newTask });

      const { result } = renderHook(() => useCreateTask(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        projectId: 'project-123',
        name: 'New Task',
      } as any);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(api.post).toHaveBeenCalledWith(
        '/projects/project-123/tasks',
        expect.any(Object)
      );
    });

    it('should handle creation errors', async () => {
      const api = require('@/lib/axios').default;
      api.post.mockRejectedValueOnce(new Error('Creation failed'));

      const { result } = renderHook(() => useCreateTask(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        projectId: 'project-123',
        name: 'New Task',
      } as any);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useAssignTask', () => {
    it('should assign task to user', async () => {
      const updatedTask = { _id: 'task-1', assignee: 'user-456' };
      const api = require('@/lib/axios').default;
      api.put.mockResolvedValueOnce({ data: updatedTask });

      const { result } = renderHook(() => useAssignTask(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        taskId: 'task-1',
        userId: 'user-456',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(api.put).toHaveBeenCalledWith('/tasks/task-1', {
        assignee: 'user-456',
      });
    });

    it('should handle assignment errors', async () => {
      const api = require('@/lib/axios').default;
      api.put.mockRejectedValueOnce(new Error('Assignment failed'));

      const { result } = renderHook(() => useAssignTask(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        taskId: 'task-1',
        userId: 'user-456',
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useStartTask', () => {
    it('should transition task to in-progress', async () => {
      const updatedTask = { _id: 'task-1', status: 'in-progress' };
      const api = require('@/lib/axios').default;
      api.post.mockResolvedValueOnce({ data: updatedTask });

      const { result } = renderHook(() => useStartTask(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('task-1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(api.post).toHaveBeenCalledWith('/tasks/task-1/transition', {
        statusId: 'in-progress',
      });
    });
  });

  describe('useCompleteTask', () => {
    it('should transition task to done', async () => {
      const updatedTask = { _id: 'task-1', status: 'done' };
      const api = require('@/lib/axios').default;
      api.post.mockResolvedValueOnce({ data: updatedTask });

      const { result } = renderHook(() => useCompleteTask(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        taskId: 'task-1',
        notes: 'Task completed',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(api.post).toHaveBeenCalledWith('/tasks/task-1/transition', {
        statusId: 'done',
        comment: 'Task completed',
      });
    });

    it('should handle completion without notes', async () => {
      const api = require('@/lib/axios').default;
      api.post.mockResolvedValueOnce({ data: { _id: 'task-1' } });

      const { result } = renderHook(() => useCompleteTask(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        taskId: 'task-1',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(api.post).toHaveBeenCalledWith('/tasks/task-1/transition', {
        statusId: 'done',
        comment: undefined,
      });
    });
  });

  describe('Query Invalidation', () => {
    it('should invalidate task queries on mutation success', async () => {
      const api = require('@/lib/axios').default;
      api.post.mockResolvedValueOnce({ data: { _id: 'new-1' } });

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateTask(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        projectId: 'project-123',
        name: 'New Task',
      } as any);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalled();
      invalidateSpy.mockRestore();
    });
  });
});
