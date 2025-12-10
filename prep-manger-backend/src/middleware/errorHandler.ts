import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/ApiError';
import logger from '../utils/logger';
import env from '../config/env';

// Error converter - converts non-ApiError errors to ApiError
export const errorConverter = (err: any, _req: Request, _res: Response, next: NextFunction) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, false, err.stack);
  }

  next(error);
};

// Error handler middleware
export const errorHandler = (err: ApiError, req: Request, res: Response, _next: NextFunction) => {
  let { statusCode, message } = err;

  if (env.NODE_ENV === 'production' && !err.isOperational) {
    statusCode = 500;
    message = 'Internal Server Error';
  }

  res.locals.errorMessage = err.message;

  const response = {
    success: false,
    statusCode,
    message,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  // Log error
  if (env.NODE_ENV === 'development') {
    logger.error(err);
  } else {
    logger.error({
      statusCode,
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
    });
  }

  res.status(statusCode).json(response);
};

// 404 handler
export const notFound = (req: Request, _res: Response, next: NextFunction) => {
  const error = new ApiError(404, `Route not found: ${req.originalUrl}`);
  next(error);
};
