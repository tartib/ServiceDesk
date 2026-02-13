import { FormTemplate, IFormTemplateDocument } from '../../core/entities/FormTemplate';
import { ISmartField, IConditionalRule, IValidationRule, IBusinessRule, IWorkflowConfig, IApprovalConfig, FormLayoutType, IFormSection } from '../../core/types/smart-forms.types';
import { FormFieldService } from './FormFieldService';
import { FormRuleService } from './FormRuleService';
import { FormWorkflowService } from './FormWorkflowService';
import { FormAccessService } from './FormAccessService';
import ApiError from '../../utils/ApiError';
import logger from '../../utils/logger';

export interface CreateFormTemplateDTO {
  name: string;
  name_ar: string;
  description?: string;
  description_ar?: string;
  category: string;
  icon?: string;
  fields?: ISmartField[];
  layout?: {
    type: FormLayoutType;
    sections?: IFormSection[];
  };
  settings?: Record<string, any>;
  access?: Record<string, any>;
  created_by: string;
  site_id?: string;
}

export interface UpdateFormTemplateDTO {
  name?: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  category?: string;
  icon?: string;
  fields?: ISmartField[];
  layout?: {
    type?: FormLayoutType;
    sections?: IFormSection[];
  };
  conditional_rules?: IConditionalRule[];
  validation_rules?: IValidationRule[];
  workflow?: IWorkflowConfig;
  approval?: IApprovalConfig;
  assignment_rules?: Record<string, unknown>[];
  business_rules?: IBusinessRule[];
  settings?: Record<string, unknown>;
  access?: Record<string, unknown>;
  updated_by: string;
}

export class FormTemplateService {
  private fieldService: FormFieldService;
  private ruleService: FormRuleService;
  private workflowService: FormWorkflowService;
  private accessService: FormAccessService;

  constructor() {
    this.fieldService = new FormFieldService();
    this.ruleService = new FormRuleService();
    this.workflowService = new FormWorkflowService();
    this.accessService = new FormAccessService();
  }

  async createTemplate(data: CreateFormTemplateDTO): Promise<IFormTemplateDocument> {
    const name = (data.name || '').trim();
    const name_ar = (data.name_ar || name || '').trim();
    const category = (data.category || 'general').trim();

    if (!name) {
      throw new ApiError(400, 'Name is required');
    }

    const template = new FormTemplate({
      name: name,
      name_ar: name_ar || name,
      description: data.description,
      description_ar: data.description_ar,
      category: category,
      icon: data.icon,
      fields: data.fields || [],
      layout: data.layout || { type: 'SINGLE_COLUMN' },
      conditional_rules: [],
      validation_rules: [],
      assignment_rules: [],
      business_rules: [],
      settings: {
        allow_draft: true,
        allow_attachments: true,
        max_attachments: 10,
        allowed_file_types: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg'],
        max_file_size_mb: 10,
        require_signature: false,
        enable_geolocation: false,
        ...data.settings,
      },
      access: {
        available_to: [],
        requires_authentication: true,
        ...data.access,
      },
      created_by: data.created_by,
      site_id: data.site_id,
      is_published: false,
      version: 1,
    });

    await template.save();
    logger.info(`Template created: ${template._id} by user ${data.created_by}`);
    return template;
  }

  async updateTemplate(
    formId: string,
    data: UpdateFormTemplateDTO
  ): Promise<IFormTemplateDocument | null> {
    const template = await FormTemplate.findByFormId(formId);
    if (!template) {
      throw new ApiError(404, 'Form template not found');
    }

    if (template.is_published) {
      throw new ApiError(400, 'Cannot update published template. Create a new version instead.');
    }

    if (data.name !== undefined) template.name = data.name;
    if (data.name_ar !== undefined) template.name_ar = data.name_ar;
    if (data.description !== undefined) template.description = data.description;
    if (data.description_ar !== undefined) template.description_ar = data.description_ar;
    if (data.category !== undefined) template.category = data.category;
    if (data.icon !== undefined) template.icon = data.icon;
    if (data.layout !== undefined) {
      template.layout = {
        type: data.layout.type || template.layout.type,
        sections: data.layout.sections !== undefined ? data.layout.sections : template.layout.sections,
      };
    }
    if (data.settings !== undefined) {
      template.settings = { ...template.settings, ...data.settings };
    }
    if (data.access !== undefined) {
      template.access = { ...template.access, ...data.access };
    }

    template.updated_by = data.updated_by;
    await template.save();

    logger.info(`Template ${formId} updated by user ${data.updated_by}`);
    return template;
  }

