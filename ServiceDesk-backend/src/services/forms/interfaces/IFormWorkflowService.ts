import { IWorkflowConfig, IApprovalConfig } from '../../../core/types/smart-forms.types';
import { IFormTemplateDocument } from '../../../core/entities/FormTemplate';

export interface IFormWorkflowService {
  /**
   * تعيين سير عمل للنموذج
   */
  setWorkflow(
    formId: string,
    workflow: IWorkflowConfig,
    userId: string
  ): Promise<IFormTemplateDocument | null>;

  /**
   * تحديث سير العمل
   */
  updateWorkflow(
    formId: string,
    workflow: Partial<IWorkflowConfig>,
    userId: string
  ): Promise<IFormTemplateDocument | null>;

  /**
   * حذف سير العمل
   */
  removeWorkflow(
    formId: string,
    userId: string
  ): Promise<IFormTemplateDocument | null>;

  /**
   * تعيين إعدادات الموافقة
   */
  setApprovalConfig(
    formId: string,
    approval: IApprovalConfig,
    userId: string
  ): Promise<IFormTemplateDocument | null>;

  /**
   * تحديث إعدادات الموافقة
   */
  updateApprovalConfig(
    formId: string,
    approval: Partial<IApprovalConfig>,
    userId: string
  ): Promise<IFormTemplateDocument | null>;

  /**
   * حذف إعدادات الموافقة
   */
  removeApprovalConfig(
    formId: string,
    userId: string
  ): Promise<IFormTemplateDocument | null>;

  /**
   * التحقق من صحة سير العمل
   */
  validateWorkflow(workflow: IWorkflowConfig): { valid: boolean; errors: string[] };
}
