import { IConditionalRule, IValidationRule, IBusinessRule } from '../../../core/types/smart-forms.types';
import { IFormTemplateDocument } from '../../../core/entities/FormTemplate';

export interface IFormRuleService {
  /**
   * إضافة قاعدة شرطية
   */
  addConditionalRule(
    formId: string,
    rule: IConditionalRule,
    userId: string
  ): Promise<IFormTemplateDocument | null>;

  /**
   * تحديث قاعدة شرطية
   */
  updateConditionalRule(
    formId: string,
    ruleId: string,
    rule: Partial<IConditionalRule>,
    userId: string
  ): Promise<IFormTemplateDocument | null>;

  /**
   * حذف قاعدة شرطية
   */
  deleteConditionalRule(
    formId: string,
    ruleId: string,
    userId: string
  ): Promise<IFormTemplateDocument | null>;

  /**
   * إضافة قاعدة تحقق
   */
  addValidationRule(
    formId: string,
    rule: IValidationRule,
    userId: string
  ): Promise<IFormTemplateDocument | null>;

  /**
   * تحديث قاعدة تحقق
   */
  updateValidationRule(
    formId: string,
    ruleId: string,
    rule: Partial<IValidationRule>,
    userId: string
  ): Promise<IFormTemplateDocument | null>;

  /**
   * حذف قاعدة تحقق
   */
  deleteValidationRule(
    formId: string,
    ruleId: string,
    userId: string
  ): Promise<IFormTemplateDocument | null>;

  /**
   * إضافة قاعدة تجارية
   */
  addBusinessRule(
    formId: string,
    rule: IBusinessRule,
    userId: string
  ): Promise<IFormTemplateDocument | null>;

  /**
   * تحديث قاعدة تجارية
   */
  updateBusinessRule(
    formId: string,
    ruleId: string,
    rule: Partial<IBusinessRule>,
    userId: string
  ): Promise<IFormTemplateDocument | null>;

  /**
   * حذف قاعدة تجارية
   */
  deleteBusinessRule(
    formId: string,
    ruleId: string,
    userId: string
  ): Promise<IFormTemplateDocument | null>;
}
