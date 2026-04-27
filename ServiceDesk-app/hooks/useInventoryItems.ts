'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { InventoryItem, InventoryItemFormData } from '@/types';

const BASE = '/inventory/items';

export const itemKeys = {
  all: ['inventory-items'] as const,
  lists: () => [...itemKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...itemKeys.lists(), filters] as const,
  detail: (id: string) => [...itemKeys.all, 'detail', id] as const,
};

interface ListResponse {
  statusCode: number;
  message: string;
  data: {
    items?: InventoryItem[];
    pagination?: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    };
  };
}

interface SingleResponse {
  statusCode: number;
  message: string;
  data: { item: InventoryItem };
}

export function useInventoryItems(filters: Record<string, string | number | undefined> = {}) {
  return useQuery({
    queryKey: itemKeys.list(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.set(k, String(v));
      });
      return api.get<ListResponse>(`${BASE}?${params.toString()}`);
    },
  });
}

export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: itemKeys.detail(id),
    queryFn: () => api.get<SingleResponse>(`${BASE}/${id}`),
    enabled: !!id,
  });
}

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: InventoryItemFormData) => api.post<SingleResponse>(BASE, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: itemKeys.lists() }); },
  });
}

export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InventoryItemFormData> }) =>
      api.put<SingleResponse>(`${BASE}/${id}`, data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: itemKeys.lists() });
      qc.invalidateQueries({ queryKey: itemKeys.detail(vars.id) });
    },
  });
}

export function useDeactivateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<SingleResponse>(`${BASE}/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: itemKeys.lists() }); },
  });
}
