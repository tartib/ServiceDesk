import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import ApiError from '../../utils/ApiError';

export interface ValidationResult {
  valid: boolean;
  errors: Array<{ field: string; message: string }> | null;
  data: Record<string, unknown> | null;
}

/**
 * Validation middleware factory
 * Usage: app.post('/route', validate(schema), controller)
 */
export const validate = (schema: Joi.ObjectSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const dataToValidate = req[source] || {};

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: false,
      presence: 'optional',
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      console.error('Validation error details:', { source, data: dataToValidate, errors });
      throw new ApiError(400, 'Validation failed', { errors });
    }

    // Replace the source data with validated data
    if (source === 'body') {
      req.body = value;
    } else if (source === 'query') {
      req.query = value as Record<string, string | string[]>;
    } else if (source === 'params') {
      req.params = value as Record<string, string>;
    }
    next();
  };
};

/**
 * Multi-source validation middleware
 * Validates body, query, and params simultaneously
 */
export const validateMulti = (schemas: {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const errors: Array<{ source: string; field: string; message: string }> = [];

    // Validate body
    if (schemas.body) {
      const { error, value } = schemas.body.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        error.details.forEach((detail) => {
          errors.push({
            source: 'body',
            field: detail.path.join('.'),
            message: detail.message,
          });
        });
      } else {
        req.body = value;
      }
    }

    // Validate query
    if (schemas.query) {
      const { error, value } = schemas.query.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        error.details.forEach((detail) => {
          errors.push({
            source: 'query',
            field: detail.path.join('.'),
            message: detail.message,
          });
        });
      } else {
        req.query = value as Record<string, string | string[] | undefined>;
      }
    }

    // Validate params
    if (schemas.params) {
      const { error, value } = schemas.params.validate(req.params, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        error.details.forEach((detail) => {
          errors.push({
            source: 'params',
            field: detail.path.join('.'),
            message: detail.message,
          });
        });
      } else {
        req.params = value as Record<string, string>;
      }
    }

    if (errors.length > 0) {
      throw new ApiError(400, 'Validation failed', { errors });
    }

    next();
  };
};
