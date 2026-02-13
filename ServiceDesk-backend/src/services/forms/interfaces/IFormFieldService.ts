import { ISmartField } from '../../../core/types/smart-forms.types';
import { IFormTemplateDocument } from '../../../core/entities/FormTemplate';

export interface IFormFieldService {
  /**
   * إضافة حقل إلى النموذج
   */
  addField(
    formId: string,
    field: ISmartField,
    userId: string
  ): Promise<IFormTemplateDocument | null>;

  /**
   * تحديث حقل في النموذج
   */
  updateField(
    formId: string,
    fieldId: string,
    field: Partial<ISmartField>,
    userId: string
  ): Promise<IFormTemplateDocument | null>;

  /**
   * حذف حقل من النموذج
   */
  deleteField(
    formId: string,
    fieldId: string,
    userId: string
  ): Promise<IFormTemplateDocument | null>;

  /**
   * إعادة ترتيب الحقول
   */
  reorderFields(
    formId: string,
    fieldIds: string[],
    userId: string
  ): Promise<IFormTemplateDocument | null>;

  /**
   * الحصول على حقل معين
   */
  getField(formId: string, fieldId: string): Promise<ISmartField | null>;

  /**
   * التحقق من صحة الحقول
   */
  validateFields(fields: ISmartField[]): { valid: boolean; errors: string[] };
}
