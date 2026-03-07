/**
 * Feature Flag Admin Routes
 *
 * Mounted at /api/v2/admin/feature-flags
 * All routes require authentication + admin role.
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { listFlags, getFlag, updateFlag, createFlag } from './featureFlag.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Admin-only guard
router.use((req, res, next) => {
  const user = (req as any).user;
  if (!user || !['admin', 'manager'].includes(user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.',
    });
  }
  next();
});

router.get('/', listFlags);
router.get('/:name', getFlag);
router.patch('/:name', updateFlag);
router.post('/', createFlag);

export default router;
