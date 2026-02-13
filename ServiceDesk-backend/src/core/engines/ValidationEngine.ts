/**
 * Validation Engine - محرك التحقق
 * Smart Forms System
 * 
 * مسؤول عن:
 * - التحقق من صحة الحقول
 * - التحقق من صحة النموذج كاملاً
 * - دعم قواعد التحقق المخصصة
 */

import {
  ISmartField,
  IRenderedField,
  IValidationResult,
  IValidationError,
  IFormValidationResult,
  IEvaluationContext,
  SmartFieldType,
} from '../types/smart-forms.types';
import { ConditionalLogicEngine } from './ConditionalLogicEngine';

// ============================================
// INTERFACES
// ============================================

export interface IValidationContext extends IEvaluationContext {
  locale: 'en' | 'ar';
}

export interface ICustomValidator {
  name: string;
  validate: (value: any, field: ISmartField, formData: Record<string, any>) => boolean;
  message: string;
  message_ar: string;
}

// ============================================
// VALIDATION ENGINE
// ============================================

export class ValidationEngine {
  private conditionalLogicEngine: ConditionalLogicEngine;
  private customValidators: Map<string, ICustomValidator> = new Map();

  constructor(conditionalLogicEngine?: ConditionalLogicEngine) {
    this.conditionalLogicEngine = conditionalLogicEngine || new ConditionalLogicEngine();
    this.registerBuiltInValidators();
  }

