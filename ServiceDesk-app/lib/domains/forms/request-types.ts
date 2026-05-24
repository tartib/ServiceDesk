/**
 * Forms Platform — Request Types API Functions
 *
 * Typed wrappers around /api/v2/forms/request-types endpoints.
 */

import api from '@/lib/axios';
import type {
  RequestType,
  RequestTypeListResult,
  WorkspaceType,
  RecordPriority,
} from '@/types';

export interface RequestTypeListParams {
  workspaceType?: WorkspaceType;
  isActive?: boolean;
  isClientVisible?: boolean;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateRequestTypePayload {
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  icon?: string;
  workspaceType?: WorkspaceType;
  formSchemaId?: string;
  workflowTemplateId?: string;
  defaultPriority?: RecordPriority;
  isClientVisible?: boolean;
  category?: string;
  categoryAr?: string;
  sortOrder?: number;
}

export interface UpdateRequestTypePayload extends Partial<CreateRequestTypePayload> {
  isActive?: boolean;
}

export const requestTypeApi = {
  list: async (params?: RequestTypeListParams): Promise<RequestTypeListResult> => {
    return api.get<RequestTypeListResult>('/forms/request-types', { params });
  },

  get: async (id: string): Promise<RequestType> => {
    return api.get<RequestType>(`/forms/request-types/${id}`);
  },

  create: async (payload: CreateRequestTypePayload): Promise<RequestType> => {
    return api.post<RequestType>('/forms/request-types', payload);
  },

  update: async (id: string, payload: UpdateRequestTypePayload): Promise<RequestType> => {
    return api.patch<RequestType>(`/forms/request-types/${id}`, payload);
  },

  delete: async (id: string): Promise<void> => {
    return api.delete(`/forms/request-types/${id}`);
  },
};
