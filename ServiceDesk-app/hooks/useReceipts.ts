'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { StockReceipt } from '@/types';
import { balanceKeys } from './useStockBalances';

const BASE = '/inventory/receipts';

export const receiptKeys = {
  all: ['stock-receipts'] as const,
  lists: () => [...receiptKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...receiptKeys.lists(), filters] as const,
};

interface ListResponse {
  statusCode: number;
  message: string;
  data: { receipts: StockReceipt[] };
}

interface SingleResponse {
  statusCode: number;
  message: string;
  data: { receipt: StockReceipt };
}

export function useReceipts(filters: Record<string, string | undefined> = {}) {
  return useQuery({
    queryKey: receiptKeys.list(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.set(k, String(v));
      });
      return api.get<ListResponse>(`${BASE}?${params.toString()}`);
    },
  });
}

export function useCreateReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      partId: string;
      warehouseId: string;
      locationId?: string;
      quantity: number;
      supplierId?: string;
      referenceNo?: string;
      notes?: string;
    }) => api.post<SingleResponse>(BASE, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: receiptKeys.lists() }); },
  });
}

export function useConfirmReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<SingleResponse>(`${BASE}/${id}/confirm`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: receiptKeys.lists() });
      qc.invalidateQueries({ queryKey: balanceKeys.lists() });
    },
  });
}

export function useCancelReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<SingleResponse>(`${BASE}/${id}/cancel`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: receiptKeys.lists() }); },
  });
}
