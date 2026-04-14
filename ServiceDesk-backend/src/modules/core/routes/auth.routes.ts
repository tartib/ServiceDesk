/**
 * Core Module — Auth Routes
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../../../middleware/auth';
import { authLimiter } from '../../../middleware/rateLimiter';
import { handleValidation } from '../../../shared/middleware/validate';
import { skipCsrf } from '../../../shared/middleware/csrf';
import * as authCtrl from '../controllers/auth.controller';

const router = Router();

// Public
router.post(
  '/register',
  skipCsrf,
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
  skipCsrf,
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  handleValidation,
  authCtrl.login
);

router.post('/refresh', skipCsrf, authCtrl.refreshToken);
router.post('/logout', authenticate, authCtrl.logout);

// Protected
router.get('/me', authenticate, authCtrl.me);
router.patch('/me', authenticate, authCtrl.updateProfile);
router.patch('/profile', authenticate, authCtrl.updateProfile);

const passwordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
];

router.post(
  '/change-password',
  authenticate,
  passwordValidation,
  handleValidation,
  authCtrl.changePassword
);

router.patch(
  '/password',
  authenticate,
  passwordValidation,
  handleValidation,
  authCtrl.changePassword
);

export default router;
