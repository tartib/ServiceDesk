'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { InventoryCountSchedule, CountFrequency, ScheduleStatus, WeeklyDay } from '@/types';

const BASE = '/inventory/count-schedules';

export const countScheduleKeys = {
  all: ['count-schedules'] as const,
  lists: () => [...countScheduleKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...countScheduleKeys.lists(), filters] as const,
  detail: (id: string) => [...countScheduleKeys.all, 'detail', id] as const,
};

interface ListResponse {
  statusCode: number;
  message: string;
  data: { schedules: InventoryCountSchedule[] };
}

interface SingleResponse {
  statusCode: number;
  message: string;
  data: { schedule: InventoryCountSchedule };
}

export function useCountSchedules(filters: Record<string, string | undefined> = {}) {
  return useQuery({
    queryKey: countScheduleKeys.list(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.set(k, String(v));
      });
      return api.get<ListResponse>(`${BASE}?${params.toString()}`);
    },
  });
}

export function useCountSchedule(id: string) {
  return useQuery({
    queryKey: countScheduleKeys.detail(id),
    queryFn: () => api.get<SingleResponse>(`${BASE}/${id}`),
    enabled: !!id,
  });
}

export function useCreateCountSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      frequency: CountFrequency;
      warehouseId: string;
      itemIds: string[];
      assignedTo: string;
      startDate: string;
      dueTime: string;
      weeklyDay?: WeeklyDay;
      varianceThreshold?: number;
      notes?: string;
    }) => api.post<SingleResponse>(BASE, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: countScheduleKeys.lists() });
    },
  });
}

export function useUpdateCountSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: {
      id: string;
      name?: string;
      frequency?: CountFrequency;
      warehouseId?: string;
      itemIds?: string[];
      assignedTo?: string;
      startDate?: string;
      dueTime?: string;
      weeklyDay?: WeeklyDay;
      varianceThreshold?: number;
      notes?: string;
    }) => api.put<SingleResponse>(`${BASE}/${id}`, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: countScheduleKeys.lists() });
      qc.invalidateQueries({ queryKey: countScheduleKeys.detail(vars.id) });
    },
  });
}

export function usePauseSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<SingleResponse>(`${BASE}/${id}/pause`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: countScheduleKeys.lists() });
    },
  });
}

export function useResumeSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<SingleResponse>(`${BASE}/${id}/resume`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: countScheduleKeys.lists() });
    },
  });
}

export function useArchiveSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<SingleResponse>(`${BASE}/${id}/archive`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: countScheduleKeys.lists() });
    },
  });
}
