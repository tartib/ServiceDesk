'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { StockIssue } from '@/types';
import { balanceKeys } from './useStockBalances';

const BASE = '/inventory/issues';

export const issueKeys = {
  all: ['stock-issues'] as const,
  lists: () => [...issueKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...issueKeys.lists(), filters] as const,
};

interface ListResponse {
  statusCode: number;
  message: string;
  data: { issues: StockIssue[] };
}

interface SingleResponse {
  statusCode: number;
  message: string;
  data: { issue: StockIssue };
}

export function useIssues(filters: Record<string, string | undefined> = {}) {
  return useQuery({
    queryKey: issueKeys.list(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.set(k, String(v));
      });
      return api.get<ListResponse>(`${BASE}?${params.toString()}`);
    },
  });
}

export function useCreateIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      partId: string;
      warehouseId: string;
      quantity: number;
      referenceType?: string;
      referenceId?: string;
      issuedTo?: string;
      bookingId?: string;
      notes?: string;
    }) => api.post<SingleResponse>(BASE, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: issueKeys.lists() });
      qc.invalidateQueries({ queryKey: balanceKeys.lists() });
    },
  });
}
