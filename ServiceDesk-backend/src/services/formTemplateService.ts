/**
 * Form Template Service - خدمة قوالب النماذج
 * Smart Forms System
 */

import { FormTemplate, IFormTemplateDocument } from '../core/entities/FormTemplate';
import {
  IFormTemplate,
  ISmartField,
  IConditionalRule,
  IValidationRule,
  IWorkflowConfig,
  IApprovalConfig,
  IAssignmentRule,
  IBusinessRule,
  FormLayoutType,
} from '../core/types/smart-forms.types';

// ============================================
// TYPES - الأنواع
// ============================================

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
    sections?: any[];
  };
  settings?: Partial<IFormTemplate['settings']>;
  access?: Partial<IFormTemplate['access']>;
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
    type: FormLayoutType;
    sections?: any[];
  };
  conditional_rules?: IConditionalRule[];
  validation_rules?: IValidationRule[];
  workflow?: IWorkflowConfig;
  approval?: IApprovalConfig;
  assignment_rules?: IAssignmentRule[];
  business_rules?: IBusinessRule[];
  settings?: Partial<IFormTemplate['settings']>;
  access?: Partial<IFormTemplate['access']>;
  updated_by: string;
}

export interface FormTemplateListOptions {
  page?: number;
  limit?: number;
  category?: string;
  is_published?: boolean;
  search?: string;
  site_id?: string;
  created_by?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface FormTemplateListResult {
  templates: IFormTemplateDocument[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: {
    field: string;
    message: string;
    message_ar: string;
  }[];
}

// ============================================
// SERVICE - الخدمة
// ============================================

class FormTemplateService {
  /**
   * البحث عن قالب بواسطة form_id أو _id
   */
  private async findTemplate(id: string): Promise<IFormTemplateDocument | null> {
    // Try form_id first
    let template = await FormTemplate.findByFormId(id);
    if (!template) {
      // Fallback to MongoDB _id
      try {
        template = await FormTemplate.findById(id);
      } catch {
        // Invalid ObjectId format, ignore
      }
    }
    return template;
  }

  /**
   * إنشاء قالب نموذج جديد
   */
  async createTemplate(data: CreateFormTemplateDTO): Promise<IFormTemplateDocument> {
    // Trim and validate required fields
    const name = (data.name || '').trim();
    const name_ar = (data.name_ar || name || '').trim();
    const category = (data.category || 'general').trim();

    if (!name) {
      throw new Error('Name is required');
    }

    // Create template
    const template = new FormTemplate({
      name: name,
      name_ar: name_ar || name,
      description: data.description,
      description_ar: data.description_ar,
      category: category,
      icon: data.icon,
      fields: data.fields || [],
      layout: data.layout || { type: FormLayoutType.SINGLE_COLUMN },
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
    return template;
  }

  /**
   * تحديث قالب نموذج
   */
  async updateTemplate(
    formId: string,
    data: UpdateFormTemplateDTO
  ): Promise<IFormTemplateDocument | null> {
    const template = await this.findTemplate(formId);

    if (!template) {
      throw new Error('Form template not found');
    }

    // Check if published - create new version instead
    if (template.is_published) {
      throw new Error('Cannot update published template. Create a new version instead.');
    }

    // Update fields
    if (data.name !== undefined) template.name = data.name;
    if (data.name_ar !== undefined) template.name_ar = data.name_ar;
    if (data.description !== undefined) template.description = data.description;
    if (data.description_ar !== undefined) template.description_ar = data.description_ar;
    if (data.category !== undefined) template.category = data.category;
    if (data.icon !== undefined) template.icon = data.icon;
    if (data.fields !== undefined) template.fields = data.fields;
    if (data.layout !== undefined) template.layout = data.layout;
    if (data.conditional_rules !== undefined) template.conditional_rules = data.conditional_rules;
    if (data.validation_rules !== undefined) template.validation_rules = data.validation_rules;
    if (data.workflow !== undefined) template.workflow = data.workflow;
    if (data.approval !== undefined) template.approval = data.approval;
    if (data.assignment_rules !== undefined) template.assignment_rules = data.assignment_rules;
    if (data.business_rules !== undefined) template.business_rules = data.business_rules;
    if (data.settings !== undefined) {
      template.settings = { ...template.settings, ...data.settings };
    }
    if (data.access !== undefined) {
      template.access = { ...template.access, ...data.access };
    }

    template.updated_by = data.updated_by;

    await template.save();
    return template;
  }

  /**
   * حذف قالب نموذج
   */
  async deleteTemplate(formId: string): Promise<boolean> {
    const template = await this.findTemplate(formId);

    if (!template) {
      throw new Error('Form template not found');
    }

    // Check if has submissions
    // TODO: Add check for submissions

    await FormTemplate.deleteOne({ _id: template._id });
    return true;
  }

  /**
   * الحصول على قالب نموذج بواسطة المعرف
   */
  async getTemplateById(formId: string): Promise<IFormTemplateDocument | null> {
    return this.findTemplate(formId);
  }

  /**
   * الحصول على قالب نموذج بواسطة ObjectId
   */
  async getTemplateByObjectId(id: string): Promise<IFormTemplateDocument | null> {
    return FormTemplate.findById(id);
  }

  /**
   * قائمة قوالب النماذج
   */
  async listTemplates(options: FormTemplateListOptions = {}): Promise<FormTemplateListResult> {
    const {
      page = 1,
      limit = 20,
      category,
      is_published,
      search,
      site_id,
      created_by,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = options;

    const query: any = {};

    if (category) {
      query.category = category;
    }

    if (is_published !== undefined) {
      query.is_published = is_published;
    }

    if (site_id) {
      query.site_id = site_id;
    }

    if (created_by) {
      query.created_by = created_by;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { name_ar: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { description_ar: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await FormTemplate.countDocuments(query);
    const total_pages = Math.ceil(total / limit);

    const templates = await FormTemplate.find(query)
      .sort({ [sort_by]: sort_order === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      templates,
      total,
      page,
      limit,
      total_pages,
    };
  }

  /**
   * نشر قالب نموذج
   */
  async publishTemplate(formId: string, userId: string): Promise<IFormTemplateDocument | null> {
    const template = await this.findTemplate(formId);

    if (!template) {
      throw new Error('Form template not found');
    }

    // Validate template before publishing
    const validation = this.validateTemplate(template);
    if (!validation.valid) {
      throw new Error(`Template validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    template.is_published = true;
    template.published_at = new Date();
    template.updated_by = userId;

    await template.save();
    return template;
  }

  /**
   * إلغاء نشر قالب نموذج
   */
  async unpublishTemplate(formId: string, userId: string): Promise<IFormTemplateDocument | null> {
    const template = await this.findTemplate(formId);

    if (!template) {
      throw new Error('Form template not found');
    }

    template.is_published = false;
    template.updated_by = userId;

    await template.save();
    return template;
  }

  /**
   * نسخ قالب نموذج
   */
  async cloneTemplate(
    formId: string,
    newName: string,
    newNameAr: string,
    userId: string
  ): Promise<IFormTemplateDocument> {
    const original = await this.findTemplate(formId);

    if (!original) {
      throw new Error('Form template not found');
    }

    const clonedData = original.toObject();
    delete clonedData._id;
    delete clonedData.form_id;

    const cloned = new FormTemplate({
      ...clonedData,
      name: newName,
      name_ar: newNameAr,
      is_published: false,
      published_at: undefined,
      version: 1,
      created_by: userId,
      updated_by: undefined,
    });

    await cloned.save();
    return cloned;
  }

  /**
   * إنشاء نسخة جديدة من قالب منشور
   */
  async createNewVersion(formId: string, userId: string): Promise<IFormTemplateDocument> {
    const original = await this.findTemplate(formId);

    if (!original) {
      throw new Error('Form template not found');
    }

    const newVersionData = original.toObject();
    delete newVersionData._id;
    delete newVersionData.form_id;

    const newVersion = new FormTemplate({
      ...newVersionData,
      is_published: false,
      published_at: undefined,
      version: original.version + 1,
      created_by: userId,
      updated_by: undefined,
    });

    await newVersion.save();
    return newVersion;
  }

  /**
   * التحقق من صحة قالب النموذج
   */
  validateTemplate(template: IFormTemplateDocument): ValidationResult {
    const errors: ValidationResult['errors'] = [];

    // Check required fields
    if (!template.name) {
      errors.push({
        field: 'name',
        message: 'Name is required',
        message_ar: 'الاسم مطلوب',
      });
    }

    if (!template.name_ar) {
      errors.push({
        field: 'name_ar',
        message: 'Arabic name is required',
        message_ar: 'الاسم بالعربية مطلوب',
      });
    }

    if (!template.category) {
      errors.push({
        field: 'category',
        message: 'Category is required',
        message_ar: 'التصنيف مطلوب',
      });
    }

    // Check fields
    if (!template.fields || template.fields.length === 0) {
      errors.push({
        field: 'fields',
        message: 'At least one field is required',
        message_ar: 'يجب إضافة حقل واحد على الأقل',
      });
    }

    // Validate field IDs are unique
    if (template.fields) {
      const fieldIds = template.fields.map(f => f.field_id);
      const duplicates = fieldIds.filter((id, index) => fieldIds.indexOf(id) !== index);
      if (duplicates.length > 0) {
        errors.push({
          field: 'fields',
          message: `Duplicate field IDs: ${duplicates.join(', ')}`,
          message_ar: `معرفات حقول مكررة: ${duplicates.join(', ')}`,
        });
      }

      // Validate each field
      template.fields.forEach((field, index) => {
        if (!field.field_id) {
          errors.push({
            field: `fields[${index}].field_id`,
            message: 'Field ID is required',
            message_ar: 'معرف الحقل مطلوب',
          });
        }

        if (!field.label) {
          errors.push({
            field: `fields[${index}].label`,
            message: 'Field label is required',
            message_ar: 'عنوان الحقل مطلوب',
          });
        }

        if (!field.label_ar) {
          errors.push({
            field: `fields[${index}].label_ar`,
            message: 'Field Arabic label is required',
            message_ar: 'عنوان الحقل بالعربية مطلوب',
          });
        }
      });
    }

    // Validate workflow if exists
    if (template.workflow) {
      if (!template.workflow.steps || template.workflow.steps.length === 0) {
        errors.push({
          field: 'workflow.steps',
          message: 'Workflow must have at least one step',
          message_ar: 'يجب أن يحتوي سير العمل على خطوة واحدة على الأقل',
        });
      }

      if (!template.workflow.initial_step_id) {
        errors.push({
          field: 'workflow.initial_step_id',
          message: 'Initial step is required',
          message_ar: 'الخطوة الأولى مطلوبة',
        });
      }

      // Check initial step exists
      if (template.workflow.steps && template.workflow.initial_step_id) {
        const initialStep = template.workflow.steps.find(
          s => s.step_id === template.workflow!.initial_step_id
        );
        if (!initialStep) {
          errors.push({
            field: 'workflow.initial_step_id',
            message: 'Initial step not found in steps',
            message_ar: 'الخطوة الأولى غير موجودة في الخطوات',
          });
        }
      }

      // Check at least one final step
      if (template.workflow.steps) {
        const hasFinalStep = template.workflow.steps.some(s => s.is_final);
        if (!hasFinalStep) {
          errors.push({
            field: 'workflow.steps',
            message: 'Workflow must have at least one final step',
            message_ar: 'يجب أن يحتوي سير العمل على خطوة نهائية واحدة على الأقل',
          });
        }
      }
    }

    // Validate conditional rules
    if (template.conditional_rules) {
      template.conditional_rules.forEach((rule, index) => {
        // Check target fields exist
        rule.actions.forEach((action, actionIndex) => {
          if (action.target_field_id) {
            const fieldExists = template.fields?.some(
              f => f.field_id === action.target_field_id
            );
            if (!fieldExists) {
              errors.push({
                field: `conditional_rules[${index}].actions[${actionIndex}].target_field_id`,
                message: `Target field "${action.target_field_id}" not found`,
                message_ar: `الحقل المستهدف "${action.target_field_id}" غير موجود`,
              });
            }
          }
        });
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * الحصول على قوالب النماذج المنشورة
   */
  async getPublishedTemplates(siteId?: string): Promise<IFormTemplateDocument[]> {
    const query: any = { is_published: true };
    if (siteId) {
      query.$or = [{ site_id: siteId }, { site_id: { $exists: false } }];
    }
    return FormTemplate.find(query).sort({ category: 1, name: 1 });
  }

  /**
   * الحصول على قوالب النماذج حسب التصنيف
   */
  async getTemplatesByCategory(category: string, siteId?: string): Promise<IFormTemplateDocument[]> {
    const query: any = { category, is_published: true };
    if (siteId) {
      query.$or = [{ site_id: siteId }, { site_id: { $exists: false } }];
    }
    return FormTemplate.find(query).sort({ name: 1 });
  }

  /**
   * الحصول على التصنيفات المتاحة
   */
  async getCategories(siteId?: string): Promise<string[]> {
    const query: any = { is_published: true };
    if (siteId) {
      query.$or = [{ site_id: siteId }, { site_id: { $exists: false } }];
    }
    return FormTemplate.distinct('category', query);
  }

  /**
   * إضافة حقل إلى القالب
   */
  async addField(
    formId: string,
    field: ISmartField,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    const template = await this.findTemplate(formId);

    if (!template) {
      throw new Error('Form template not found');
    }

    if (template.is_published) {
      throw new Error('Cannot modify published template');
    }

    // Check for duplicate field ID
    const existingField = template.fields?.find(f => f.field_id === field.field_id);
    if (existingField) {
      throw new Error(`Field with ID "${field.field_id}" already exists`);
    }

    template.fields = template.fields || [];
    template.fields.push(field);
    template.updated_by = userId;

    await template.save();
    return template;
  }

  /**
   * تحديث حقل في القالب
   */
  async updateField(
    formId: string,
    fieldId: string,
    fieldData: Partial<ISmartField>,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    const template = await this.findTemplate(formId);

    if (!template) {
      throw new Error('Form template not found');
    }

    if (template.is_published) {
      throw new Error('Cannot modify published template');
    }

    const fieldIndex = template.fields?.findIndex(f => f.field_id === fieldId);
    if (fieldIndex === undefined || fieldIndex === -1) {
      throw new Error(`Field "${fieldId}" not found`);
    }

    template.fields![fieldIndex] = {
      ...template.fields![fieldIndex],
      ...fieldData,
      field_id: fieldId, // Prevent changing field ID
    };
    template.updated_by = userId;

    await template.save();
    return template;
  }

  /**
   * حذف حقل من القالب
   */
  async removeField(
    formId: string,
    fieldId: string,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    const template = await this.findTemplate(formId);

    if (!template) {
      throw new Error('Form template not found');
    }

    if (template.is_published) {
      throw new Error('Cannot modify published template');
    }

    template.fields = template.fields?.filter(f => f.field_id !== fieldId) || [];
    template.updated_by = userId;

    await template.save();
    return template;
  }

  /**
   * إعادة ترتيب الحقول
   */
  async reorderFields(
    formId: string,
    fieldOrders: { field_id: string; order: number }[],
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    const template = await this.findTemplate(formId);

    if (!template) {
      throw new Error('Form template not found');
    }

    if (template.is_published) {
      throw new Error('Cannot modify published template');
    }

    fieldOrders.forEach(({ field_id, order }) => {
      const field = template.fields?.find(f => f.field_id === field_id);
      if (field) {
        field.display.order = order;
      }
    });

    // Sort fields by order
    template.fields?.sort((a, b) => a.display.order - b.display.order);
    template.updated_by = userId;

    await template.save();
    return template;
  }

  /**
   * تحديث سير العمل
   */
  async updateWorkflow(
    formId: string,
    workflow: IWorkflowConfig,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    const template = await this.findTemplate(formId);

    if (!template) {
      throw new Error('Form template not found');
    }

    if (template.is_published) {
      throw new Error('Cannot modify published template');
    }

    template.workflow = workflow;
    template.updated_by = userId;

    await template.save();
    return template;
  }

  /**
   * تحديث تكوين الموافقات
   */
  async updateApproval(
    formId: string,
    approval: IApprovalConfig,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    const template = await this.findTemplate(formId);

    if (!template) {
      throw new Error('Form template not found');
    }

    if (template.is_published) {
      throw new Error('Cannot modify published template');
    }

    template.approval = approval;
    template.updated_by = userId;

    await template.save();
    return template;
  }

  /**
   * إضافة قاعدة شرطية
   */
  async addConditionalRule(
    formId: string,
    rule: IConditionalRule,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    const template = await this.findTemplate(formId);

    if (!template) {
      throw new Error('Form template not found');
    }

    if (template.is_published) {
      throw new Error('Cannot modify published template');
    }

    template.conditional_rules = template.conditional_rules || [];
    template.conditional_rules.push(rule);
    template.updated_by = userId;

    await template.save();
    return template;
  }

  /**
   * إضافة قاعدة تجارية
   */
  async addBusinessRule(
    formId: string,
    rule: IBusinessRule,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    const template = await this.findTemplate(formId);

    if (!template) {
      throw new Error('Form template not found');
    }

    if (template.is_published) {
      throw new Error('Cannot modify published template');
    }

    template.business_rules = template.business_rules || [];
    template.business_rules.push(rule);
    template.updated_by = userId;

    await template.save();
    return template;
  }
}

export const formTemplateService = new FormTemplateService();
export default formTemplateService;
