/**
 * Forms Platform — Workflow Binding API
 *
 * Typed wrappers around the /api/v2/forms/templates/:id/workflow-binding endpoints.
 * Corresponds to FormWorkflowBindingService on the backend (ADR 001 Phase 3).
 *
 * Modes:
 *   none     → no workflow on submission
 *   simple   → legacy FormWorkflowService (frozen)
 *   advanced → canonical workflow-engine binding (this service)
 */

import api from '@/lib/axios';

export type WorkflowMode = 'none' | 'simple' | 'advanced';

export interface WorkflowBindingStatus {
  formId: string;
  workflowMode: WorkflowMode;
  workflowDefinitionId?: string;
  isBound: boolean;
}

export interface BindWorkflowDTO {
  workflowDefinitionId: string;
}

export const workflowBindingApi = {
  /** Get current binding status for a form */
  getStatus: async (formId: string): Promise<WorkflowBindingStatus> => {
    const raw = await api.get<WorkflowBindingStatus>(
      `/forms/templates/${formId}/workflow-binding`,
    );
    return raw;
  },

  /** Bind a form to an advanced workflow definition */
  bind: async (formId: string, dto: BindWorkflowDTO): Promise<WorkflowBindingStatus> => {
    const raw = await api.post<WorkflowBindingStatus>(
      `/forms/templates/${formId}/workflow-binding`,
      dto,
    );
    return raw;
  },

  /** Unbind advanced workflow — reverts to simple mode */
  unbind: async (formId: string): Promise<WorkflowBindingStatus> => {
    const raw = await api.delete<WorkflowBindingStatus>(
      `/forms/templates/${formId}/workflow-binding`,
    );
    return raw;
  },

  /** Set workflow mode to none — disables all workflow on submission */
  disable: async (formId: string): Promise<WorkflowBindingStatus> => {
    const raw = await api.post<WorkflowBindingStatus>(
      `/forms/templates/${formId}/workflow-binding/disable`,
    );
    return raw;
  },
};
