'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { StockTransfer } from '@/types';
import { balanceKeys } from './useStockBalances';

const BASE = '/inventory/transfers';

export const transferKeys = {
  all: ['inv-transfers'] as const,
  lists: () => [...transferKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...transferKeys.lists(), filters] as const,
};

interface ListResponse {
  statusCode: number;
  message: string;
  data: { transfers: StockTransfer[] };
}

interface SingleResponse {
  statusCode: number;
  message: string;
  data: { transfer: StockTransfer };
}

export function useTransfers(filters: Record<string, string | undefined> = {}) {
  return useQuery({
    queryKey: transferKeys.list(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.set(k, String(v));
      });
      return api.get<ListResponse>(`${BASE}?${params.toString()}`);
    },
  });
}

export function useCreateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      partId: string;
      sourceWarehouseId: string;
      destinationWarehouseId: string;
      quantity: number;
      referenceNo?: string;
      notes?: string;
    }) => api.post<SingleResponse>(BASE, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: transferKeys.lists() });
      qc.invalidateQueries({ queryKey: balanceKeys.lists() });
    },
  });
}

export function useCancelTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<SingleResponse>(`${BASE}/${id}/cancel`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: transferKeys.lists() });
      qc.invalidateQueries({ queryKey: balanceKeys.lists() });
    },
  });
}
