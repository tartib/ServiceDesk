/**
 * Core Module — Organization Routes
 */

import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate } from '../../../middleware/auth';
import * as orgCtrl from '../controllers/organization.controller';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('description').optional().trim(),
    body('settings').optional().isObject(),
  ],
  orgCtrl.createOrganization
);

router.get('/', orgCtrl.getOrganizations);

router.get(
  '/:orgId',
  [param('orgId').isMongoId().withMessage('Invalid organization ID')],
  orgCtrl.getOrganization
);

router.put(
  '/:orgId',
  [
    param('orgId').isMongoId().withMessage('Invalid organization ID'),
    body('name').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('settings').optional().isObject(),
  ],
  orgCtrl.updateOrganization
);

router.post(
  '/:orgId/switch',
  [param('orgId').isMongoId().withMessage('Invalid organization ID')],
  orgCtrl.switchOrganization
);

// Members
router.get(
  '/:orgId/members',
  [param('orgId').isMongoId().withMessage('Invalid organization ID')],
  orgCtrl.getOrganizationMembers
);

router.post(
  '/:orgId/members',
  [
    param('orgId').isMongoId().withMessage('Invalid organization ID'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('role').optional().isIn(['owner', 'admin', 'member']),
  ],
  orgCtrl.inviteMember
);

router.delete(
  '/:orgId/members/:memberId',
  [
    param('orgId').isMongoId().withMessage('Invalid organization ID'),
    param('memberId').isMongoId().withMessage('Invalid member ID'),
  ],
  orgCtrl.removeMember
);

export default router;
