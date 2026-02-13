import { FormTemplate, IFormTemplateDocument } from '../../core/entities/FormTemplate';
import { IFormAccessService } from './interfaces/IFormAccessService';
import ApiError from '../../utils/ApiError';
import logger from '../../utils/logger';

export class FormAccessService implements IFormAccessService {
  async publishTemplate(
    formId: string,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    const template = await FormTemplate.findByFormId(formId);
    if (!template) {
      throw new ApiError(404, 'Form template not found');
    }

    if (template.is_published) {
      throw new ApiError(400, 'Template is already published');
    }

    if (!template.fields || template.fields.length === 0) {
      throw new ApiError(400, 'Cannot publish template without fields');
    }

    template.is_published = true;
    template.published_at = new Date();
    template.updated_by = userId;
    await template.save();

    logger.info(`Template ${formId} published by user ${userId}`);
    return template;
  }

  async unpublishTemplate(
    formId: string,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    const template = await FormTemplate.findByFormId(formId);
    if (!template) {
      throw new ApiError(404, 'Form template not found');
    }

    if (!template.is_published) {
      throw new ApiError(400, 'Template is not published');
    }

    template.is_published = false;
    template.updated_by = userId;
    await template.save();

    logger.info(`Template ${formId} unpublished by user ${userId}`);
    return template;
  }

  async createVersion(
    formId: string,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    const template = await FormTemplate.findByFormId(formId);
    if (!template) {
      throw new ApiError(404, 'Form template not found');
    }

    const newVersion = template.toObject();
    const versionObj = newVersion as Record<string, unknown>;
    delete versionObj._id;
    newVersion.version = (template.version || 1) + 1;
    newVersion.is_published = false;
    newVersion.created_by = userId;
    newVersion.created_at = new Date();
    newVersion.updated_by = userId;
    newVersion.updated_at = new Date();

    const newTemplate = new FormTemplate(newVersion);
    await newTemplate.save();

    logger.info(`New version created for template ${formId} by user ${userId}`);
    return newTemplate;
  }

  async setAccess(
    formId: string,
    availableTo: string[],
    requiresAuthentication: boolean,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    const template = await FormTemplate.findByFormId(formId);
    if (!template) {
      throw new ApiError(404, 'Form template not found');
    }

    template.access = {
      available_to: availableTo,
      requires_authentication: requiresAuthentication,
    };
    template.updated_by = userId;
    await template.save();

    logger.info(`Access settings updated for template ${formId} by user ${userId}`);
    return template;
  }

  async canAccess(
    formId: string,
    userId: string
  ): Promise<boolean> {
    const template = await FormTemplate.findByFormId(formId);
    if (!template) {
      throw new ApiError(404, 'Form template not found');
    }

    if (!template.is_published) {
      return false;
    }

    if (!template.access) {
      return true;
    }

    if (template.access.requires_authentication && !userId) {
      return false;
    }

    if (template.access.available_to && template.access.available_to.length > 0) {
      return template.access.available_to.includes(userId);
    }

    return true;
  }

  async getAccessInfo(
    formId: string
  ): Promise<{ availableTo: string[]; requiresAuthentication: boolean } | null> {
    const template = await FormTemplate.findByFormId(formId);
    if (!template) {
      throw new ApiError(404, 'Form template not found');
    }

    if (!template.access) {
      return null;
    }

    return {
      availableTo: template.access.available_to || [],
      requiresAuthentication: template.access.requires_authentication || false,
    };
  }
}
