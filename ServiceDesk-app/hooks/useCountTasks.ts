'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { InventoryCountTask, CountTaskStatus } from '@/types';
import { countScheduleKeys } from './useCountSchedules';

const BASE = '/inventory/count-tasks';

export const countTaskKeys = {
  all: ['count-tasks'] as const,
  lists: () => [...countTaskKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...countTaskKeys.lists(), filters] as const,
  detail: (id: string) => [...countTaskKeys.all, 'detail', id] as const,
};

interface ListResponse {
  statusCode: number;
  message: string;
  data: { tasks: InventoryCountTask[] };
}

interface SingleResponse {
  statusCode: number;
  message: string;
  data: { task: InventoryCountTask };
}

interface GenerateResponse {
  statusCode: number;
  message: string;
  data: { tasks: InventoryCountTask[]; count: number };
}

export function useCountTasks(filters: Record<string, string | undefined> = {}) {
  return useQuery({
    queryKey: countTaskKeys.list(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.set(k, String(v));
      });
      return api.get<ListResponse>(`${BASE}?${params.toString()}`);
    },
  });
}

export function useCountTask(id: string) {
  return useQuery({
    queryKey: countTaskKeys.detail(id),
    queryFn: () => api.get<SingleResponse>(`${BASE}/${id}`),
    enabled: !!id,
  });
}

export function useGenerateCountTasks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (date?: string) => api.post<GenerateResponse>(`${BASE}/generate`, { date }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: countTaskKeys.lists() });
    },
  });
}

export function useStartCountTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<SingleResponse>(`${BASE}/${id}/start`),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: countTaskKeys.lists() });
      qc.invalidateQueries({ queryKey: countTaskKeys.detail(id) });
    },
  });
}

export function useUpdateCountItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, itemIndex, actualQuantity, notes }: {
      taskId: string;
      itemIndex: number;
      actualQuantity: number;
      notes?: string;
    }) => api.patch<SingleResponse>(`${BASE}/${taskId}/items/${itemIndex}`, { actualQuantity, notes }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: countTaskKeys.detail(vars.taskId) });
    },
  });
}

export function useUpdateVarianceReason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, itemIndex, varianceReason }: {
      taskId: string;
      itemIndex: number;
      varianceReason: string;
    }) => api.patch<SingleResponse>(`${BASE}/${taskId}/items/${itemIndex}/variance-reason`, { varianceReason }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: countTaskKeys.detail(vars.taskId) });
    },
  });
}

export function useSubmitCountTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<SingleResponse>(`${BASE}/${id}/submit`),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: countTaskKeys.lists() });
      qc.invalidateQueries({ queryKey: countTaskKeys.detail(id) });
    },
  });
}

export function useReviewCountTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, rejectionReason }: {
      id: string;
      action: 'approve' | 'reject';
      rejectionReason?: string;
    }) => api.patch<SingleResponse>(`${BASE}/${id}/review`, { action, rejectionReason }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: countTaskKeys.lists() });
      qc.invalidateQueries({ queryKey: countTaskKeys.detail(vars.id) });
      qc.invalidateQueries({ queryKey: countScheduleKeys.lists() });
    },
  });
}