  /**
   * تسجيل المدققات المدمجة
   */
  private registerBuiltInValidators(): void {
    // Saudi Phone Number
    this.registerValidator({
      name: 'saudi_phone',
      validate: (value) => {
        if (!value) return true;
        return /^(05|5)(0|3|4|5|6|7|8|9)\d{7}$/.test(String(value).replace(/\s/g, ''));
      },
      message: 'Please enter a valid Saudi phone number',
      message_ar: 'الرجاء إدخال رقم جوال سعودي صحيح',
    });

    // Saudi National ID
    this.registerValidator({
      name: 'saudi_id',
      validate: (value) => {
        if (!value) return true;
        return /^[12]\d{9}$/.test(String(value));
      },
      message: 'Please enter a valid Saudi National ID',
      message_ar: 'الرجاء إدخال رقم هوية وطنية صحيح',
    });

    // Iqama Number
    this.registerValidator({
      name: 'iqama',
      validate: (value) => {
        if (!value) return true;
        return /^2\d{9}$/.test(String(value));
      },
      message: 'Please enter a valid Iqama number',
      message_ar: 'الرجاء إدخال رقم إقامة صحيح',
    });

    // Future Date
    this.registerValidator({
      name: 'future_date',
      validate: (value) => {
        if (!value) return true;
        const date = new Date(value);
        return date > new Date();
      },
      message: 'Date must be in the future',
      message_ar: 'يجب أن يكون التاريخ في المستقبل',
    });

    // Past Date
    this.registerValidator({
      name: 'past_date',
      validate: (value) => {
        if (!value) return true;
        const date = new Date(value);
        return date < new Date();
      },
      message: 'Date must be in the past',
      message_ar: 'يجب أن يكون التاريخ في الماضي',
    });

    // Age Validator
    this.registerValidator({
      name: 'min_age_18',
      validate: (value) => {
        if (!value) return true;
        const birthDate = new Date(value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return age >= 18;
      },
      message: 'Must be at least 18 years old',
      message_ar: 'يجب أن يكون العمر 18 سنة على الأقل',
    });
  }

  /**
   * تسجيل مدقق مخصص
   */
  registerValidator(validator: ICustomValidator): void {
    this.customValidators.set(validator.name, validator);
  }

  /**
   * التحقق من صحة حقل واحد
   */
  validateField(
    field: ISmartField | IRenderedField,
    value: any,
    formData: Record<string, any>,
    context: IValidationContext
  ): IValidationResult {
    const errors: IValidationError[] = [];
    const locale = context.locale || 'en';

    // 1. التحقق من الحقل المطلوب
    const isRequired = this.isFieldRequired(field, context);
    if (isRequired && this.isEmpty(value)) {
      errors.push({
        field_id: field.field_id,
        type: 'required',
        message: locale === 'ar' ? 'هذا الحقل مطلوب' : 'This field is required',
      });
      return { valid: false, errors };
    }

    // إذا كانت القيمة فارغة وليست مطلوبة، لا داعي للتحقق الإضافي
    if (this.isEmpty(value)) {
      return { valid: true, errors: [] };
    }

    // 2. التحقق من النوع
    const typeError = this.validateType(field, value, locale);
    if (typeError) errors.push(typeError);

    // 3. التحقق من الحد الأدنى/الأقصى للأرقام
    if (field.validation.min !== undefined && typeof value === 'number') {
      if (value < field.validation.min) {
        errors.push({
          field_id: field.field_id,
          type: 'min',
          message: locale === 'ar'
            ? `القيمة يجب أن تكون ${field.validation.min} على الأقل`
            : `Value must be at least ${field.validation.min}`,
        });
      }
    }

    if (field.validation.max !== undefined && typeof value === 'number') {
      if (value > field.validation.max) {
        errors.push({
          field_id: field.field_id,
          type: 'max',
          message: locale === 'ar'
            ? `القيمة يجب أن تكون ${field.validation.max} على الأكثر`
            : `Value must be at most ${field.validation.max}`,
        });
      }
    }

    // 4. التحقق من طول النص
    if (field.validation.min_length !== undefined) {
      if (String(value).length < field.validation.min_length) {
        errors.push({
          field_id: field.field_id,
          type: 'min_length',
          message: locale === 'ar'
            ? `يجب أن يكون ${field.validation.min_length} حرف على الأقل`
            : `Must be at least ${field.validation.min_length} characters`,
        });
      }
    }

    if (field.validation.max_length !== undefined) {
      if (String(value).length > field.validation.max_length) {
        errors.push({
          field_id: field.field_id,
          type: 'max_length',
          message: locale === 'ar'
            ? `يجب أن يكون ${field.validation.max_length} حرف على الأكثر`
            : `Must be at most ${field.validation.max_length} characters`,
        });
      }
    }

    // 5. التحقق من النمط (Regex)
    if (field.validation.pattern) {
      try {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(String(value))) {
          errors.push({
            field_id: field.field_id,
            type: 'pattern',
            message: locale === 'ar'
              ? field.validation.pattern_message_ar || 'القيمة غير صالحة'
              : field.validation.pattern_message || 'Invalid value',
          });
        }
      } catch {
        // تجاهل أخطاء Regex غير الصالحة
      }
    }

    // 6. التحقق المخصص
    if (field.validation.custom_validator) {
      const customError = this.runCustomValidator(
        field.validation.custom_validator,
        value,
        field,
        formData,
        locale
      );
      if (customError) errors.push(customError);
    }

    // 7. التحقق من الخيارات (للحقول المحددة)
    if (this.isSelectionField(field) && field.options) {
      const optionError = this.validateOptions(field, value, locale);
      if (optionError) errors.push(optionError);
    }

    // 8. التحقق من الملفات
    if (this.isFileField(field)) {
      const fileErrors = this.validateFile(field, value, locale);
      errors.push(...fileErrors);
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * التحقق من صحة النموذج كاملاً
   */
  validateForm(
    fields: (ISmartField | IRenderedField)[],
    formData: Record<string, any>,
    context: IValidationContext
  ): IFormValidationResult {
    const allErrors: IValidationError[] = [];
    const fieldResults = new Map<string, IValidationResult>();

    for (const field of fields) {
      // تخطي الحقول المخفية
      if ('visible' in field && !field.visible) continue;
      if (field.display.hidden) continue;

      // تخطي حقول التخطيط
      if (this.isLayoutField(field)) continue;

      const result = this.validateField(
        field,
        formData[field.field_id],
        formData,
        context
      );

      fieldResults.set(field.field_id, result);
      allErrors.push(...result.errors);
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      fieldResults,
    };
  }

  /**
   * التحقق من النوع
   */
  private validateType(
    field: ISmartField | IRenderedField,
    value: any,
    locale: string
  ): IValidationError | null {
    switch (field.type) {
      case SmartFieldType.EMAIL: {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return {
            field_id: field.field_id,
            type: 'email',
            message: locale === 'ar' ? 'البريد الإلكتروني غير صالح' : 'Invalid email address',
          };
        }
        break;
      }

      case SmartFieldType.PHONE: {
        const phoneRegex = /^[\d\s\-+()]+$/;
        if (!phoneRegex.test(value)) {
          return {
            field_id: field.field_id,
            type: 'phone',
            message: locale === 'ar' ? 'رقم الهاتف غير صالح' : 'Invalid phone number',
          };
        }
        break;
      }

      case SmartFieldType.URL:
        try {
          new URL(value);
        } catch {
          return {
            field_id: field.field_id,
            type: 'url',
            message: locale === 'ar' ? 'الرابط غير صالح' : 'Invalid URL',
          };
        }
        break;

      case SmartFieldType.NUMBER:
      case SmartFieldType.DECIMAL:
        if (isNaN(Number(value))) {
          return {
            field_id: field.field_id,
            type: 'number',
            message: locale === 'ar' ? 'يجب أن تكون القيمة رقماً' : 'Value must be a number',
          };
        }
        break;

      case SmartFieldType.DATE:
      case SmartFieldType.DATETIME: {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return {
            field_id: field.field_id,
            type: 'date',
            message: locale === 'ar' ? 'التاريخ غير صالح' : 'Invalid date',
          };
        }
        break;
      }
    }

    return null;
  }

