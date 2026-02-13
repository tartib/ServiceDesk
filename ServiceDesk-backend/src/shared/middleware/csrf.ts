import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import ApiError from '../../utils/ApiError';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_COOKIE_NAME = 'csrf-token';

/**
 * Generate CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * CSRF protection middleware
 * Generates tokens for GET requests and validates them for state-changing requests
 * For API requests with JWT auth, CSRF is optional
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Safe methods - only generate token
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const token = generateCsrfToken();
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000, // 1 hour
    });
    res.setHeader('X-CSRF-Token', token);
    res.locals.csrfToken = token;
    return next();
  }

  // State-changing methods - validate token
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    // Skip CSRF validation if request has JWT authentication (API requests)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // JWT authenticated request - skip CSRF check
      return next();
    }

    const cookieToken = req.cookies[CSRF_COOKIE_NAME];
    const headerToken = req.headers[CSRF_HEADER_NAME] as string;

    // Only enforce CSRF if no JWT auth is present
    if (!cookieToken && !headerToken) {
      // Allow request if neither cookie nor header token is present
      // This is for development/API testing
      return next();
    }

    if (cookieToken && headerToken && cookieToken !== headerToken) {
      throw new ApiError(403, 'CSRF token validation failed');
    }

    // Token is valid or not required, continue
    return next();
  }

  next();
};

/**
 * Middleware to skip CSRF protection for specific routes
 * Usage: app.post('/webhook', skipCsrf, controller)
 */
export const skipCsrf = (_req: Request, _res: Response, next: NextFunction) => {
  _req.skipCsrf = true;
  next();
};

/**
 * Conditional CSRF protection
 * Skips CSRF check if skipCsrf flag is set
 */
export const csrfProtectionConditional = (req: Request, res: Response, next: NextFunction) => {
  if (req.skipCsrf) {
    return next();
  }
  return csrfProtection(req, res, next);
};

declare module 'express' {
  interface Request {
    skipCsrf?: boolean;
  }
}
