/**
 * Portal Auth Middleware — Section 2, Batch 5
 *
 * Validates portal tokens and attaches session info to the request.
 * Used for client-facing portal routes (no JWT required).
 */

import { Request, Response, NextFunction } from 'express';
import { portalService } from './PortalService';

export interface PortalRequest extends Request {
  portalSession?: {
    tokenId: string;
    clientEmail: string;
    organizationId: string;
    scope: string;
    resourceType: string;
    resourceId?: string;
  };
}

export async function portalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token =
      req.headers['x-portal-token'] as string ||
      req.query.portalToken as string ||
      req.cookies?.portalToken;

    if (!token) {
      return res.status(401).json({ success: false, error: 'Portal token required' });
    }

    const portalToken = await portalService.validateToken(token);
    if (!portalToken) {
      return res.status(401).json({ success: false, error: 'Invalid or expired portal token' });
    }

    (req as PortalRequest).portalSession = {
      tokenId: portalToken.tokenId,
      clientEmail: portalToken.claimedBy ?? '',
      organizationId: portalToken.organizationId,
      scope: portalToken.scope,
      resourceType: portalToken.resourceType,
      resourceId: portalToken.resourceId,
    };

    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Portal authentication failed' });
  }
}
