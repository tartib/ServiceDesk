'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { InventoryMovement } from '@/types';

const BASE = '/inventory/movements';

export const movementKeys = {
  all: ['inventory-movements'] as const,
  lists: () => [...movementKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...movementKeys.lists(), filters] as const,
  item: (partId: string) => [...movementKeys.all, 'item', partId] as const,
};

interface PaginatedResponse {
  statusCode: number;
  message: string;
  data: {
    items?: InventoryMovement[];
    movements?: InventoryMovement[];
    pagination?: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    };
  };
}

export function useMovements(filters: Record<string, string | number | undefined> = {}) {
  return useQuery({
    queryKey: movementKeys.list(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.set(k, String(v));
      });
      return api.get<PaginatedResponse>(`${BASE}?${params.toString()}`);
    },
  });
}

export function useItemMovements(partId: string, filters: Record<string, string | number | undefined> = {}) {
  return useQuery({
    queryKey: [...movementKeys.item(partId), filters],
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.set(k, String(v));
      });
      return api.get<PaginatedResponse>(`/inventory/items/${partId}/movements?${params.toString()}`);
    },
    enabled: !!partId,
  });
}
