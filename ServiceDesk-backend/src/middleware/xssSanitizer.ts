import { Request, Response, NextFunction } from 'express';
import xss from 'xss';

/**
 * XSS Sanitization Middleware
 * Sanitizes req.body, req.query, and req.params to prevent XSS attacks
 */

const sanitizeValue = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return xss(value);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    return sanitizeObject(value as Record<string, unknown>);
  }
  return value;
};

const sanitizeObject = (obj: Record<string, unknown>): Record<string, unknown> => {
  const sanitized: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    sanitized[key] = sanitizeValue(obj[key]);
  }
  return sanitized;
};

/**
 * Mutate an object's values in-place (Express 5 makes req.query / req.params
 * read-only getters, so we can't reassign the whole property).
 */
const sanitizeInPlace = (obj: Record<string, unknown>): void => {
  for (const key of Object.keys(obj)) {
    obj[key] = sanitizeValue(obj[key]);
  }
};

export const xssSanitizer = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    sanitizeInPlace(req.query as Record<string, unknown>);
  }
  if (req.params && typeof req.params === 'object') {
    sanitizeInPlace(req.params as Record<string, unknown>);
  }
  next();
};

export default xssSanitizer;