  /**
   * التحقق من الخيارات
   */
  private validateOptions(
    field: ISmartField | IRenderedField,
    value: any,
    locale: string
  ): IValidationError | null {
    if (!field.options || field.options.length === 0) return null;

    const validValues = field.options.map(o => o.value);

    if (Array.isArray(value)) {
      const invalidValues = value.filter(v => !validValues.includes(v));
      if (invalidValues.length > 0) {
        return {
          field_id: field.field_id,
          type: 'invalid_option',
          message: locale === 'ar' ? 'خيار غير صالح' : 'Invalid option selected',
        };
      }
    } else {
      if (!validValues.includes(value)) {
        return {
          field_id: field.field_id,
          type: 'invalid_option',
          message: locale === 'ar' ? 'خيار غير صالح' : 'Invalid option selected',
        };
      }
    }

    return null;
  }

  /**
   * التحقق من الملفات
   */
  private validateFile(
    field: ISmartField | IRenderedField,
    value: any,
    locale: string
  ): IValidationError[] {
    const errors: IValidationError[] = [];
    if (!value) return errors;

    const files = Array.isArray(value) ? value : [value];
    const settings = field.settings || {};
    const maxSize = settings.max_file_size_mb || 10;
    const allowedTypes = settings.allowed_file_types || [];

    for (const file of files) {
      // التحقق من الحجم
      if (file.size && file.size > maxSize * 1024 * 1024) {
        errors.push({
          field_id: field.field_id,
          type: 'file_size',
          message: locale === 'ar'
            ? `حجم الملف يجب أن يكون أقل من ${maxSize} ميجابايت`
            : `File size must be less than ${maxSize}MB`,
        });
      }

      // التحقق من النوع
      if (allowedTypes.length > 0 && file.type) {
        const extension = file.name?.split('.').pop()?.toLowerCase();
        const mimeType = file.type.toLowerCase();
        
        const isAllowed = allowedTypes.some((type: string) => {
          const t = type.toLowerCase();
          return mimeType.includes(t) || extension === t;
        });

        if (!isAllowed) {
          errors.push({
            field_id: field.field_id,
            type: 'file_type',
            message: locale === 'ar'
              ? `نوع الملف غير مسموح. الأنواع المسموحة: ${allowedTypes.join(', ')}`
              : `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
          });
        }
      }
    }

    return errors;
  }

  /**
   * تشغيل مدقق مخصص
   */
  private runCustomValidator(
    validatorName: string,
    value: any,
    field: ISmartField | IRenderedField,
    formData: Record<string, any>,
    locale: string
  ): IValidationError | null {
    const validator = this.customValidators.get(validatorName);
    if (!validator) return null;

    const isValid = validator.validate(value, field, formData);
    if (!isValid) {
      return {
        field_id: field.field_id,
        type: 'custom',
        message: locale === 'ar' ? validator.message_ar : validator.message,
      };
    }

    return null;
  }

  /**
   * التحقق مما إذا كان الحقل مطلوباً
   */
  private isFieldRequired(
    field: ISmartField | IRenderedField,
    context: IValidationContext
  ): boolean {
    // إذا كان الحقل المُعرض له حالة required
    if ('state' in field && field.state) {
      return field.state.required;
    }

    // إذا لم يكن الحقل مطلوباً أساساً
    if (!field.validation.required) {
      return false;
    }

    // إذا كان هناك شرط للمطلوبية
    if (field.validation.required_condition) {
      return this.conditionalLogicEngine.evaluateCondition(
        field.validation.required_condition,
        context
      );
    }

    return true;
  }

  /**
   * التحقق من أن القيمة فارغة
   */
  private isEmpty(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  /**
   * التحقق مما إذا كان الحقل من نوع الاختيار
   */
  private isSelectionField(field: ISmartField | IRenderedField): boolean {
    return [
      SmartFieldType.SELECT,
      SmartFieldType.MULTI_SELECT,
      SmartFieldType.RADIO,
      SmartFieldType.CHECKBOX,
    ].includes(field.type);
  }

  /**
   * التحقق مما إذا كان الحقل من نوع الملف
   */
  private isFileField(field: ISmartField | IRenderedField): boolean {
    return [
      SmartFieldType.FILE,
      SmartFieldType.MULTI_FILE,
      SmartFieldType.IMAGE,
    ].includes(field.type);
  }

  /**
   * التحقق مما إذا كان الحقل من نوع التخطيط
   */
  private isLayoutField(field: ISmartField | IRenderedField): boolean {
    return [
      SmartFieldType.SECTION_HEADER,
      SmartFieldType.DIVIDER,
      SmartFieldType.INFO_BOX,
    ].includes(field.type);
  }

  /**
   * الحصول على رسالة الخطأ المترجمة
   */
  getErrorMessage(error: IValidationError, locale: 'en' | 'ar'): string {
    return error.message_ar && locale === 'ar' ? error.message_ar : error.message;
  }

  /**
   * تحويل الأخطاء إلى كائن مفهرس بمعرف الحقل
   */
  errorsToMap(errors: IValidationError[]): Record<string, string[]> {
    const map: Record<string, string[]> = {};
    
    for (const error of errors) {
      if (!map[error.field_id]) {
        map[error.field_id] = [];
      }
      map[error.field_id].push(error.message);
    }

    return map;
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const validationEngine = new ValidationEngine();

export default ValidationEngine;
