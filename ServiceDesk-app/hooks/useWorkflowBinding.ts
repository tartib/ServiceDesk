/**
 * useWorkflowBinding — Canonical React Query hooks for Workflow Binding
 *
 * These hooks expose the form-to-workflow binding API (ADR 001 Phase 3).
 * They back the WorkflowBindingPanel in FormDefinitionBuilder.
 *
 * Architecture:
 *   PREFERRED: import from '@/hooks/useWorkflowBinding'
 *   API layer:  lib/domains/forms/workflow-binding.ts
 *   Backend:    FormWorkflowBindingService.ts (advanced mode only)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowBindingApi, type BindWorkflowDTO } from '@/lib/domains/forms/workflow-binding';
import { formDefinitionKeys } from '@/lib/domains/forms/keys';

const bindingKeys = {
  status: (formId: string) => ['workflow-binding', formId] as const,
};

// ── Query ─────────────────────────────────────────────────────────────────────

/** Get current workflow binding status for a form definition. */
export function useWorkflowBindingStatus(formId: string, enabled = true) {
  return useQuery({
    queryKey: bindingKeys.status(formId),
    queryFn: () => workflowBindingApi.getStatus(formId),
    enabled: enabled && !!formId,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/** Bind a form to an advanced workflow definition. */
export function useBindWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ formId, dto }: { formId: string; dto: BindWorkflowDTO }) =>
      workflowBindingApi.bind(formId, dto),
    onSuccess: (_, { formId }) => {
      qc.invalidateQueries({ queryKey: bindingKeys.status(formId) });
      qc.invalidateQueries({ queryKey: formDefinitionKeys.detail(formId) });
    },
  });
}

/** Unbind advanced workflow — reverts form to simple mode. */
export function useUnbindWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formId: string) => workflowBindingApi.unbind(formId),
    onSuccess: (_, formId) => {
      qc.invalidateQueries({ queryKey: bindingKeys.status(formId) });
      qc.invalidateQueries({ queryKey: formDefinitionKeys.detail(formId) });
    },
  });
}

/** Disable all workflow for a form (sets mode to 'none'). */
export function useDisableWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formId: string) => workflowBindingApi.disable(formId),
    onSuccess: (_, formId) => {
      qc.invalidateQueries({ queryKey: bindingKeys.status(formId) });
      qc.invalidateQueries({ queryKey: formDefinitionKeys.detail(formId) });
    },
  });
}
