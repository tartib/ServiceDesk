/**
 * useRequestTypes — React Query hooks for RequestType CRUD
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  requestTypeApi,
  type RequestTypeListParams,
  type CreateRequestTypePayload,
  type UpdateRequestTypePayload,
} from '@/lib/domains/forms/request-types';
import type { RequestType, WorkspaceType } from '@/types';

export const requestTypeKeys = {
  all: ['request-types'] as const,
  lists: () => [...requestTypeKeys.all, 'list'] as const,
  list: (params: RequestTypeListParams) => [...requestTypeKeys.lists(), params] as const,
  details: () => [...requestTypeKeys.all, 'detail'] as const,
  detail: (id: string) => [...requestTypeKeys.details(), id] as const,
};

export function useRequestTypes(params: RequestTypeListParams = {}) {
  return useQuery({
    queryKey: requestTypeKeys.list(params),
    queryFn: () => requestTypeApi.list(params),
  });
}

export function useRequestTypesByWorkspace(workspaceType?: WorkspaceType) {
  return useQuery({
    queryKey: requestTypeKeys.list({ workspaceType, isActive: true }),
    queryFn: () => requestTypeApi.list({ workspaceType, isActive: true }),
    enabled: !!workspaceType,
  });
}

export function useRequestType(id: string, enabled = true) {
  return useQuery({
    queryKey: requestTypeKeys.detail(id),
    queryFn: () => requestTypeApi.get(id),
    enabled: enabled && !!id,
  });
}

export function useCreateRequestType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRequestTypePayload) => requestTypeApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: requestTypeKeys.lists() });
    },
  });
}

export function useUpdateRequestType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRequestTypePayload }) =>
      requestTypeApi.update(id, payload),
    onSuccess: (updated: RequestType) => {
      qc.setQueryData(requestTypeKeys.detail(updated._id), updated);
      qc.invalidateQueries({ queryKey: requestTypeKeys.lists() });
    },
  });
}

export function useDeleteRequestType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => requestTypeApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: requestTypeKeys.lists() });
    },
  });
}
