import { FormTemplate, IFormTemplateDocument } from '../../core/entities/FormTemplate';
import { IConditionalRule, IValidationRule, IBusinessRule } from '../../core/types/smart-forms.types';
import { IFormRuleService } from './interfaces/IFormRuleService';
import ApiError from '../../utils/ApiError';
import logger from '../../utils/logger';

export class FormRuleService implements IFormRuleService {
  async addConditionalRule(
    formId: string,
    rule: IConditionalRule,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    const template = await FormTemplate.findByFormId(formId);
    if (!template) {
      throw new ApiError(404, 'Form template not found');
    }

    if (template.is_published) {
      throw new ApiError(400, 'Cannot modify published template. Create a new version instead.');
    }

    if (!rule.rule_id) {
      rule.rule_id = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    template.conditional_rules.push(rule);
    template.updated_by = userId;
    await template.save();

    logger.info(`Conditional rule added to template ${formId} by user ${userId}`);
    return template;
  }

  async updateConditionalRule(
    formId: string,
    ruleId: string,
    rule: Partial<IConditionalRule>,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    const template = await FormTemplate.findByFormId(formId);
    if (!template) {
      throw new ApiError(404, 'Form template not found');
    }

    if (template.is_published) {
      throw new ApiError(400, 'Cannot modify published template. Create a new version instead.');
    }

    const ruleIndex = template.conditional_rules.findIndex(r => r.rule_id === ruleId);
    if (ruleIndex === -1) {
      throw new ApiError(404, 'Conditional rule not found');
    }

    template.conditional_rules[ruleIndex] = { ...template.conditional_rules[ruleIndex], ...rule };
    template.updated_by = userId;
    await template.save();

    logger.info(`Conditional rule ${ruleId} updated in template ${formId} by user ${userId}`);
    return template;
  }

  async deleteConditionalRule(
    formId: string,
    ruleId: string,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    const template = await FormTemplate.findByFormId(formId);
    if (!template) {
      throw new ApiError(404, 'Form template not found');
    }

    if (template.is_published) {
      throw new ApiError(400, 'Cannot modify published template. Create a new version instead.');
    }

    const ruleIndex = template.conditional_rules.findIndex(r => r.rule_id === ruleId);
    if (ruleIndex === -1) {
      throw new ApiError(404, 'Conditional rule not found');
    }

    template.conditional_rules.splice(ruleIndex, 1);
    template.updated_by = userId;
    await template.save();

    logger.info(`Conditional rule ${ruleId} deleted from template ${formId} by user ${userId}`);
    return template;
  }

  async addValidationRule(
    formId: string,
    rule: IValidationRule,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    const template = await FormTemplate.findByFormId(formId);
    if (!template) {
      throw new ApiError(404, 'Form template not found');
    }

    if (template.is_published) {
      throw new ApiError(400, 'Cannot modify published template. Create a new version instead.');
    }

    if (!rule.rule_id) {
      rule.rule_id = `vrule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    template.validation_rules.push(rule);
    template.updated_by = userId;
    await template.save();

    logger.info(`Validation rule added to template ${formId} by user ${userId}`);
    return template;
  }

  async updateValidationRule(
    formId: string,
    ruleId: string,
    rule: Partial<IValidationRule>,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    const template = await FormTemplate.findByFormId(formId);
    if (!template) {
      throw new ApiError(404, 'Form template not found');
    }

    if (template.is_published) {
      throw new ApiError(400, 'Cannot modify published template. Create a new version instead.');
    }

    const ruleIndex = template.validation_rules.findIndex(r => r.rule_id === ruleId);
    if (ruleIndex === -1) {
      throw new ApiError(404, 'Validation rule not found');
    }

    template.validation_rules[ruleIndex] = { ...template.validation_rules[ruleIndex], ...rule };
    template.updated_by = userId;
    await template.save();

    logger.info(`Validation rule ${ruleId} updated in template ${formId} by user ${userId}`);
    return template;
  }

  async deleteValidationRule(
    formId: string,
    ruleId: string,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    const template = await FormTemplate.findByFormId(formId);
    if (!template) {
      throw new ApiError(404, 'Form template not found');
    }

    if (template.is_published) {
      throw new ApiError(400, 'Cannot modify published template. Create a new version instead.');
    }

    const ruleIndex = template.validation_rules.findIndex(r => r.rule_id === ruleId);
    if (ruleIndex === -1) {
      throw new ApiError(404, 'Validation rule not found');
    }

    template.validation_rules.splice(ruleIndex, 1);
    template.updated_by = userId;
    await template.save();

    logger.info(`Validation rule ${ruleId} deleted from template ${formId} by user ${userId}`);
    return template;
  }

  async addBusinessRule(
    formId: string,
    rule: IBusinessRule,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    const template = await FormTemplate.findByFormId(formId);
    if (!template) {
      throw new ApiError(404, 'Form template not found');
    }

    if (template.is_published) {
      throw new ApiError(400, 'Cannot modify published template. Create a new version instead.');
    }

    if (!rule.rule_id) {
      rule.rule_id = `brule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    template.business_rules.push(rule);
    template.updated_by = userId;
    await template.save();

    logger.info(`Business rule added to template ${formId} by user ${userId}`);
    return template;
  }

  async updateBusinessRule(
    formId: string,
    ruleId: string,
    rule: Partial<IBusinessRule>,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    const template = await FormTemplate.findByFormId(formId);
    if (!template) {
      throw new ApiError(404, 'Form template not found');
    }

    if (template.is_published) {
      throw new ApiError(400, 'Cannot modify published template. Create a new version instead.');
    }

    const ruleIndex = template.business_rules.findIndex(r => r.rule_id === ruleId);
    if (ruleIndex === -1) {
      throw new ApiError(404, 'Business rule not found');
    }

    template.business_rules[ruleIndex] = { ...template.business_rules[ruleIndex], ...rule };
    template.updated_by = userId;
    await template.save();

    logger.info(`Business rule ${ruleId} updated in template ${formId} by user ${userId}`);
    return template;
  }

  async deleteBusinessRule(
    formId: string,
    ruleId: string,
    userId: string
  ): Promise<IFormTemplateDocument | null> {
    const template = await FormTemplate.findByFormId(formId);
    if (!template) {
      throw new ApiError(404, 'Form template not found');
    }

    if (template.is_published) {
      throw new ApiError(400, 'Cannot modify published template. Create a new version instead.');
    }

    const ruleIndex = template.business_rules.findIndex(r => r.rule_id === ruleId);
    if (ruleIndex === -1) {
      throw new ApiError(404, 'Business rule not found');
    }

    template.business_rules.splice(ruleIndex, 1);
    template.updated_by = userId;
    await template.save();

    logger.info(`Business rule ${ruleId} deleted from template ${formId} by user ${userId}`);
    return template;
  }
}
