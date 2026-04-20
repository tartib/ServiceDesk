/**
 * Forms Platform — API Functions
 *
 * Typed wrappers around /api/v2/forms/templates endpoints.
 * Uses the shared Axios instance (auth + org headers included automatically).
 */

import api from '@/lib/axios';
import type {
  FormDefinition,
  FormDefinitionListParams,
  CreateFormDefinitionDTO,
  UpdateFormDefinitionDTO,
} from './types';
import { normalizeFormDefinition, normalizeFormDefinitionList } from './adapters';

interface RawListResponse {
  templates?: unknown[];
  data?: unknown[];
  total?: number;
  page?: number;
  limit?: number;
}

interface RawDetailResponse {
  data?: unknown;
  template?: unknown;
}

export const formDefinitionApi = {
  /** List form definitions with optional filters and pagination */
  list: async (params?: FormDefinitionListParams): Promise<{ definitions: FormDefinition[]; total: number }> => {
    const raw = await api.get<RawListResponse>('/forms/templates', { params });
    const items = raw?.templates ?? raw?.data ?? [];
    return {
      definitions: normalizeFormDefinitionList(items as unknown[]),
      total: raw?.total ?? (items as unknown[]).length,
    };
  },

  /** Get a single form definition by ID */
  get: async (id: string): Promise<FormDefinition> => {
    const raw = await api.get<RawDetailResponse>(`/forms/templates/${id}`);
    const item = raw?.data ?? raw?.template ?? raw;
    return normalizeFormDefinition(item as Record<string, unknown>);
  },

  /** Create a new form definition */
  create: async (dto: CreateFormDefinitionDTO): Promise<FormDefinition> => {
    const raw = await api.post<RawDetailResponse>('/forms/templates', dto);
    const item = raw?.data ?? raw?.template ?? raw;
    return normalizeFormDefinition(item as Record<string, unknown>);
  },

  /** Update an existing form definition */
  update: async (id: string, dto: UpdateFormDefinitionDTO): Promise<FormDefinition> => {
    const raw = await api.patch<RawDetailResponse>(`/forms/templates/${id}`, dto);
    const item = raw?.data ?? raw?.template ?? raw;
    return normalizeFormDefinition(item as Record<string, unknown>);
  },

  /** Delete a form definition */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/forms/templates/${id}`);
  },

  /** Publish a form definition */
  publish: async (id: string): Promise<FormDefinition> => {
    const raw = await api.post<RawDetailResponse>(`/forms/templates/${id}/publish`);
    const item = raw?.data ?? raw?.template ?? raw;
    return normalizeFormDefinition(item as Record<string, unknown>);
  },

  /** Unpublish a form definition */
  unpublish: async (id: string): Promise<FormDefinition> => {
    const raw = await api.post<RawDetailResponse>(`/forms/templates/${id}/unpublish`);
    const item = raw?.data ?? raw?.template ?? raw;
    return normalizeFormDefinition(item as Record<string, unknown>);
  },

  /** List available categories */
  categories: async (): Promise<string[]> => {
    const raw = await api.get<{ categories?: string[] }>('/forms/templates/categories');
    return raw?.categories ?? [];
  },
};
