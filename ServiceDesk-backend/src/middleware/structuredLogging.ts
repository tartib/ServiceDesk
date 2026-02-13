import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Structured Logging Middleware
 * Adds correlation IDs and request/response logging with context
 */

export interface RequestContext {
  correlationId: string;
  userId?: string;
  organizationId?: string;
  method: string;
  path: string;
  startTime: number;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      context?: RequestContext;
    }
  }
}

/**
 * Middleware to add correlation ID and request context
 */
export const requestContextMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();
  const user = req as any;
  
  req.context = {
    correlationId,
    userId: user.user?.id || user.user?._id,
    organizationId: user.user?.organizationId,
    method: req.method,
    path: req.path,
    startTime: Date.now(),
  };

  // Add correlation ID to response headers
  res.setHeader('X-Correlation-ID', correlationId);

  // Log request
  logger.info({
    message: 'Incoming request',
    correlationId,
    method: req.method,
    path: req.path,
    userId: req.context.userId,
    organizationId: req.context.organizationId,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data: string | Record<string, unknown>): Response {
    const duration = Date.now() - req.context!.startTime;
    
    // Log response
    logger.info({
      message: 'Request completed',
      correlationId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.context!.userId,
      organizationId: req.context!.organizationId,
    });

    // Call original send
    return originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware to log errors with context
 */
export const errorLoggingMiddleware = (
  err: Record<string, unknown>,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const correlationId = req.context?.correlationId || uuidv4();
  const duration = req.context ? Date.now() - req.context.startTime : 0;

  logger.error({
    message: 'Request error',
    correlationId,
    method: req.method,
    path: req.path,
    statusCode: (err.statusCode as number) || 500,
    error: err.message,
    stack: err.stack,
    duration: `${duration}ms`,
    userId: req.context?.userId,
    organizationId: req.context?.organizationId,
  });

  next(err);
};

/**
 * Helper function to log with context
 */
export const logWithContext = (
  req: Request,
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  metadata?: Record<string, unknown>
): void => {
  const context = req.context || {
    correlationId: uuidv4(),
    method: req.method,
    path: req.path,
    userId: undefined,
    organizationId: undefined,
  };

  logger[level]({
    message,
    correlationId: context.correlationId,
    userId: context.userId,
    organizationId: context.organizationId,
    ...metadata,
  });
};
