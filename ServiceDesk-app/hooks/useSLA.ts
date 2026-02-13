import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

export interface ISLA {
  _id: string;
  sla_id: string;
  name: string;
  name_ar?: string;
  description: string;
  description_ar?: string;
  priority: string;
  response_time: { hours: number; business_hours_only: boolean };
  resolution_time: { hours: number; business_hours_only: boolean };
  escalation_matrix: Array<{
    level: number;
    after_minutes: number;
    notify_role: string;
    notify_users: string[];
    action?: string;
  }>;
  business_hours: {
    timezone: string;
    schedule: Array<{ day: number; start_time: string; end_time: string; is_working: boolean }>;
    holidays: string[];
  };
  notifications: {
    warning_threshold_percent: number;
    breach_notifications: string[];
  };
  applies_to: {
    categories?: string[];
    sites?: string[];
    user_groups?: string[];
  };
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ISLAStats {
  total: number;
  active: number;
  defaults: number;
  byPriority: Record<string, number>;
}

const SLA_KEY = 'slas';

export const useSLAs = (filters?: {
  priority?: string;
  is_active?: boolean;
  is_default?: boolean;
  page?: number;
  limit?: number;
}) => {
  const params = new URLSearchParams();
  if (filters?.priority) params.append('priority', filters.priority);
  if (filters?.is_active !== undefined) params.append('is_active', String(filters.is_active));
  if (filters?.is_default !== undefined) params.append('is_default', String(filters.is_default));
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));

  return useQuery({
    queryKey: [SLA_KEY, 'list', filters],
    queryFn: async () => {
      const response = await api.get<{
        success: boolean;
        data: ISLA[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`/slas?${params.toString()}`);
      return response;
    },
  });
};

export const useSLA = (slaId: string) => {
  return useQuery({
    queryKey: [SLA_KEY, slaId],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: { sla: ISLA } }>(`/slas/${slaId}`);
      return response.data.sla;
    },
    enabled: !!slaId,
  });
};

export const useSLAStats = () => {
  return useQuery({
    queryKey: [SLA_KEY, 'stats'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: ISLAStats }>('/slas/stats');
      return response.data;
    },
  });
};

export const useCreateSLA = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ISLA>) => {
      return api.post<{ success: boolean; data: { sla: ISLA } }>('/slas', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SLA_KEY] });
    },
  });
};

export const useUpdateSLA = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ISLA> }) => {
      return api.patch<{ success: boolean; data: { sla: ISLA } }>(`/slas/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SLA_KEY] });
    },
  });
};

export const useDeleteSLA = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return api.delete<{ success: boolean }>(`/slas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SLA_KEY] });
    },
  });
};
