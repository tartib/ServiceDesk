/**
 * Core Module — User Routes
 */

import { Router } from 'express';
import { param, query } from 'express-validator';
import { authenticate } from '../../../middleware/auth';
import * as userCtrl from '../controllers/user.controller';

const router = Router();

router.use(authenticate);

router.get('/', userCtrl.getAllUsers);

router.get(
  '/search',
  [query('q').optional().trim()],
  userCtrl.searchUsers
);

router.get(
  '/role/:role',
  [param('role').notEmpty().withMessage('Role is required')],
  userCtrl.getUsersByRole
);

router.get(
  '/:userId',
  [param('userId').isMongoId().withMessage('Invalid user ID')],
  userCtrl.getUserById
);

export default router;
