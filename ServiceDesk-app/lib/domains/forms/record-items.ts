/**
 * Forms Platform — Record Items API Functions
 *
 * Typed wrappers around /api/v2/forms/records endpoints.
 * These use the new RecordItem model (metadata layer).
 */

import api from '@/lib/axios';
import type {
  RecordItem,
  RecordItemListResult,
  RecordItemStatus,
  RecordSourceType,
  WorkspaceType,
  CreateRecordPayload,
  UpdateDraftPayload,
} from '@/types';
import type { RecordDetail } from './records';

export interface RecordItemListParams {
  status?: RecordItemStatus;
  assigneeId?: string;
  requesterId?: string;
  requestTypeId?: string;
  workspaceType?: WorkspaceType;
  sourceType?: RecordSourceType;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FullRecordResponse {
  recordItem: RecordItem;
  detail: RecordDetail | null;
}

export interface CreateRecordResponse {
  recordItem: RecordItem;
  submissionId: string;
}

export const recordItemApi = {
  list: async (params?: RecordItemListParams): Promise<RecordItemListResult> => {
    return api.get<RecordItemListResult>('/forms/records', { params });
  },

  get: async (id: string): Promise<FullRecordResponse> => {
    return api.get<FullRecordResponse>(`/forms/records/${id}`);
  },

  create: async (payload: CreateRecordPayload): Promise<CreateRecordResponse> => {
    return api.post<CreateRecordResponse>('/forms/records', payload);
  },

  updateStatus: async (id: string, status: RecordItemStatus): Promise<RecordItem> => {
    return api.patch<RecordItem>(`/forms/records/${id}/status`, { status });
  },

  assign: async (id: string, assigneeId: string, assigneeName?: string): Promise<RecordItem> => {
    return api.patch<RecordItem>(`/forms/records/${id}/assignee`, { assigneeId, assigneeName });
  },

  listDrafts: async (): Promise<{ items: RecordItem[] }> => {
    return api.get<{ items: RecordItem[] }>('/forms/records/drafts/mine');
  },

  updateDraft: async (id: string, payload: UpdateDraftPayload): Promise<RecordItem> => {
    return api.patch<RecordItem>(`/forms/records/drafts/${id}`, payload);
  },

  deleteDraft: async (id: string): Promise<void> => {
    return api.delete(`/forms/records/drafts/${id}`);
  },
};
