import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { IRelease, IReleaseStats } from '@/types/itsm';

export type { IRelease, IReleaseStats };

const ITSM_BASE = '/api/v2/itsm';
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
      }>(`${ITSM_BASE}/releases?${params.toString()}`);
      return response;
    },
  });
};

export const useRelease = (releaseId: string) => {
  return useQuery({
    queryKey: [RELEASES_KEY, releaseId],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: { release: IRelease } }>(`${ITSM_BASE}/releases/${releaseId}`);
      return response.data.release;
    },
    enabled: !!releaseId,
  });
};

export const useReleaseStats = () => {
  return useQuery({
    queryKey: [RELEASES_KEY, 'stats'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: IReleaseStats }>(`${ITSM_BASE}/releases/stats`);
      return response.data;
    },
  });
};

export const useCreateRelease = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<IRelease>) => {
      return api.post<{ success: boolean; data: { release: IRelease } }>(`${ITSM_BASE}/releases`, data);
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
      return api.patch<{ success: boolean; data: { release: IRelease } }>(`${ITSM_BASE}/releases/${id}`, data);
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
      return api.delete<{ success: boolean }>(`${ITSM_BASE}/releases/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RELEASES_KEY] });
    },
  });
};
