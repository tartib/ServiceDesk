/**
 * Standardized Error Response Format
 * Ensures consistent error handling across all endpoints
 */

export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST_ERROR = 'BAD_REQUEST_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
}

export interface StandardizedErrorResponse {
  success: false;
  error: {
    type: ErrorType;
    message: string;
    statusCode: number;
    correlationId?: string;
    timestamp: string;
    details?: Record<string, unknown>;
  };
}

export class StandardizedError extends Error {
  constructor(
    public type: ErrorType,
    public message: string,
    public statusCode: number,
    public details?: Record<string, unknown>,
    public correlationId?: string
  ) {
    super(message);
    this.name = 'StandardizedError';
  }

  toResponse(): StandardizedErrorResponse {
    return {
      success: false,
      error: {
        type: this.type,
        message: this.message,
        statusCode: this.statusCode,
        correlationId: this.correlationId,
        timestamp: new Date().toISOString(),
        ...(this.details && { details: this.details }),
      },
    };
  }
}

export const createValidationError = (
  message: string,
  details?: Record<string, unknown>,
  correlationId?: string
) => new StandardizedError(ErrorType.VALIDATION_ERROR, message, 400, details, correlationId);

export const createAuthenticationError = (
  message: string = 'Authentication required',
  correlationId?: string
) => new StandardizedError(ErrorType.AUTHENTICATION_ERROR, message, 401, undefined, correlationId);

export const createAuthorizationError = (
  message: string = 'Insufficient permissions',
  correlationId?: string
) => new StandardizedError(ErrorType.AUTHORIZATION_ERROR, message, 403, undefined, correlationId);

export const createNotFoundError = (
  resource: string,
  correlationId?: string
) => new StandardizedError(ErrorType.NOT_FOUND_ERROR, `${resource} not found`, 404, undefined, correlationId);

export const createConflictError = (
  message: string,
  details?: Record<string, unknown>,
  correlationId?: string
) => new StandardizedError(ErrorType.CONFLICT_ERROR, message, 409, details, correlationId);

export const createInternalServerError = (
  message: string = 'Internal server error',
  correlationId?: string
) => new StandardizedError(ErrorType.INTERNAL_SERVER_ERROR, message, 500, undefined, correlationId);

export const createRateLimitError = (
  message: string = 'Too many requests',
  retryAfter?: number,
  correlationId?: string
) => new StandardizedError(
  ErrorType.RATE_LIMIT_ERROR,
  message,
  429,
  retryAfter ? { retryAfter } : undefined,
  correlationId
);
