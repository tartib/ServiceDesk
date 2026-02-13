import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

export interface IRelease {
  _id: string;
  release_id: string;
  version: string;
  name: string;
  description?: string;
  type: 'major' | 'minor' | 'patch' | 'emergency';
  status: 'planning' | 'building' | 'testing' | 'approved' | 'deployed' | 'rolled_back' | 'cancelled';
  priority: string;
  owner: { id: string; name: string; email: string };
  deployment: {
    planned_date?: string;
    actual_date?: string;
    environment: string;
    method?: string;
    rollback_plan?: string;
  };
  testing: {
    test_plan?: string;
    test_results?: string;
    sign_off_by?: string;
    sign_off_date?: string;
  };
  approval: {
    required: boolean;
    approved_by?: Array<{ user_id: string; name: string; approved_at: string }>;
    status: string;
  };
  linked_changes?: string[];
  linked_incidents?: string[];
  timeline: Array<{
    action: string;
    performed_by: { id: string; name: string };
    timestamp: string;
    details?: string;
  }>;
  attachments?: Array<{ name: string; url: string; uploaded_by: string; uploaded_at: string }>;
  created_at: string;
  updated_at: string;
}

export interface IReleaseStats {
  total: number;
  planning: number;
  building: number;
  testing: number;
  approved: number;
  deployed: number;
  cancelled: number;
}

const RELEASES_KEY = 'releases';

export const useReleases = (filters?: {
  status?: string;
  type?: string;
  priority?: string;
  owner?: string;
  page?: number;
  limit?: number;
}) => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.type) params.append('type', filters.type);
  if (filters?.priority) params.append('priority', filters.priority);
  if (filters?.owner) params.append('owner', filters.owner);
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));

  return useQuery({
    queryKey: [RELEASES_KEY, 'list', filters],
    queryFn: async () => {
      const response = await api.get<{
        success: boolean;
        data: IRelease[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`/releases?${params.toString()}`);
      return response;
    },
  });
};

export const useRelease = (releaseId: string) => {
  return useQuery({
    queryKey: [RELEASES_KEY, releaseId],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: { release: IRelease } }>(`/releases/${releaseId}`);
      return response.data.release;
    },
    enabled: !!releaseId,
  });
};

export const useReleaseStats = () => {
  return useQuery({
    queryKey: [RELEASES_KEY, 'stats'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: IReleaseStats }>('/releases/stats');
      return response.data;
    },
  });
};

export const useCreateRelease = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<IRelease>) => {
      return api.post<{ success: boolean; data: { release: IRelease } }>('/releases', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RELEASES_KEY] });
    },
  });
};

export const useUpdateRelease = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<IRelease> }) => {
      return api.patch<{ success: boolean; data: { release: IRelease } }>(`/releases/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RELEASES_KEY] });
    },
  });
};

export const useDeleteRelease = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return api.delete<{ success: boolean }>(`/releases/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RELEASES_KEY] });
    },
  });
};
