/**
 * Core Auth Routes - Unified Authentication
 * 
 * Consolidates authentication from:
 * - /api/v1/auth (legacy)
 * - /api/v1/pm/auth (PM module)
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../../../middleware/auth';
import { authLimiter } from '../../../middleware/rateLimiter';

// Import controllers from both legacy systems
import * as legacyAuthController from '../../../controllers/authController';
import * as pmAuthController from '../../../controllers/pm/auth.controller';

const router = Router();

// ============================================================
// PUBLIC ROUTES
// ============================================================

/**
 * POST /api/v2/core/auth/register
 * Register a new user
 */
router.post(
  '/register',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and number'),
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('name').optional().trim().notEmpty(),
    body('organizationName').optional().trim(),
  ],
  pmAuthController.register
);

/**
 * POST /api/v2/core/auth/login
 * User login
 */
router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  pmAuthController.login
);

/**
 * POST /api/v2/core/auth/refresh
 * Refresh access token
 */
router.post('/refresh', pmAuthController.refreshToken);

/**
 * POST /api/v2/core/auth/logout
 * User logout
 */
router.post('/logout', authenticate, pmAuthController.logout);

// ============================================================
// PROTECTED ROUTES
// ============================================================

/**
 * GET /api/v2/core/auth/me
 * Get current authenticated user
 */
router.get('/me', authenticate, pmAuthController.me);

/**
 * PATCH /api/v2/core/auth/me
 * Update current user profile
 */
router.patch('/me', authenticate, legacyAuthController.updateProfile);

/**
 * POST /api/v2/core/auth/change-password
 * Change password
 */
router.post(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and number'),
  ],
  pmAuthController.changePassword
);

export default router;
