import { IFormSubmissionDocument } from '../../../core/entities/FormSubmission';
import { ISmartField } from '../../../core/types/smart-forms.types';

export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
}

export interface IFormSubmissionValidationService {
  /**
   * التحقق من صحة بيانات التقديم
   */
  validateSubmissionData(
    fields: ISmartField[],
    data: Record<string, unknown>,
    context?: Record<string, unknown>
  ): ValidationResult;

  /**
   * التحقق من حقل واحد
   */
  validateField(
    field: ISmartField,
    value: unknown,
    context?: Record<string, unknown>
  ): ValidationResult;

  /**
   * التحقق من الشروط المسبقة للتقديم
   */
  validateSubmissionPrerequisites(
    submission: IFormSubmissionDocument
  ): ValidationResult;
}
