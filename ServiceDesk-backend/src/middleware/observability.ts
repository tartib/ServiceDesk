import { Request, Response, NextFunction } from 'express';
import { appMetrics } from '../utils/metrics';
import logger from '../utils/logger';

/**
 * Observability Middleware
 * Tracks HTTP metrics, performance, and business events
 */

export const observabilityMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const correlationId = (req as any).context?.correlationId || 'unknown';

  // Track request start
  const originalSend = res.send;
  res.send = function (data: string | Record<string, unknown>): Response {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Record HTTP metrics
    appMetrics.httpRequestsTotal(req.method, req.path, statusCode);
    appMetrics.httpRequestDuration(req.method, req.path, duration);

    // Log slow requests (> 1000ms)
    if (duration > 1000) {
      logger.warn({
        message: 'Slow request detected',
        correlationId,
        method: req.method,
        path: req.path,
        duration: `${duration}ms`,
        statusCode,
      });
    }

    // Log errors
    if (statusCode >= 400) {
      const errorType = statusCode >= 500 ? 'server_error' : 'client_error';
      appMetrics.errorsTotal(errorType);
      logger.error({
        message: 'HTTP error',
        correlationId,
        method: req.method,
        path: req.path,
        statusCode,
        duration: `${duration}ms`,
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Database Query Tracking Middleware
 * Tracks database operation performance
 */
export const trackDatabaseQuery = (operation: string, duration: number): void => {
  appMetrics.dbQueryDuration(operation, duration);

  // Log slow queries (> 500ms)
  if (duration > 500) {
    logger.warn({
      message: 'Slow database query',
      operation,
      duration: `${duration}ms`,
    });
  }
};

/**
 * Authentication Tracking
 */
export const trackAuthAttempt = (success: boolean): void => {
  appMetrics.authAttempts(success ? 'success' : 'failure');

  if (!success) {
    logger.warn({
      message: 'Authentication attempt failed',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Task Tracking
 */
export const trackTaskCreated = (): void => {
  appMetrics.tasksCreated();
};

export const trackTaskCompleted = (): void => {
  appMetrics.tasksCompleted();
};

/**
 * Workflow Transition Tracking
 */
export const trackWorkflowTransition = (fromStatus: string, toStatus: string, success: boolean): void => {
  if (success) {
    appMetrics.workflowTransitions(fromStatus, toStatus);
  } else {
    appMetrics.invalidTransitionAttempts();
    logger.warn({
      message: 'Invalid workflow transition attempted',
      fromStatus,
      toStatus,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Validation Error Tracking
 */
export const trackValidationError = (): void => {
  appMetrics.validationErrors();
};

/**
 * Cache Tracking
 */
export const trackCacheHit = (): void => {
  appMetrics.cacheHits();
};

export const trackCacheMiss = (): void => {
  appMetrics.cacheMisses();
};

/**
 * WebSocket Tracking
 */
export const trackWebSocketConnection = (count: number): void => {
  appMetrics.websocketConnections(count);
};

export const trackWebSocketAuthFailure = (): void => {
  appMetrics.websocketAuthFailures();
  logger.warn({
    message: 'WebSocket authentication failed',
    timestamp: new Date().toISOString(),
  });
};

/**
 * Database Connection Pool Tracking
 */
export const trackDatabaseConnectionPool = (size: number): void => {
  appMetrics.dbConnectionPoolSize(size);
};

export const trackDatabaseConnectionError = (): void => {
  appMetrics.dbConnectionErrors();
  logger.error({
    message: 'Database connection error',
    timestamp: new Date().toISOString(),
  });
};
