import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Extend Express Request type
// eslint-disable-next-line @typescript-eslint/no-namespace
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}

/**
 * Correlation ID Middleware
 * Adds a unique correlation ID to each request for tracing
 * Uses existing X-Correlation-ID header if provided, otherwise generates a new one
 */
export const correlationId = (req: Request, res: Response, next: NextFunction): void => {
  const existingId = req.headers['x-correlation-id'];
  const id = (typeof existingId === 'string' && existingId) ? existingId : uuidv4();
  
  req.correlationId = id;
  res.setHeader('X-Correlation-ID', id);
  
  next();
};

export default correlationId;
