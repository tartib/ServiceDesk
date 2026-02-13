/**
 * Teams Hooks - خطافات الفرق
 * React Query hooks for Teams API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

// Types
export interface TeamMember {
  user_id: {
    _id: string;
    name: string;
    email: string;
    role: string;
    phone?: string;
    isActive?: boolean;
  };
  role: 'leader' | 'member';
  joined_at: string;
  added_by?: string;
}

export interface Team {
  _id: string;
  id: string;
  name: string;
  name_ar: string;
  description?: string;
  description_ar?: string;
  type: 'support' | 'technical' | 'operations' | 'management' | 'other';
  members: TeamMember[];
  leader_id?: {
    _id: string;
    name: string;
    email: string;
  };
  is_active: boolean;
  member_count: number;
  created_by?: {
    _id: string;
    name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

export interface CreateTeamDTO {
  name: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  type?: 'support' | 'technical' | 'operations' | 'management' | 'other';
}

export interface UpdateTeamDTO {
  name?: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  type?: string;
  is_active?: boolean;
  leader_id?: string;
}

export interface AddMemberDTO {
  user_id: string;
  role?: 'leader' | 'member';
}

// Query Keys
export const teamKeys = {
  all: ['teams'] as const,
  lists: () => [...teamKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...teamKeys.lists(), filters] as const,
  details: () => [...teamKeys.all, 'detail'] as const,
  detail: (id: string) => [...teamKeys.details(), id] as const,
  members: (id: string) => [...teamKeys.detail(id), 'members'] as const,
};

/**
 * الحصول على قائمة الفرق
 */
export function useTeams(filters?: { type?: string; is_active?: boolean; search?: string }) {
  return useQuery({
    queryKey: teamKeys.list(filters || {}),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.is_active !== undefined) params.append('is_active', String(filters.is_active));
      if (filters?.search) params.append('search', filters.search);
      
      const response = await api.get(`/teams?${params.toString()}`) as { data?: Team[] } | Team[];
      return Array.isArray(response) ? response : (response.data || []);
    },
  });
}

/**
 * الحصول على فريق بواسطة المعرف
 */
export function useTeam(id: string) {
  return useQuery({
    queryKey: teamKeys.detail(id),
    queryFn: async () => {
      const response = await api.get(`/teams/${id}`) as { data?: Team };
      return response.data || response;
    },
    enabled: !!id,
  });
}

/**
 * إنشاء فريق جديد
 */
export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTeamDTO) => {
      const response = await api.post('/teams', data) as { data?: Team };
      return response.data || response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
    },
  });
}

/**
 * تحديث فريق
 */
export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTeamDTO }) => {
      const response = await api.put(`/teams/${id}`, data) as { data?: Team };
      return response.data || response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
    },
  });
}

/**
 * حذف فريق
 */
export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/teams/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
    },
  });
}

/**
 * إضافة عضو للفريق
 */
export function useAddTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, data }: { teamId: string; data: AddMemberDTO }) => {
      const response = await api.post(`/teams/${teamId}/members`, data) as { data?: Team };
      return response.data || response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(variables.teamId) });
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
    },
  });
}

/**
 * إزالة عضو من الفريق
 */
export function useRemoveTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: string; userId: string }) => {
      const response = await api.delete(`/teams/${teamId}/members/${userId}`) as { data?: Team };
      return response.data || response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(variables.teamId) });
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
    },
  });
}

/**
 * تحديث دور عضو
 */
export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, userId, role }: { teamId: string; userId: string; role: 'leader' | 'member' }) => {
      const response = await api.patch(`/teams/${teamId}/members/${userId}`, { role }) as { data?: Team };
      return response.data || response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(variables.teamId) });
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
    },
  });
}
