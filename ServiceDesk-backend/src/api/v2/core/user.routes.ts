/**
 * Core User Routes
 * 
 * Consolidates user management from legacy /api/v1/users
 */

import { Router } from 'express';
import { param, query } from 'express-validator';
import { authenticate } from '../../../middleware/auth';
import * as userController from '../../../controllers/userController';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/v2/core/users
 * List all users (with optional filters)
 */
router.get('/', userController.getAllUsers);

/**
 * GET /api/v2/core/users/search
 * Search users by name/email
 */
router.get(
  '/search',
  [query('q').optional().trim()],
  userController.searchUsers
);

/**
 * GET /api/v2/core/users/role/:role
 * Get users by role
 */
router.get(
  '/role/:role',
  [param('role').notEmpty().withMessage('Role is required')],
  userController.getUsersByRole
);

/**
 * GET /api/v2/core/users/:userId
 * Get user by ID
 */
router.get(
  '/:userId',
  [param('userId').isMongoId().withMessage('Invalid user ID')],
  userController.getUserById
);

export default router;
