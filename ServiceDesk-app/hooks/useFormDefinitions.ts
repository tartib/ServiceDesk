/**
 * useFormDefinitions — Canonical React Query hooks for Form Definitions
 *
 * These hooks replace the legacy hooks from `@/hooks/useSmartForms`.
 * They are backed by `lib/domains/forms/api.ts` (formDefinitionApi) and
 * use the canonical `formDefinitionKeys` query key factory.
 *
 * Architecture (ADR 001):
 *   PREFERRED: import from '@/hooks/useFormDefinitions'
 *   DEPRECATED: import from '@/hooks/useSmartForms' (template hooks only)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formDefinitionApi } from '@/lib/domains/forms/api';
import { formDefinitionKeys } from '@/lib/domains/forms/keys';
import type {
  FormDefinitionListParams,
  CreateFormDefinitionDTO,
  UpdateFormDefinitionDTO,
} from '@/lib/domains/forms/types';

// ── Queries ───────────────────────────────────────────────────────────────────

/** List form definitions (paginated, filterable). */
export function useFormDefinitions(params: FormDefinitionListParams = {}) {
  return useQuery({
    queryKey: formDefinitionKeys.list(params),
    queryFn: () => formDefinitionApi.list(params),
  });
}

/** Get a single form definition by id. */
export function useFormDefinition(id: string, enabled = true) {
  return useQuery({
    queryKey: formDefinitionKeys.detail(id),
    queryFn: () => formDefinitionApi.get(id),
    enabled: enabled && !!id,
  });
}

/** List available form categories. */
export function useFormDefinitionCategories() {
  return useQuery({
    queryKey: formDefinitionKeys.categories(),
    queryFn: () => formDefinitionApi.categories(),
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/** Create a new form definition. */
export function useCreateFormDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateFormDefinitionDTO) => formDefinitionApi.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: formDefinitionKeys.lists() });
    },
  });
}

/** Update an existing form definition. */
export function useUpdateFormDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateFormDefinitionDTO }) =>
      formDefinitionApi.update(id, dto),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: formDefinitionKeys.detail(id) });
      qc.invalidateQueries({ queryKey: formDefinitionKeys.lists() });
    },
  });
}

/** Delete a form definition. */
export function useDeleteFormDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => formDefinitionApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: formDefinitionKeys.lists() });
    },
  });
}

/** Publish a form definition. */
export function usePublishFormDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => formDefinitionApi.publish(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: formDefinitionKeys.detail(id) });
      qc.invalidateQueries({ queryKey: formDefinitionKeys.lists() });
      qc.invalidateQueries({ queryKey: formDefinitionKeys.published() });
    },
  });
}

/** Unpublish a form definition. */
export function useUnpublishFormDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => formDefinitionApi.unpublish(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: formDefinitionKeys.detail(id) });
      qc.invalidateQueries({ queryKey: formDefinitionKeys.lists() });
      qc.invalidateQueries({ queryKey: formDefinitionKeys.published() });
    },
  });
}
