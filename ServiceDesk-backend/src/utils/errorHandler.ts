import { Response } from 'express';
import ApiResponse, { ApiErrorField } from './ApiResponse';
import { ErrorMessages } from './errorMessages';
import logger from './logger';

export class AppError extends Error {
  statusCode: number;
  errors: ApiErrorField[];

  constructor(
    statusCode: number,
    message: string,
    errors: ApiErrorField[] = []
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  errors: ApiErrorField[] = []
) => {
  const response = new ApiResponse(statusCode, message, null, errors);
  res.status(statusCode).json(response.toJSON());
};

export const sendSuccess = <T = null>(
  res: Response,
  statusCode: number,
  message: string,
  data: T = null as T
) => {
  const response = new ApiResponse(statusCode, message, data);
  res.status(statusCode).json(response.toJSON());
};

export const handleValidationError = (
  res: Response,
  errors: ApiErrorField[]
) => {
  sendError(res, 400, 'البيانات المدخلة غير صحيحة', errors);
};

export const handleNotFound = (res: Response, resource: string) => {
  sendError(res, 404, ErrorMessages.NOT_FOUND(resource));
};

export const handleUnauthorized = (res: Response) => {
  sendError(res, 401, ErrorMessages.UNAUTHORIZED);
};

export const handleForbidden = (res: Response) => {
  sendError(res, 403, ErrorMessages.FORBIDDEN);
};

export const handleConflict = (res: Response, message: string) => {
  sendError(res, 409, message);
};

export const handleServerError = (res: Response, error: unknown) => {
  logger.error('Server Error:', error);
  sendError(res, 500, ErrorMessages.INTERNAL_SERVER_ERROR);
};
