import { Request, Response, NextFunction } from 'express';
import container from './container';

/**
 * DI Middleware - Attaches container to request object
 * Allows controllers to access services via req.container
 */
export const diMiddleware = (req: Request, res: Response, next: NextFunction) => {
  (req as any).container = container;
  next();
};

/**
 * Service resolver helper - Use in controllers to get services
 * Example: const fileStorageService = getService(req, 'fileStorageService');
 */
export const getService = (req: Request, serviceName: string) => {
  const container = (req as any).container;
  if (!container) {
    throw new Error('DI container not available in request');
  }
  return container.resolve(serviceName);
};

export default diMiddleware;
