import { Request, Response } from 'express';

export interface ApiErrorField {
  field: string;
  message: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponseBody<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  pagination?: PaginationMeta;
  errors?: ApiErrorField[];
  requestId?: string;
}

class ApiResponse<T = unknown> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T | null;
  errors: ApiErrorField[];

  constructor(
    statusCode: number,
    message: string,
    data: T | null = null,
    errors: ApiErrorField[] = []
  ) {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
    this.errors = errors;
  }

  toJSON(): ApiResponseBody<T> {
    const response: ApiResponseBody<T> = {
      success: this.success,
      statusCode: this.statusCode,
      message: this.message,
    };

    if (this.data !== null && this.data !== undefined) {
      response.data = this.data;
    }

    if (this.errors.length > 0) {
      response.errors = this.errors;
    }

    return response;
  }
}

// ── Functional helpers for controllers ──────────────────────────

/**
 * Send a success JSON response with the canonical envelope.
 */
export function sendSuccess<T>(
  req: Request,
  res: Response,
  data: T,
  message = 'OK',
  statusCode = 200,
): void {
  res.status(statusCode).json({
    success: true,
    statusCode,
    message,
    data,
    requestId: req.correlationId,
  } as ApiResponseBody<T>);
}

/**
 * Send a paginated success response with canonical pagination meta.
 */
export function sendPaginated<T>(
  req: Request,
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number,
  message = 'OK',
): void {
  res.status(200).json({
    success: true,
    statusCode: 200,
    message,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    requestId: req.correlationId,
  } as ApiResponseBody<T[]>);
}

/**
 * Send an error response with the canonical envelope.
 */
export function sendError(
  req: Request,
  res: Response,
  statusCode: number,
  message: string,
  errors?: ApiErrorField[],
): void {
  const body: ApiResponseBody = {
    success: false,
    statusCode,
    message,
    requestId: req.correlationId,
  };
  if (errors && errors.length > 0) {
    body.errors = errors;
  }
  res.status(statusCode).json(body);
}

export default ApiResponse;
