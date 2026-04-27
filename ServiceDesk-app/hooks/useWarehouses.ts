'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { InvWarehouse, WarehouseLocation } from '@/types';

const BASE = '/inventory/warehouses';

export const warehouseKeys = {
  all: ['inv-warehouses'] as const,
  lists: () => [...warehouseKeys.all, 'list'] as const,
  detail: (id: string) => [...warehouseKeys.all, 'detail', id] as const,
  locations: (whId: string) => [...warehouseKeys.all, 'locations', whId] as const,
};

interface ListResponse {
  statusCode: number;
  message: string;
  data: { warehouses: InvWarehouse[] };
}

interface SingleResponse {
  statusCode: number;
  message: string;
  data: { warehouse: InvWarehouse };
}

interface LocationListResponse {
  statusCode: number;
  message: string;
  data: { locations: WarehouseLocation[] };
}

interface LocationSingleResponse {
  statusCode: number;
  message: string;
  data: { location: WarehouseLocation };
}

export function useWarehouses(includeInactive = false) {
  return useQuery({
    queryKey: [...warehouseKeys.lists(), { includeInactive }],
    queryFn: () => api.get<ListResponse>(`${BASE}?includeInactive=${includeInactive}`),
  });
}

export function useCreateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<InvWarehouse>) => api.post<SingleResponse>(BASE, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: warehouseKeys.lists() }); },
  });
}

export function useUpdateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InvWarehouse> }) =>
      api.put<SingleResponse>(`${BASE}/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: warehouseKeys.lists() }); },
  });
}

export function useDeactivateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<SingleResponse>(`${BASE}/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: warehouseKeys.lists() }); },
  });
}

// ── Locations ────────────────────────────────────────────────────
export function useWarehouseLocations(warehouseId: string) {
  return useQuery({
    queryKey: warehouseKeys.locations(warehouseId),
    queryFn: () => api.get<LocationListResponse>(`${BASE}/${warehouseId}/locations`),
    enabled: !!warehouseId,
  });
}

export function useCreateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ warehouseId, data }: { warehouseId: string; data: Partial<WarehouseLocation> }) =>
      api.post<LocationSingleResponse>(`${BASE}/${warehouseId}/locations`, data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: warehouseKeys.locations(vars.warehouseId) });
    },
  });
}
