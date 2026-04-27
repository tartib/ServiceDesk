'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { StockBalance } from '@/types';

const BASE = '/inventory/balances';

export const balanceKeys = {
  all: ['stock-balances'] as const,
  lists: () => [...balanceKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...balanceKeys.lists(), filters] as const,
  part: (partId: string) => [...balanceKeys.all, 'part', partId] as const,
};

interface PaginatedResponse {
  statusCode: number;
  message: string;
  data: {
    items: StockBalance[];
    pagination: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    };
  };
}

interface SimpleResponse {
  statusCode: number;
  message: string;
  data: { items?: StockBalance[]; balance?: StockBalance; balances?: StockBalance[] };
}

export function useStockBalances(filters: Record<string, string | number | undefined> = {}) {
  return useQuery({
    queryKey: balanceKeys.list(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.set(k, String(v));
      });
      return api.get<PaginatedResponse | SimpleResponse>(`${BASE}?${params.toString()}`);
    },
  });
}

export function usePartBalance(partId: string, warehouseId?: string) {
  return useQuery({
    queryKey: [...balanceKeys.part(partId), warehouseId],
    queryFn: () => {
      const params = warehouseId ? `?warehouseId=${warehouseId}` : '';
      return api.get<SimpleResponse>(`${BASE}/${partId}${params}`);
    },
    enabled: !!partId,
  });
}
