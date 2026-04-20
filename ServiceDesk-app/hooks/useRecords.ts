/**
 * useRecords — Platform Record Hooks
 *
 * React Query hooks for the platform's record (form submission) domain.
 * Use these instead of raw useSmartForms submission hooks in new code.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recordApi } from '@/lib/domains/forms/records';
import type { RecordListParams, RecordDetail } from '@/lib/domains/forms/records';

// ── Query keys ─────────────────────────────────────────────────────────────

export const recordKeys = {
  all: ['records'] as const,
  lists: () => [...recordKeys.all, 'list'] as const,
  list: (params: RecordListParams) => [...recordKeys.lists(), params] as const,
  details: () => [...recordKeys.all, 'detail'] as const,
  detail: (id: string) => [...recordKeys.details(), id] as const,
  mine: () => [...recordKeys.all, 'mine'] as const,
  pending: () => [...recordKeys.all, 'pending-approvals'] as const,
};

// ── List hooks ─────────────────────────────────────────────────────────────

/** List records with optional filtering/pagination */
export function useRecords(params: RecordListParams = {}) {
  return useQuery({
    queryKey: recordKeys.list(params),
    queryFn: () => recordApi.list(params),
  });
}

/** Records submitted by the current user */
export function useMyRecords() {
  return useQuery({
    queryKey: recordKeys.mine(),
    queryFn: () => recordApi.mine(),
  });
}

/** Records pending the current user's approval */
export function usePendingApprovals() {
  return useQuery({
    queryKey: recordKeys.pending(),
    queryFn: () => recordApi.pendingApprovals(),
  });
}

// ── Detail hook ────────────────────────────────────────────────────────────

/** Get a single record by ID */
export function useRecord(id: string, enabled = true) {
  return useQuery({
    queryKey: recordKeys.detail(id),
    queryFn: () => recordApi.get(id),
    enabled: enabled && !!id,
  });
}

// ── Mutation hooks ─────────────────────────────────────────────────────────

/** Submit a new record */
export function useCreateRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: recordApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recordKeys.lists() });
      qc.invalidateQueries({ queryKey: recordKeys.mine() });
    },
  });
}

/** Approve a record */
export function useApproveRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approverId, comment }: { id: string; approverId: string; comment?: string }) =>
      recordApi.approve(id, approverId, comment),
    onSuccess: (updated: RecordDetail) => {
      qc.setQueryData(recordKeys.detail(updated.id), updated);
      qc.invalidateQueries({ queryKey: recordKeys.lists() });
      qc.invalidateQueries({ queryKey: recordKeys.pending() });
    },
  });
}

/** Reject a record */
export function useRejectRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approverId, reason }: { id: string; approverId: string; reason: string }) =>
      recordApi.reject(id, approverId, reason),
    onSuccess: (updated: RecordDetail) => {
      qc.setQueryData(recordKeys.detail(updated.id), updated);
      qc.invalidateQueries({ queryKey: recordKeys.lists() });
      qc.invalidateQueries({ queryKey: recordKeys.pending() });
    },
  });
}

/** Cancel a record */
export function useCancelRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      recordApi.cancel(id, reason),
    onSuccess: (updated: RecordDetail) => {
      qc.setQueryData(recordKeys.detail(updated.id), updated);
      qc.invalidateQueries({ queryKey: recordKeys.lists() });
    },
  });
}

/** Add a comment to a record */
export function useAddRecordComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, text, isPrivate }: { id: string; text: string; isPrivate?: boolean }) =>
      recordApi.addComment(id, text, isPrivate),
    onSuccess: (updated: RecordDetail) => {
      qc.setQueryData(recordKeys.detail(updated.id), updated);
    },
  });
}
