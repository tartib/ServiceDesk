import { FormTemplate, IFormTemplateDocument } from '../../core/entities/FormTemplate';
import { ISmartField } from '../../core/types/smart-forms.types';
import { IFormFieldService } from './interfaces/IFormFieldService';
import ApiError from '../../utils/ApiError';
import logger from '../../utils/logger';

export class FormFieldService implements IFormFieldService {
  async addField(
    formId: string,
    field: ISmartField,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    const template = await FormTemplate.findByFormId(formId);
    if (!template) {
      throw new ApiError(404, 'Form template not found');
    }

    if (template.is_published) {
      throw new ApiError(400, 'Cannot modify published template. Create a new version instead.');
    }

    if (!field.field_id) {
      field.field_id = `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    template.fields.push(field);
    template.updated_by = userId;
    await template.save();

    logger.info(`Field added to template ${formId} by user ${userId}`);
    return template;
  }

  async updateField(
    formId: string,
    fieldId: string,
    field: Partial<ISmartField>,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    const template = await FormTemplate.findByFormId(formId);
    if (!template) {
      throw new ApiError(404, 'Form template not found');
    }

    if (template.is_published) {
      throw new ApiError(400, 'Cannot modify published template. Create a new version instead.');
    }

    const fieldIndex = template.fields.findIndex(f => f.field_id === fieldId);
    if (fieldIndex === -1) {
      throw new ApiError(404, 'Field not found');
    }

    template.fields[fieldIndex] = { ...template.fields[fieldIndex], ...field };
    template.updated_by = userId;
    await template.save();

    logger.info(`Field ${fieldId} updated in template ${formId} by user ${userId}`);
    return template;
  }

  async deleteField(
    formId: string,
    fieldId: string,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    const template = await FormTemplate.findByFormId(formId);
    if (!template) {
      throw new ApiError(404, 'Form template not found');
    }

    if (template.is_published) {
      throw new ApiError(400, 'Cannot modify published template. Create a new version instead.');
    }

    const fieldIndex = template.fields.findIndex(f => f.field_id === fieldId);
    if (fieldIndex === -1) {
      throw new ApiError(404, 'Field not found');
    }

    template.fields.splice(fieldIndex, 1);
    template.updated_by = userId;
    await template.save();

    logger.info(`Field ${fieldId} deleted from template ${formId} by user ${userId}`);
    return template;
  }

  async reorderFields(
    formId: string,
    fieldIds: string[],
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    const template = await FormTemplate.findByFormId(formId);
    if (!template) {
      throw new ApiError(404, 'Form template not found');
    }

    if (template.is_published) {
      throw new ApiError(400, 'Cannot modify published template. Create a new version instead.');
    }

    const fieldMap = new Map(template.fields.map(f => [f.field_id, f]));
    const reorderedFields: ISmartField[] = [];

    for (const fieldId of fieldIds) {
      const field = fieldMap.get(fieldId);
      if (!field) {
        throw new ApiError(400, `Field ${fieldId} not found`);
      }
      reorderedFields.push(field);
    }

    template.fields = reorderedFields;
    template.updated_by = userId;
    await template.save();

    logger.info(`Fields reordered in template ${formId} by user ${userId}`);
    return template;
  }

  async getField(formId: string, fieldId: string): Promise<ISmartField | null> {
    const template = await FormTemplate.findByFormId(formId);
    if (!template) {
      throw new ApiError(404, 'Form template not found');
    }

    const field = template.fields.find(f => f.field_id === fieldId);
    return field || null;
  }

  validateFields(fields: ISmartField[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Array.isArray(fields)) {
      return { valid: false, errors: ['Fields must be an array'] };
    }

    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];

      if (!field.label) {
        errors.push(`Field ${i}: label is required`);
      }

      if (!field.type) {
        errors.push(`Field ${i}: type is required`);
      }

      if (!field.field_id) {
        errors.push(`Field ${i}: field_id is required`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
