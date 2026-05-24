/**
 * useOnboarding — Workspace setup hooks (Section 2, Batch 2)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WorkspaceSetupDTO {
  workspaceType: string;
  organizationName?: string;
}

export interface WorkspaceSetupResult {
  organizationId: string;
  workspaceType: string;
  organizationName: string;
  requestTypesSeeded: number;
}

export interface WorkspaceInfo {
  organizationId: string;
  name: string;
  workspaceType: string | null;
  isOnboarded: boolean;
}

// ── Keys ──────────────────────────────────────────────────────────────────────

export const workspaceKeys = {
  all: ['workspace'] as const,
  current: () => [...workspaceKeys.all, 'current'] as const,
  types: () => [...workspaceKeys.all, 'types'] as const,
};

// ── Queries ───────────────────────────────────────────────────────────────────

export function useCurrentWorkspace() {
  return useQuery({
    queryKey: workspaceKeys.current(),
    queryFn: async (): Promise<WorkspaceInfo> => {
      const res = await api.get<{ data: WorkspaceInfo }>('/workspace/current');
      return (res as any)?.data ?? res;
    },
  });
}

export function useWorkspaceTypes() {
  return useQuery({
    queryKey: workspaceKeys.types(),
    queryFn: async (): Promise<string[]> => {
      const res = await api.get<{ data: string[] }>('/workspace/types');
      return (res as any)?.data ?? res;
    },
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useSetupWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: WorkspaceSetupDTO): Promise<WorkspaceSetupResult> => {
      const res = await api.post<{ data: WorkspaceSetupResult }>('/workspace/setup', dto);
      return (res as any)?.data ?? res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workspaceKeys.current() });
    },
  });
}
