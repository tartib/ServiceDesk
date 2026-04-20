/**
 * FormWorkflowBindingService — Platform Workflow Binding (Phase 3)
 *
 * Links a FormDefinition to a WorkflowDefinition from the workflow-engine module.
 * This is the "advanced mode" binding and coexists with the legacy FormWorkflowService.
 *
 * Architecture rules (ADR 001):
 *   - FormWorkflowService (simple/legacy) — FROZEN, not extended.
 *   - FormWorkflowBindingService (advanced) — new capability, uses this service.
 *   - Dual-track: a form's `workflow_mode` field determines which path is active.
 *
 * Usage:
 *   - workflow_mode = 'simple'   → FormWorkflowService handles it (existing behaviour)
 *   - workflow_mode = 'advanced' → FormWorkflowBindingService binds to workflow-engine
 *   - workflow_mode = 'none'     → no workflow
 */

import { FormTemplate } from '../../../core/entities/FormTemplate';
import type { IFormTemplateDocument } from '../../../core/entities/FormTemplate';

export interface BindWorkflowDTO {
  /** ID of the WorkflowDefinition from modules/workflow-engine */
  workflowDefinitionId: string;
  /** User performing the operation */
  updatedBy: string;
}

export interface UnbindWorkflowDTO {
  updatedBy: string;
}

export interface WorkflowBindingStatus {
  formId: string;
  workflowMode: 'simple' | 'advanced' | 'none';
  workflowDefinitionId?: string;
  isBound: boolean;
}

class FormWorkflowBindingService {
  /**
   * Bind a form definition to an advanced workflow definition.
   * Sets workflow_mode = 'advanced' and stores the workflow_definition_id.
   */
  async bindWorkflow(
    formId: string,
    dto: BindWorkflowDTO,
  ): Promise<IFormTemplateDocument> {
    const template = await this.findOrThrow(formId);

    if (template.is_published) {
      throw new Error(
        'Cannot change workflow binding on a published form. Unpublish it first.',
      );
    }

    template.workflow_definition_id = dto.workflowDefinitionId;
    template.workflow_mode = 'advanced';
    template.updated_by = dto.updatedBy;

    await template.save();
    return template;
  }

  /**
   * Unbind an advanced workflow from a form definition.
   * Reverts the form to 'simple' mode (FormWorkflowService).
   */
  async unbindWorkflow(
    formId: string,
    dto: UnbindWorkflowDTO,
  ): Promise<IFormTemplateDocument> {
    const template = await this.findOrThrow(formId);

    if (template.is_published) {
      throw new Error(
        'Cannot change workflow binding on a published form. Unpublish it first.',
      );
    }

    template.workflow_definition_id = undefined;
    template.workflow_mode = 'simple';
    template.updated_by = dto.updatedBy;

    await template.save();
    return template;
  }

  /**
   * Set a form to 'none' mode — no workflow will execute on submission.
   */
  async disableWorkflow(
    formId: string,
    updatedBy: string,
  ): Promise<IFormTemplateDocument> {
    const template = await this.findOrThrow(formId);

    if (template.is_published) {
      throw new Error(
        'Cannot change workflow binding on a published form. Unpublish it first.',
      );
    }

    template.workflow_definition_id = undefined;
    template.workflow_mode = 'none';
    template.updated_by = updatedBy;

    await template.save();
    return template;
  }

  /**
   * Get the current workflow binding status for a form.
   */
  async getBindingStatus(formId: string): Promise<WorkflowBindingStatus> {
    const template = await this.findOrThrow(formId);
    return {
      formId: template.form_id,
      workflowMode: template.workflow_mode ?? 'simple',
      workflowDefinitionId: template.workflow_definition_id,
      isBound: template.workflow_mode === 'advanced' && !!template.workflow_definition_id,
    };
  }

  /**
   * List all form definitions bound to a specific workflow definition.
   */
  async getFormsByWorkflowDefinition(
    workflowDefinitionId: string,
  ): Promise<IFormTemplateDocument[]> {
    return FormTemplate.find({ workflow_definition_id: workflowDefinitionId });
  }

  private async findOrThrow(formId: string): Promise<IFormTemplateDocument> {
    let template = await FormTemplate.findByFormId(formId);
    if (!template) {
      try {
        template = await FormTemplate.findById(formId);
      } catch {
        // Invalid ObjectId, ignore
      }
    }
    if (!template) {
      throw new Error(`Form definition not found: ${formId}`);
    }
    return template;
  }
}

export const formWorkflowBindingService = new FormWorkflowBindingService();
export default formWorkflowBindingService;
