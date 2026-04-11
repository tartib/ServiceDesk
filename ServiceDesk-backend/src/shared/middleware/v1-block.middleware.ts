/**
 * v1 Block Middleware
 *
 * Returns 410 Gone for any v1 request that is NOT in the legacy whitelist.
 * Applied AFTER the legacy route groups so that whitelisted routes still work,
 * but any new or unknown v1 path is rejected with a pointer to v2.
 *
 * Sunset target: 2026-09-01
 */

import { Request, Response, NextFunction } from 'express';
import { deprecationMap } from './deprecation.middleware';
import logger from '../../utils/logger';

/**
 * Builds the best-match v2 successor link for a given v1 path.
 * Falls back to `/api/v2` if no specific mapping exists.
 */
function getSuccessorLink(originalUrl: string): string {
  const match = Object.keys(deprecationMap).find((p) =>
    originalUrl.startsWith(p),
  );
  return match ? deprecationMap[match].successorPath : '/api/v2';
}

/**
 * Catch-all for `/api/v1/*` — returns 410 Gone with a Link to the v2 successor.
 * Mount this AFTER all legacy route groups in app.ts so that registered legacy
 * routes are still reachable while un-registered ones are blocked.
 */
export function v1BlockMiddleware(
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const successor = getSuccessorLink(req.originalUrl);

  logger.warn('Blocked v1 request — no matching legacy route', {
    method: req.method,
    path: req.originalUrl,
    successor,
    userId: req.user?.id,
  });

  res.setHeader('Sunset', 'Mon, 01 Sep 2026 00:00:00 GMT');
  res.setHeader('Deprecation', 'true');
  res.setHeader('Link', `<${successor}>; rel="successor-version"`);

  res.status(410).json({
    success: false,
    code: 'API_VERSION_GONE',
    message:
      'This v1 endpoint is no longer available. Please migrate to the v2 API.',
    successor,
    sunsetDate: '2026-09-01',
  });
}

export default v1BlockMiddleware;
