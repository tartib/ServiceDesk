import { IFormTemplateDocument } from '../../../core/entities/FormTemplate';

export interface IFormAccessService {
  /**
   * نشر النموذج
   */
  publishTemplate(
    formId: string,
    userId: string
  ): Promise<IFormTemplateDocument | null>;

  /**
   * إلغاء نشر النموذج
   */
  unpublishTemplate(
    formId: string,
    userId: string
  ): Promise<IFormTemplateDocument | null>;

  /**
   * إنشاء نسخة جديدة من النموذج
   */
  createVersion(
    formId: string,
    userId: string
  ): Promise<IFormTemplateDocument | null>;

  /**
   * تعيين الوصول للنموذج
   */
  setAccess(
    formId: string,
    availableTo: string[],
    requiresAuthentication: boolean,
    userId: string
  ): Promise<IFormTemplateDocument | null>;

  /**
   * التحقق من صلاحية الوصول
   */
  canAccess(
    formId: string,
    userId: string
  ): Promise<boolean>;

  /**
   * الحصول على معلومات الوصول
   */
  getAccessInfo(formId: string): Promise<{ availableTo: string[]; requiresAuthentication: boolean } | null>;
}
