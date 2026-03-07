/**
 * ITSM Authorization Middleware
 * 
 * Express middleware factory that enforces RBAC + ABAC permissions
 * for ITSM domain routes using the authorization engine.
 */

import { Request, Response, NextFunction } from 'express';
import { evaluate, buildAuthContext } from '../core/auth/authorizationEngine';
import {
  Action,
  Resource,
  ResourceContext,
} from '../shared/auth/permission.types';
import logger from '../utils/logger';

/**
 * Options for resource extraction from the request
 */
export interface ItsmAuthorizeOptions {
  /**
   * Custom function to extract ResourceContext from the request.
   * Useful for asset-based or ownership-based checks where
   * you need to load the resource from the DB first.
   */
  extractResource?: (req: Request) => Promise<Partial<ResourceContext>> | Partial<ResourceContext>;
}

/**
 * Creates an Express middleware that checks ITSM authorization.
 * 
 * Usage:
 *   router.post('/services', authenticate, itsmAuthorize(RESOURCES.CATALOG, 'create'), handler)
 *   router.get('/requests/:id', authenticate, itsmAuthorize(RESOURCES.SERVICE_REQUEST, 'read', {
 *     extractResource: async (req) => {
 *       const sr = await ServiceRequest.findById(req.params.id);
 *       return { ownerId: sr?.requesterId, teamId: sr?.assignedTeamId };
 *     }
 *   }), handler)
 */
export function itsmAuthorize(
  resource: Resource,
  action: Action,
  options?: ItsmAuthorizeOptions
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      // Build auth context from req.user
      const authCtx = buildAuthContext({
        id: req.user.id,
        itsmRole: req.user.itsmRole || 'end_user',
        organizationId: req.user.organizationId,
        teamIds: req.user.teamIds || [],
        organizations: req.user.organizations,
      });

      // Build resource context
      let resourceCtx: ResourceContext = {
        resourceType: resource,
        action,
        resourceId: req.params.id,
        organizationId: req.user.organizationId,
      };

      // If a custom extractor is provided, merge its output
      if (options?.extractResource) {
        const extracted = await options.extractResource(req);
        resourceCtx = { ...resourceCtx, ...extracted };
      }

      // Evaluate permission
      const result = evaluate(authCtx, resourceCtx);

      if (!result.allowed) {
        logger.warn(
          `[ITSM-AuthZ] Denied: user=${req.user.id} itsmRole=${req.user.itsmRole} action=${action} resource=${resource} reason=${result.reason}`
        );
        res.status(403).json({
          success: false,
          error: 'You do not have permission to perform this action',
          detail: result.reason,
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('[ITSM-AuthZ] Error during authorization check:', error);
      res.status(500).json({
        success: false,
        error: 'Authorization check failed',
      });
    }
  };
}

/**
 * Shorthand: require a minimum ITSM role (simple role-level check without ABAC).
 * Useful for routes where you just need "technician or above" without resource context.
 */
export function requireItsmRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const userItsmRole = req.user.itsmRole || 'end_user';
    if (!allowedRoles.includes(userItsmRole)) {
      logger.warn(
        `[ITSM-AuthZ] Role denied: user=${req.user.id} itsmRole=${userItsmRole} required=${allowedRoles.join(',')}`
      );
      res.status(403).json({
        success: false,
        error: `Requires one of: ${allowedRoles.join(', ')}`,
      });
      return;
    }

    next();
  };
}

export default { itsmAuthorize, requireItsmRole };
