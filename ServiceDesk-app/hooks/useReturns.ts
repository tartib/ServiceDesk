'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { StockReturn, ReturnCondition } from '@/types';
import { balanceKeys } from './useStockBalances';

const BASE = '/inventory/returns';

export const returnKeys = {
  all: ['stock-returns'] as const,
  lists: () => [...returnKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...returnKeys.lists(), filters] as const,
};

interface ListResponse {
  statusCode: number;
  message: string;
  data: { returns: StockReturn[] };
}

interface SingleResponse {
  statusCode: number;
  message: string;
  data: { stockReturn: StockReturn };
}

export function useReturns(filters: Record<string, string | undefined> = {}) {
  return useQuery({
    queryKey: returnKeys.list(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.set(k, String(v));
      });
      return api.get<ListResponse>(`${BASE}?${params.toString()}`);
    },
  });
}

export function useCreateReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      partId: string;
      warehouseId: string;
      quantity: number;
      originalIssueId?: string;
      returnedBy?: string;
      condition: ReturnCondition;
      notes?: string;
    }) => api.post<SingleResponse>(BASE, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: returnKeys.lists() });
      qc.invalidateQueries({ queryKey: balanceKeys.lists() });
    },
  });
}
