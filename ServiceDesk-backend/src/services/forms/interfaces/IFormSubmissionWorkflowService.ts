import { IFormSubmissionDocument } from '../../../core/entities/FormSubmission';
import { IWorkflowState } from '../../../core/types/smart-forms.types';

export interface IFormSubmissionWorkflowService {
  /**
   * بدء سير العمل للتقديم
   */
  startWorkflow(
    submission: IFormSubmissionDocument,
    userId: string
  ): Promise<IFormSubmissionDocument>;

  /**
   * الانتقال إلى خطوة التالية
   */
  moveToNextStep(
    submissionId: string,
    userId: string
  ): Promise<IFormSubmissionDocument | null>;

  /**
   * الانتقال إلى خطوة محددة
   */
  moveToStep(
    submissionId: string,
    stepId: string,
    userId: string
  ): Promise<IFormSubmissionDocument | null>;

  /**
   * الحصول على الخطوات المتاحة
   */
  getAvailableSteps(
    submissionId: string
  ): Promise<any[]>;

  /**
   * الحصول على حالة سير العمل
   */
  getWorkflowState(
    submissionId: string
  ): Promise<IWorkflowState | null>;

  /**
   * إعادة تعيين سير العمل
   */
  resetWorkflow(
    submissionId: string,
    userId: string
  ): Promise<IFormSubmissionDocument | null>;
}
