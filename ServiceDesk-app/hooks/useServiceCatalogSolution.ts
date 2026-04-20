/**
 * useServiceCatalogSolution — Frontend hooks for the Service Catalog solution facade
 *
 * These hooks back the self-service portal UI and the catalog management screen.
 * They call the service-catalog API endpoints backed by ServiceCatalogService
 * on the backend (solutions/service-catalog/).
 *
 * Architecture (ADR 001):
 *   Self-service UI → useServiceCatalogSolution → /api/v2/service-catalog
 *                                                → ServiceCatalogService (backend)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CatalogItem {
  catalogItemId: string;
  formDefinitionId: string;
  displayOrder: number;
  isVisible: boolean;
  tags: string[];
  siteId?: string;
  formDefinition?: {
    id: string;
    name: string;
    name_ar?: string;
    description?: string;
    category?: string;
    icon?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCatalogItemDTO {
  formDefinitionId: string;
  displayOrder?: number;
  isVisible?: boolean;
  tags?: string[];
  siteId?: string;
}

export interface ServiceRequestDTO {
  catalogItemId: string;
  data: Record<string, unknown>;
  siteId?: string;
}

// ── Query Keys ────────────────────────────────────────────────────────────────

const catalogKeys = {
  all: ['service-catalog'] as const,
  items: (siteId?: string) => [...catalogKeys.all, 'items', siteId ?? 'all'] as const,
  item: (catalogItemId: string) => [...catalogKeys.all, 'item', catalogItemId] as const,
};

// ── API functions ─────────────────────────────────────────────────────────────

const catalogApi = {
  listItems: async (siteId?: string): Promise<CatalogItem[]> => {
    const raw = await api.get<{ items?: CatalogItem[]; data?: CatalogItem[] }>(
      '/service-catalog/items',
      { params: siteId ? { siteId } : undefined },
    );
    return raw?.items ?? raw?.data ?? [];
  },

  getItem: async (catalogItemId: string): Promise<CatalogItem> => {
    const raw = await api.get<{ item?: CatalogItem; data?: CatalogItem }>(
      `/service-catalog/items/${catalogItemId}`,
    );
    return (raw?.item ?? raw?.data ?? raw) as CatalogItem;
  },

  addItem: async (dto: CreateCatalogItemDTO): Promise<CatalogItem> => {
    const raw = await api.post<{ item?: CatalogItem; data?: CatalogItem }>(
      '/service-catalog/items',
      dto,
    );
    return (raw?.item ?? raw?.data ?? raw) as CatalogItem;
  },

  setVisibility: async (catalogItemId: string, isVisible: boolean): Promise<CatalogItem> => {
    const raw = await api.patch<{ item?: CatalogItem; data?: CatalogItem }>(
      `/service-catalog/items/${catalogItemId}/visibility`,
      { isVisible },
    );
    return (raw?.item ?? raw?.data ?? raw) as CatalogItem;
  },

  removeItem: async (catalogItemId: string): Promise<void> => {
    await api.delete(`/service-catalog/items/${catalogItemId}`);
  },

  requestService: async (dto: ServiceRequestDTO): Promise<{ recordId: string }> => {
    const raw = await api.post<{ recordId?: string; id?: string }>(
      '/service-catalog/request',
      dto,
    );
    return { recordId: raw?.recordId ?? raw?.id ?? '' };
  },
};

// ── Query hooks ───────────────────────────────────────────────────────────────

/** List all visible catalog items */
export function useCatalogItems(siteId?: string) {
  return useQuery({
    queryKey: catalogKeys.items(siteId),
    queryFn: () => catalogApi.listItems(siteId),
  });
}

/** Get a single catalog item */
export function useCatalogItem(catalogItemId: string) {
  return useQuery({
    queryKey: catalogKeys.item(catalogItemId),
    queryFn: () => catalogApi.getItem(catalogItemId),
    enabled: !!catalogItemId,
  });
}

// ── Mutation hooks ────────────────────────────────────────────────────────────

/** Add a form definition to the catalog */
export function useAddCatalogItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCatalogItemDTO) => catalogApi.addItem(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: catalogKeys.all }),
  });
}

/** Toggle catalog item visibility */
export function useSetCatalogItemVisibility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ catalogItemId, isVisible }: { catalogItemId: string; isVisible: boolean }) =>
      catalogApi.setVisibility(catalogItemId, isVisible),
    onSuccess: () => qc.invalidateQueries({ queryKey: catalogKeys.all }),
  });
}

/** Remove an item from the catalog */
export function useRemoveCatalogItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (catalogItemId: string) => catalogApi.removeItem(catalogItemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: catalogKeys.all }),
  });
}

/** Submit a service request — self-service record creation */
export function useRequestService() {
  return useMutation({
    mutationFn: (dto: ServiceRequestDTO) => catalogApi.requestService(dto),
  });
}
