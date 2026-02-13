import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { ExecutionLog, ApiResponse } from '@/types';

export const useTaskExecutionLog = (taskId: string, limit = 50) => {
  return useQuery({
    queryKey: ['execution-log', 'task', taskId, limit],
    queryFn: async () => {
      const response: ApiResponse<ExecutionLog[]> = await api.get(
        `/tasks/${taskId}/execution-log?limit=${limit}`
      );
      return response.data || [];
    },
    enabled: !!taskId,
  });
};

export const useUserExecutionLog = (userId: string, limit = 50) => {
  return useQuery({
    queryKey: ['execution-log', 'user', userId, limit],
    queryFn: async () => {
      const response: ApiResponse<ExecutionLog[]> = await api.get(
        `/users/${userId}/execution-log?limit=${limit}`
      );
      return response.data || [];
    },
    enabled: !!userId,
  });
};

export const useRecentActivity = (limit = 20) => {
  return useQuery({
    queryKey: ['execution-log', 'recent', limit],
    queryFn: async () => {
      const response: ApiResponse<ExecutionLog[]> = await api.get(
        `/execution-log/recent?limit=${limit}`
      );
      return response.data || [];
    },
  });
};
