import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest';
import {
  useAllTasks,
  useTodayTasks,
  useMyTasks,
  useTasksByStatus,
  useTask,
  useCreateTask,
  useAssignTask,
  useStartTask,
  useCompleteTask,
} from '@/hooks/useTasks';
import { TaskStatus } from '@/types';
import api from '@/lib/axios';

vi.mock('@/lib/axios');

const mockApi = api as unknown as { get: Mock; post: Mock; put: Mock; patch: Mock; delete: Mock };

describe('useTasks Hooks', () => {
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

  describe('useAllTasks', () => {
    it('should fetch all tasks for a project', async () => {
      const mockTasks = [
        { _id: '1', productName: 'Task 1', status: 'scheduled' },
        { _id: '2', productName: 'Task 2', status: 'in_progress' },
      ];
      mockApi.get.mockResolvedValueOnce({ data: mockTasks });

      const { result } = renderHook(() => useAllTasks('project-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0].productName).toBe('Task 1');
      expect(mockApi.get).toHaveBeenCalledWith('/projects/project-123/tasks');
    });

    it('should not fetch if projectId is empty', () => {
      mockApi.get.mockResolvedValueOnce({ data: [] });

      const { result } = renderHook(() => useAllTasks(''), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(mockApi.get).not.toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      mockApi.get.mockRejectedValue(error);

      const { result } = renderHook(() => useAllTasks('project-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      }, { timeout: 5000 });

      expect(result.current.error).toBeDefined();
    });

    it('should map _id to id field', async () => {
      const mockTasks = [{ _id: 'task-1', productName: 'Task 1' }];
      mockApi.get.mockResolvedValue({ data: mockTasks });

      const { result } = renderHook(() => useAllTasks('project-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.[0].id).toBe('task-1');
    });
  });

  describe('useTodayTasks', () => {
    it('should fetch today\'s tasks with date filter', async () => {
      const mockTasks = [{ _id: '1', productName: 'Today Task', dueDate: new Date() }];
      mockApi.get.mockResolvedValueOnce({ data: mockTasks });

      const { result } = renderHook(() => useTodayTasks('project-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApi.get).toHaveBeenCalledWith(
        '/projects/project-123/tasks',
        expect.objectContaining({
          params: expect.objectContaining({
            dueDate: expect.any(String),
          }),
        })
      );
    });

    it('should not fetch if projectId is empty', () => {
      mockApi.get.mockResolvedValueOnce({ data: [] });

      const { result } = renderHook(() => useTodayTasks(''), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(mockApi.get).not.toHaveBeenCalled();
    });
  });

  describe('useMyTasks', () => {
    it('should fetch current user\'s tasks', async () => {
      const mockTasks = [{ _id: '1', productName: 'My Task', assignee: 'user-123' }];
      mockApi.get.mockResolvedValueOnce({ data: mockTasks });

      const { result } = renderHook(() => useMyTasks('project-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApi.get).toHaveBeenCalledWith(
        '/projects/project-123/tasks',
        expect.objectContaining({
          params: expect.objectContaining({
            assignee: 'me',
          }),
        })
      );
    });
  });

  describe('useTasksByStatus', () => {
    it('should fetch tasks filtered by status', async () => {
      const mockTasks = [{ _id: '1', productName: 'Task', status: 'scheduled' }];
      mockApi.get.mockResolvedValueOnce({ data: mockTasks });

      const { result } = renderHook(() => useTasksByStatus('project-123', 'scheduled'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApi.get).toHaveBeenCalledWith(
        '/projects/project-123/tasks',
        expect.objectContaining({
          params: expect.objectContaining({
            status: 'scheduled',
          }),
        })
      );
    });

    it('should not fetch if status is missing', () => {
      mockApi.get.mockResolvedValueOnce({ data: [] });

      const { result } = renderHook(() => useTasksByStatus('project-123', '' as TaskStatus), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(mockApi.get).not.toHaveBeenCalled();
    });
  });

  describe('useTask', () => {
    it('should fetch a single task by ID', async () => {
      const mockTask = { _id: 'task-1', productName: 'Single Task' };
      mockApi.get.mockResolvedValue(mockTask);

      const { result } = renderHook(() => useTask('task-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.productName).toBe('Single Task');
      expect(mockApi.get).toHaveBeenCalledWith('/tasks/task-1');
    });

    it('should not fetch if taskId is empty', () => {
      mockApi.get.mockResolvedValueOnce({ data: {} });

      const { result } = renderHook(() => useTask(''), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(mockApi.get).not.toHaveBeenCalled();
    });

    it('should handle task not found error', async () => {
      mockApi.get.mockRejectedValue(new Error('Task not found'));

      const { result } = renderHook(() => useTask('invalid-id'), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      }, { timeout: 5000 });
    });
  });

  describe('useCreateTask', () => {
    it('should create a new task', async () => {
      const newTask = { _id: 'new-1', productName: 'New Task', projectId: 'project-123' };
      mockApi.post.mockResolvedValueOnce({ data: newTask });

      const { result } = renderHook(() => useCreateTask(), { wrapper });

      result.current.mutate({
        productId: 'product-1',
        scheduledAt: '2024-01-15T10:00:00Z',
        taskType: 'daily_recurring',
        projectId: 'project-123',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApi.post).toHaveBeenCalledWith(
        '/projects/project-123/tasks',
        expect.objectContaining({
          productId: 'product-1',
          scheduledAt: '2024-01-15T10:00:00Z',
        })
      );
    });

    it('should invalidate task queries on success', async () => {
      mockApi.post.mockResolvedValueOnce({ data: { _id: 'new-1' } });
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateTask(), { wrapper });

      result.current.mutate({
        productId: 'product-1',
        scheduledAt: '2024-01-15T10:00:00Z',
        taskType: 'daily_recurring',
        projectId: 'project-123',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalled();
      invalidateSpy.mockRestore();
    });

    it('should handle creation errors', async () => {
      mockApi.post.mockRejectedValueOnce(new Error('Creation failed'));

      const { result } = renderHook(() => useCreateTask(), { wrapper });

      result.current.mutate({
        productId: 'product-1',
        scheduledAt: '2024-01-15T10:00:00Z',
        taskType: 'daily_recurring',
        projectId: 'project-123',
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useAssignTask', () => {
    it('should assign task to user', async () => {
      const updatedTask = { _id: 'task-1', assignee: 'user-456' };
      mockApi.put.mockResolvedValueOnce({ data: updatedTask });

      const { result } = renderHook(() => useAssignTask(), { wrapper });

      result.current.mutate({
        taskId: 'task-1',
        userId: 'user-456',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApi.put).toHaveBeenCalledWith('/tasks/task-1', {
        assignee: 'user-456',
      });
    });

    it('should invalidate task queries on success', async () => {
      mockApi.put.mockResolvedValueOnce({ data: { _id: 'task-1' } });
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useAssignTask(), { wrapper });

      result.current.mutate({
        taskId: 'task-1',
        userId: 'user-456',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalled();
      invalidateSpy.mockRestore();
    });

    it('should handle assignment errors', async () => {
      mockApi.put.mockRejectedValueOnce(new Error('Assignment failed'));

      const { result } = renderHook(() => useAssignTask(), { wrapper });

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
      mockApi.post.mockResolvedValueOnce({ data: updatedTask });

      const { result } = renderHook(() => useStartTask(), { wrapper });

      result.current.mutate('task-1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApi.post).toHaveBeenCalledWith('/tasks/task-1/transition', {
        statusId: 'in-progress',
      });
    });

    it('should invalidate task queries on success', async () => {
      mockApi.post.mockResolvedValueOnce({ data: { _id: 'task-1' } });
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useStartTask(), { wrapper });

      result.current.mutate('task-1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalled();
      invalidateSpy.mockRestore();
    });
  });

  describe('useCompleteTask', () => {
    it('should transition task to done', async () => {
      const updatedTask = { _id: 'task-1', status: 'done' };
      mockApi.post.mockResolvedValueOnce({ data: updatedTask });

      const { result } = renderHook(() => useCompleteTask(), { wrapper });

      result.current.mutate({
        taskId: 'task-1',
        notes: 'Task completed',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApi.post).toHaveBeenCalledWith('/tasks/task-1/transition', {
        statusId: 'done',
        comment: 'Task completed',
      });
    });

    it('should handle completion without notes', async () => {
      mockApi.post.mockResolvedValueOnce({ data: { _id: 'task-1' } });

      const { result } = renderHook(() => useCompleteTask(), { wrapper });

      result.current.mutate({
        taskId: 'task-1',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApi.post).toHaveBeenCalledWith('/tasks/task-1/transition', {
        statusId: 'done',
        comment: undefined,
      });
    });

    it('should invalidate task queries on success', async () => {
      mockApi.post.mockResolvedValueOnce({ data: { _id: 'task-1' } });
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCompleteTask(), { wrapper });

      result.current.mutate({
        taskId: 'task-1',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalled();
      invalidateSpy.mockRestore();
    });
  });

  describe('Query Key Management', () => {
    it('should use correct query keys for caching', async () => {
      mockApi.get.mockResolvedValueOnce({ data: [] });

      renderHook(() => useAllTasks('project-123'), { wrapper });

      await waitFor(() => {
        const state = queryClient.getQueryState(['tasks', 'all', 'project-123']);
        expect(state).toBeDefined();
      });
    });

    it('should differentiate between different query types', async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      renderHook(() => useAllTasks('project-123'), { wrapper });
      renderHook(() => useMyTasks('project-123'), { wrapper });

      await waitFor(() => {
        const allTasksState = queryClient.getQueryState(['tasks', 'all', 'project-123']);
        const myTasksState = queryClient.getQueryState(['tasks', 'my-tasks', 'project-123']);
        expect(allTasksState).toBeDefined();
        expect(myTasksState).toBeDefined();
      });
    });
  });

  describe('Error Handling', () => {
    it('should log errors on mutation failure', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockApi.post.mockRejectedValueOnce(new Error('Create failed'));

      const { result } = renderHook(() => useCreateTask(), { wrapper });

      result.current.mutate({
        productId: 'product-1',
        scheduledAt: '2024-01-15T10:00:00Z',
        taskType: 'daily_recurring',
        projectId: 'project-123',
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
