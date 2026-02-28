import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

export type ExternalTaskStatus = 'available' | 'locked' | 'completed' | 'failed' | 'cancelled';

export interface ExternalTaskItem {
  _id: string;
  instanceId: string;
  definitionId: string;
  organizationId: string;
  topic: string;
  stateCode: string;
  status: ExternalTaskStatus;
  workerId?: string;
  lockExpiresAt?: string;
  variables: Record<string, unknown>;
  resultVariables?: Record<string, unknown>;
  retries: number;
  retriesLeft: number;
  priority: number;
  errorMessage?: string;
  errorDetails?: string;
  errorHandling: string;
  createdAt: string;
  updatedAt: string;
  lockedAt?: string;
  completedAt?: string;
}

export const externalTaskKeys = {
  all: ['external-tasks'] as const,
  lists: () => [...externalTaskKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...externalTaskKeys.lists(), filters] as const,
  details: () => [...externalTaskKeys.all, 'detail'] as const,
  detail: (id: string) => [...externalTaskKeys.details(), id] as const,
};

export function useExternalTasks(filters?: {
  topic?: string;
  status?: ExternalTaskStatus;
  instanceId?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: externalTaskKeys.list(filters || {}),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.topic) params.append('topic', filters.topic);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.instanceId) params.append('instanceId', filters.instanceId);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));

      const response = await api.get(`/workflow-engine/external-tasks?${params.toString()}`) as {
        data?: {
          tasks: ExternalTaskItem[];
          pagination: { page: number; limit: number; total: number; pages: number };
        };
      };
      return {
        tasks: response.data?.tasks || [],
        pagination: response.data?.pagination,
      };
    },
    refetchInterval: 10000,
  });
}

export function useExternalTask(id: string) {
  return useQuery({
    queryKey: externalTaskKeys.detail(id),
    queryFn: async () => {
      const response = await api.get(`/workflow-engine/external-tasks/${id}`) as {
        data?: ExternalTaskItem;
      };
      return response.data as ExternalTaskItem;
    },
    enabled: !!id,
  });
}
