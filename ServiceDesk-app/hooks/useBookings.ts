'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { StockBooking } from '@/types';
import { balanceKeys } from './useStockBalances';

const BASE = '/inventory/bookings';

export const bookingKeys = {
  all: ['stock-bookings'] as const,
  lists: () => [...bookingKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...bookingKeys.lists(), filters] as const,
};

interface ListResponse {
  statusCode: number;
  message: string;
  data: { bookings: StockBooking[] };
}

interface SingleResponse {
  statusCode: number;
  message: string;
  data: { booking: StockBooking };
}

export function useBookings(filters: Record<string, string | undefined> = {}) {
  return useQuery({
    queryKey: bookingKeys.list(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.set(k, String(v));
      });
      return api.get<ListResponse>(`${BASE}?${params.toString()}`);
    },
  });
}

export function useBookStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      partId: string;
      warehouseId: string;
      quantity: number;
      referenceType?: string;
      referenceId?: string;
      notes?: string;
    }) => api.post<SingleResponse>(BASE, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bookingKeys.lists() });
      qc.invalidateQueries({ queryKey: balanceKeys.lists() });
    },
  });
}

export function useReleaseBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<SingleResponse>(`${BASE}/${id}/release`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bookingKeys.lists() });
      qc.invalidateQueries({ queryKey: balanceKeys.lists() });
    },
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<SingleResponse>(`${BASE}/${id}/cancel`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bookingKeys.lists() });
      qc.invalidateQueries({ queryKey: balanceKeys.lists() });
    },
  });
}
