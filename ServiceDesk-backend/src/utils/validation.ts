import { ApiErrorField } from './ApiResponse';
import { ErrorMessages } from './errorMessages';

export class ValidationError {
  errors: ApiErrorField[] = [];

  addError(field: string, message: string): this {
    this.errors.push({ field, message });
    return this;
  }

  addFieldError(error: ApiErrorField): this {
    this.errors.push(error);
    return this;
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  getErrors(): ApiErrorField[] {
    return this.errors;
  }
}

export const validateEmail = (email: string): ApiErrorField | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return ErrorMessages.INVALID_EMAIL;
  }
  return null;
};

export const validatePassword = (password: string): ApiErrorField | null => {
  if (password.length < 8) {
    return ErrorMessages.INVALID_PASSWORD;
  }
  return null;
};

export const validateRequired = (
  value: unknown,
  field: string
): ApiErrorField | null => {
  if (
    value === null ||
    value === undefined ||
    value === '' ||
    (typeof value === 'string' && value.trim() === '')
  ) {
    return ErrorMessages.REQUIRED_FIELD(field);
  }
  return null;
};

export const validateEnum = (
  value: string,
  validValues: string[],
  field: string
): ApiErrorField | null => {
  if (!validValues.includes(value)) {
    return ErrorMessages.INVALID_VALUE(field, validValues);
  }
  return null;
};

export const validateLength = (
  value: string,
  minLength: number,
  maxLength: number,
  field: string
): ApiErrorField | null => {
  if (value.length < minLength) {
    return ErrorMessages.STRING_TOO_SHORT(field, minLength);
  }
  if (value.length > maxLength) {
    return ErrorMessages.STRING_TOO_LONG(field, maxLength);
  }
  return null;
};

export const validateNumber = (
  value: unknown,
  field: string
): ApiErrorField | null => {
  if (typeof value !== 'number' || isNaN(value)) {
    return ErrorMessages.INVALID_NUMBER(field);
  }
  return null;
};

export const validateDate = (
  value: string
): ApiErrorField | null => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(value)) {
    return ErrorMessages.INVALID_DATE;
  }
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return ErrorMessages.INVALID_DATE;
  }
  return null;
};

export const validateMinValue = (
  value: number,
  minValue: number,
  field: string
): ApiErrorField | null => {
  if (value < minValue) {
    return {
      field,
      message: `${field} يجب أن يكون ${minValue} على الأقل`,
    };
  }
  return null;
};

export const validateMaxValue = (
  value: number,
  maxValue: number,
  field: string
): ApiErrorField | null => {
  if (value > maxValue) {
    return {
      field,
      message: `${field} يجب أن لا يتجاوز ${maxValue}`,
    };
  }
  return null;
};
