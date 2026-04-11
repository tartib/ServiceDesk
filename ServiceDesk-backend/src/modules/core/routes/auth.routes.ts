/**
 * Core Module — Auth Routes
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../../../middleware/auth';
import { authLimiter } from '../../../middleware/rateLimiter';
import { handleValidation } from '../../../shared/middleware/validate';
import * as authCtrl from '../controllers/auth.controller';

const router = Router();

// Public
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
  handleValidation,
  authCtrl.register
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  handleValidation,
  authCtrl.login
);

router.post('/refresh', authCtrl.refreshToken);
router.post('/logout', authenticate, authCtrl.logout);

// Protected
router.get('/me', authenticate, authCtrl.me);
router.patch('/me', authenticate, authCtrl.updateProfile);

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
  handleValidation,
  authCtrl.changePassword
);

export default router;
