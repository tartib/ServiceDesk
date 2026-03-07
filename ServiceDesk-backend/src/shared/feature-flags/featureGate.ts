/**
 * Feature Gate Middleware
 *
 * Express middleware that returns 404 if a feature flag is disabled.
 * Usage: router.use(featureGate('workflow_engine_enabled'))
 */

import { Request, Response, NextFunction } from 'express';
import FeatureFlagService from './FeatureFlagService';
import { FeatureFlagContext } from './types';

/**
 * Creates an Express middleware that gates access behind a feature flag.
 * If the flag is disabled (or doesn't exist), responds with 404.
 */
export function featureGate(flagName: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const service = FeatureFlagService.getInstance();

    const context: FeatureFlagContext = {
      userId: (req as any).user?._id?.toString(),
      orgId: (req as any).user?.organizationId?.toString() || req.headers['x-organization-id'] as string,
      role: (req as any).user?.role || (req as any).user?.itsmRole,
    };

    if (service.isEnabled(flagName, context)) {
      next();
    } else {
      res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }
  };
}
