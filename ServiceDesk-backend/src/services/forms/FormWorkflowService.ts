import { FormTemplate, IFormTemplateDocument } from '../../core/entities/FormTemplate';
import { IWorkflowConfig, IApprovalConfig } from '../../core/types/smart-forms.types';
import { IFormWorkflowService } from './interfaces/IFormWorkflowService';
import ApiError from '../../utils/ApiError';
import logger from '../../utils/logger';

export class FormWorkflowService implements IFormWorkflowService {
  async setWorkflow(
    formId: string,
    workflow: IWorkflowConfig,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    const template = await FormTemplate.findByFormId(formId);
    if (!template) {
      throw new ApiError(404, 'Form template not found');
    }

    if (template.is_published) {
      throw new ApiError(400, 'Cannot modify published template. Create a new version instead.');
    }

    const validation = this.validateWorkflow(workflow);
    if (!validation.valid) {
      throw new ApiError(400, `Invalid workflow: ${validation.errors.join(', ')}`);
    }

    template.workflow = workflow;
    template.updated_by = userId;
    await template.save();

    logger.info(`Workflow set for template ${formId} by user ${userId}`);
    return template;
  }

  async updateWorkflow(
    formId: string,
    workflow: Partial<IWorkflowConfig>,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    const template = await FormTemplate.findByFormId(formId);
    if (!template) {
      throw new ApiError(404, 'Form template not found');
    }

    if (template.is_published) {
      throw new ApiError(400, 'Cannot modify published template. Create a new version instead.');
    }

    if (!template.workflow) {
      throw new ApiError(400, 'No workflow configured for this template');
    }

    const updatedWorkflow = { ...template.workflow, ...workflow };
    const validation = this.validateWorkflow(updatedWorkflow);
    if (!validation.valid) {
      throw new ApiError(400, `Invalid workflow: ${validation.errors.join(', ')}`);
    }

    template.workflow = updatedWorkflow;
    template.updated_by = userId;
    await template.save();

    logger.info(`Workflow updated for template ${formId} by user ${userId}`);
    return template;
  }

  async removeWorkflow(
    formId: string,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    const template = await FormTemplate.findByFormId(formId);
    if (!template) {
      throw new ApiError(404, 'Form template not found');
    }

    if (template.is_published) {
      throw new ApiError(400, 'Cannot modify published template. Create a new version instead.');
    }

    template.workflow = undefined;
    template.updated_by = userId;
    await template.save();

    logger.info(`Workflow removed from template ${formId} by user ${userId}`);
    return template;
  }

  async setApprovalConfig(
    formId: string,
    approval: IApprovalConfig,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    const template = await FormTemplate.findByFormId(formId);
    if (!template) {
      throw new ApiError(404, 'Form template not found');
    }

    if (template.is_published) {
      throw new ApiError(400, 'Cannot modify published template. Create a new version instead.');
    }

    template.approval = approval;
    template.updated_by = userId;
    await template.save();

    logger.info(`Approval config set for template ${formId} by user ${userId}`);
    return template;
  }

  async updateApprovalConfig(
    formId: string,
    approval: Partial<IApprovalConfig>,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    const template = await FormTemplate.findByFormId(formId);
    if (!template) {
      throw new ApiError(404, 'Form template not found');
    }

    if (template.is_published) {
      throw new ApiError(400, 'Cannot modify published template. Create a new version instead.');
    }

    if (!template.approval) {
      throw new ApiError(400, 'No approval config configured for this template');
    }

    template.approval = { ...template.approval, ...approval };
    template.updated_by = userId;
    await template.save();

    logger.info(`Approval config updated for template ${formId} by user ${userId}`);
    return template;
  }

  async removeApprovalConfig(
    formId: string,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    const template = await FormTemplate.findByFormId(formId);
    if (!template) {
      throw new ApiError(404, 'Form template not found');
    }

    if (template.is_published) {
      throw new ApiError(400, 'Cannot modify published template. Create a new version instead.');
    }

    template.approval = undefined;
    template.updated_by = userId;
    await template.save();

    logger.info(`Approval config removed from template ${formId} by user ${userId}`);
    return template;
  }

  validateWorkflow(workflow: IWorkflowConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!workflow) {
      return { valid: false, errors: ['Workflow is required'] };
    }

    if (!workflow.steps || workflow.steps.length === 0) {
      errors.push('Workflow must have at least one step');
    }

    if (workflow.steps) {
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        if (!step.step_id) {
          errors.push(`Step ${i}: step_id is required`);
        }
        if (!step.name) {
          errors.push(`Step ${i}: name is required`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
