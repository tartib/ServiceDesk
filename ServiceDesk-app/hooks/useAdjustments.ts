'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { StockAdjustment, AdjustmentType } from '@/types';
import { balanceKeys } from './useStockBalances';

const BASE = '/inventory/adjustments';

export const adjustmentKeys = {
  all: ['stock-adjustments'] as const,
  lists: () => [...adjustmentKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...adjustmentKeys.lists(), filters] as const,
};

interface ListResponse {
  statusCode: number;
  message: string;
  data: { adjustments: StockAdjustment[] };
}

interface SingleResponse {
  statusCode: number;
  message: string;
  data: { adjustment: StockAdjustment };
}

export function useAdjustments(filters: Record<string, string | undefined> = {}) {
  return useQuery({
    queryKey: adjustmentKeys.list(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.set(k, String(v));
      });
      return api.get<ListResponse>(`${BASE}?${params.toString()}`);
    },
  });
}

export function useCreateAdjustment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      partId: string;
      warehouseId: string;
      adjustmentType: AdjustmentType;
      quantity: number;
      reason: string;
      notes?: string;
    }) => api.post<SingleResponse>(BASE, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adjustmentKeys.lists() });
      qc.invalidateQueries({ queryKey: balanceKeys.lists() });
    },
  });
}
