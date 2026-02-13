import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';

/**
 * Centralized input validation middleware
 * Enforces strict validation across all endpoints
 */

export const validateObjectId = () => param('id').isMongoId().withMessage('Invalid ID format');

export const validateEmail = () => body('email').isEmail().normalizeEmail().withMessage('Invalid email format');

export const validatePassword = () =>
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and numbers');

export const validateString = (field: string, minLength = 1, maxLength = 500) =>
  body(field)
    .isString()
    .trim()
    .isLength({ min: minLength, max: maxLength })
    .withMessage(`${field} must be between ${minLength} and ${maxLength} characters`);

export const validateNumber = (field: string, min?: number, max?: number) => {
  let validator = body(field).isNumeric().withMessage(`${field} must be a number`);
  if (min !== undefined) {
    validator = validator.isFloat({ min }).withMessage(`${field} must be at least ${min}`);
  }
  if (max !== undefined) {
    validator = validator.isFloat({ max }).withMessage(`${field} must be at most ${max}`);
  }
  return validator;
};

export const validateBoolean = (field: string) =>
  body(field).isBoolean().withMessage(`${field} must be a boolean`);

export const validateArray = (field: string, minLength = 0, maxLength = 100) =>
  body(field)
    .isArray({ min: minLength, max: maxLength })
    .withMessage(`${field} must be an array with ${minLength}-${maxLength} items`);

export const validateEnum = (field: string, allowedValues: string[]) =>
  body(field)
    .isIn(allowedValues)
    .withMessage(`${field} must be one of: ${allowedValues.join(', ')}`);

export const validateDate = (field: string) =>
  body(field).isISO8601().withMessage(`${field} must be a valid ISO 8601 date`);

export const validatePagination = () => [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
];

/**
 * Validation error handler middleware
 * Returns standardized error response
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map((err: any) => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value,
      })),
    });
  }
  next();
};

/**
 * Request size limit middleware
 * Prevents DoS attacks via large payloads
 */
export const requestSizeLimit = (maxSizeMB = 10) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    const maxBytes = maxSizeMB * 1024 * 1024;

    if (contentLength > maxBytes) {
      return res.status(413).json({
        success: false,
        error: `Request payload exceeds ${maxSizeMB}MB limit`,
      });
    }
    next();
  };
};
