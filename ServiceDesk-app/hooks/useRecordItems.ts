/**
 * useRecordItems — React Query hooks for the new RecordItem model
 *
 * Complements useRecords (which wraps FormSubmission-based legacy endpoints).
 * Use these hooks for the unified record flow (Section 1 Core).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  recordItemApi,
  type RecordItemListParams,
} from '@/lib/domains/forms/record-items';
import type {
  RecordItem,
  RecordItemStatus,
  CreateRecordPayload,
  UpdateDraftPayload,
} from '@/types';

export const recordItemKeys = {
  all: ['record-items'] as const,
  lists: () => [...recordItemKeys.all, 'list'] as const,
  list: (params: RecordItemListParams) => [...recordItemKeys.lists(), params] as const,
  details: () => [...recordItemKeys.all, 'detail'] as const,
  detail: (id: string) => [...recordItemKeys.details(), id] as const,
  drafts: () => [...recordItemKeys.all, 'drafts'] as const,
};

/** List record items with filtering and pagination */
export function useRecordItems(params: RecordItemListParams = {}) {
  return useQuery({
    queryKey: recordItemKeys.list(params),
    queryFn: () => recordItemApi.list(params),
  });
}

/** Get a full record (RecordItem + detail) by ID */
export function useRecordItem(id: string, enabled = true) {
  return useQuery({
    queryKey: recordItemKeys.detail(id),
    queryFn: () => recordItemApi.get(id),
    enabled: enabled && !!id,
  });
}

/** List user's drafts */
export function useMyDrafts() {
  return useQuery({
    queryKey: recordItemKeys.drafts(),
    queryFn: () => recordItemApi.listDrafts(),
  });
}

/** Create a new record (RecordItem + FormSubmission) */
export function useCreateRecordItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRecordPayload) => recordItemApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recordItemKeys.lists() });
      qc.invalidateQueries({ queryKey: recordItemKeys.drafts() });
    },
  });
}

/** Update record status */
export function useUpdateRecordItemStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: RecordItemStatus }) =>
      recordItemApi.updateStatus(id, status),
    onSuccess: (updated: RecordItem) => {
      qc.setQueryData(recordItemKeys.detail(updated._id), (old: any) =>
        old ? { ...old, recordItem: updated } : old,
      );
      qc.invalidateQueries({ queryKey: recordItemKeys.lists() });
    },
  });
}

/** Assign a record to a user */
export function useAssignRecordItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, assigneeId, assigneeName }: { id: string; assigneeId: string; assigneeName?: string }) =>
      recordItemApi.assign(id, assigneeId, assigneeName),
    onSuccess: (updated: RecordItem) => {
      qc.setQueryData(recordItemKeys.detail(updated._id), (old: any) =>
        old ? { ...old, recordItem: updated } : old,
      );
      qc.invalidateQueries({ queryKey: recordItemKeys.lists() });
    },
  });
}

/** Update a draft (autosave) */
export function useUpdateDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDraftPayload }) =>
      recordItemApi.updateDraft(id, payload),
    onSuccess: (updated: RecordItem) => {
      qc.setQueryData(recordItemKeys.detail(updated._id), (old: any) =>
        old ? { ...old, recordItem: updated } : old,
      );
    },
  });
}

/** Delete a draft */
export function useDeleteDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recordItemApi.deleteDraft(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recordItemKeys.drafts() });
      qc.invalidateQueries({ queryKey: recordItemKeys.lists() });
    },
  });
}
