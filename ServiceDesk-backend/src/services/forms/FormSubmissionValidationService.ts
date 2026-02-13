import { IFormSubmissionDocument } from '../../core/entities/FormSubmission';
import { ISmartField } from '../../core/types/smart-forms.types';
import { ValidationEngine } from '../../core/engines/ValidationEngine';
import { IFormSubmissionValidationService, ValidationResult } from './interfaces/IFormSubmissionValidationService';

export class FormSubmissionValidationService implements IFormSubmissionValidationService {
  private validationEngine: ValidationEngine;

  constructor() {
    this.validationEngine = new ValidationEngine();
  }

  validateSubmissionData(
    fields: ISmartField[],
    data: Record<string, unknown>,
    context?: Record<string, unknown>
  ): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    if (!fields || fields.length === 0) {
      return { valid: true, errors: [] };
    }

    for (const field of fields) {
      const value = data[field.field_id];
      const fieldValidation = this.validateField(field, value, context);

      if (!fieldValidation.valid) {
        errors.push(...fieldValidation.errors);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  validateField(
    field: ISmartField,
    value: unknown,
    _context?: Record<string, unknown>
  ): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    if (!field.validation) {
      return { valid: true, errors: [] };
    }

    const validation = field.validation;

    if (validation.required && (value === null || value === undefined || value === '')) {
      errors.push({
        field: field.field_id,
        message: `${field.label} is required`,
      });
      return { valid: false, errors };
    }

    if (value === null || value === undefined || value === '') {
      return { valid: true, errors: [] };
    }

    if (validation.min_length && typeof value === 'string' && value.length < validation.min_length) {
      errors.push({
        field: field.field_id,
        message: `${field.label} must be at least ${validation.min_length} characters`,
      });
    }

    if (validation.max_length && typeof value === 'string' && value.length > validation.max_length) {
      errors.push({
        field: field.field_id,
        message: `${field.label} must not exceed ${validation.max_length} characters`,
      });
    }

    if (validation.pattern && typeof value === 'string') {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        errors.push({
          field: field.field_id,
          message: `${field.label} format is invalid`,
        });
      }
    }

    if ((validation as unknown as Record<string, unknown>).email && typeof value === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors.push({
          field: field.field_id,
          message: `${field.label} must be a valid email`,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  validateSubmissionPrerequisites(
    submission: IFormSubmissionDocument
  ): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    if (!submission.form_template_id) {
      errors.push({
        field: 'form_template_id',
        message: 'Form template ID is required',
      });
    }

    if (!submission.submitted_by || !submission.submitted_by.user_id) {
      errors.push({
        field: 'submitted_by',
        message: 'Submitter information is required',
      });
    }

    if (!submission.data || Object.keys(submission.data).length === 0) {
      errors.push({
        field: 'data',
        message: 'Submission data is required',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