  async deleteTemplate(formId: string): Promise<boolean> {
    const template = await FormTemplate.findByFormId(formId);
    if (!template) {
      throw new ApiError(404, 'Form template not found');
    }

    await FormTemplate.deleteOne({ form_id: formId });
    logger.info(`Template ${formId} deleted`);
    return true;
  }

  async getTemplate(formId: string): Promise<IFormTemplateDocument | null> {
    return FormTemplate.findByFormId(formId);
  }

  async listTemplates(category?: string, limit: number = 50, skip: number = 0): Promise<IFormTemplateDocument[]> {
    const query = category ? { category } : {};
    return FormTemplate.find(query).limit(limit).skip(skip);
  }

  async addField(
    formId: string,
    field: ISmartField,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    return this.fieldService.addField(formId, field, userId);
  }

  async updateField(
    formId: string,
    fieldId: string,
    field: Partial<ISmartField>,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    return this.fieldService.updateField(formId, fieldId, field, userId);
  }

  async deleteField(
    formId: string,
    fieldId: string,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    return this.fieldService.deleteField(formId, fieldId, userId);
  }

  async reorderFields(
    formId: string,
    fieldIds: string[],
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    return this.fieldService.reorderFields(formId, fieldIds, userId);
  }

  async addConditionalRule(
    formId: string,
    rule: IConditionalRule,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    return this.ruleService.addConditionalRule(formId, rule, userId);
  }

  async updateConditionalRule(
    formId: string,
    ruleId: string,
    rule: Partial<IConditionalRule>,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    return this.ruleService.updateConditionalRule(formId, ruleId, rule, userId);
  }

  async deleteConditionalRule(
    formId: string,
    ruleId: string,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    return this.ruleService.deleteConditionalRule(formId, ruleId, userId);
  }

  async addValidationRule(
    formId: string,
    rule: IValidationRule,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    return this.ruleService.addValidationRule(formId, rule, userId);
  }

  async updateValidationRule(
    formId: string,
    ruleId: string,
    rule: Partial<IValidationRule>,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    return this.ruleService.updateValidationRule(formId, ruleId, rule, userId);
  }

  async deleteValidationRule(
    formId: string,
    ruleId: string,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    return this.ruleService.deleteValidationRule(formId, ruleId, userId);
  }

  async addBusinessRule(
    formId: string,
    rule: IBusinessRule,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    return this.ruleService.addBusinessRule(formId, rule, userId);
  }

  async updateBusinessRule(
    formId: string,
    ruleId: string,
    rule: Partial<IBusinessRule>,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    return this.ruleService.updateBusinessRule(formId, ruleId, rule, userId);
  }

  async deleteBusinessRule(
    formId: string,
    ruleId: string,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    return this.ruleService.deleteBusinessRule(formId, ruleId, userId);
  }

  async setWorkflow(
    formId: string,
    workflow: IWorkflowConfig,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    return this.workflowService.setWorkflow(formId, workflow, userId);
  }

  async updateWorkflow(
    formId: string,
    workflow: Partial<IWorkflowConfig>,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    return this.workflowService.updateWorkflow(formId, workflow, userId);
  }

  async removeWorkflow(
    formId: string,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    return this.workflowService.removeWorkflow(formId, userId);
  }

  async setApprovalConfig(
    formId: string,
    approval: IApprovalConfig,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    return this.workflowService.setApprovalConfig(formId, approval, userId);
  }

  async updateApprovalConfig(
    formId: string,
    approval: Partial<IApprovalConfig>,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    return this.workflowService.updateApprovalConfig(formId, approval, userId);
  }

  async removeApprovalConfig(
    formId: string,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    return this.workflowService.removeApprovalConfig(formId, userId);
  }

  async publishTemplate(
    formId: string,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    return this.accessService.publishTemplate(formId, userId);
  }

  async unpublishTemplate(
    formId: string,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    return this.accessService.unpublishTemplate(formId, userId);
  }

  async createVersion(
    formId: string,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    return this.accessService.createVersion(formId, userId);
  }

  async setAccess(
    formId: string,
    availableTo: string[],
    requiresAuthentication: boolean,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    return this.accessService.setAccess(formId, availableTo, requiresAuthentication, userId);
  }

  async canAccess(
    formId: string,
    userId: string
  ): Promise<boolean> {
    return this.accessService.canAccess(formId, userId);
  }

  async getAccessInfo(
    formId: string
  ): Promise<{ availableTo: string[]; requiresAuthentication: boolean } | null> {
    return this.accessService.getAccessInfo(formId);
  }
}

export const formTemplateService = new FormTemplateService();
