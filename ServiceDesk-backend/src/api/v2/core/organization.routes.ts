/**
 * Core Organization Routes
 * 
 * Migrated from /api/v1/pm/organizations
 */

import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate } from '../../../middleware/auth';
import * as organizationController from '../../../controllers/pm/organization.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/v2/core/organizations
 * Create a new organization
 */
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('description').optional().trim(),
    body('settings').optional().isObject(),
  ],
  organizationController.createOrganization
);

/**
 * GET /api/v2/core/organizations
 * List user's organizations
 */
router.get('/', organizationController.getOrganizations);

/**
 * GET /api/v2/core/organizations/:orgId
 * Get organization by ID
 */
router.get(
  '/:orgId',
  [param('orgId').isMongoId().withMessage('Invalid organization ID')],
  organizationController.getOrganization
);

/**
 * PUT /api/v2/core/organizations/:orgId
 * Update organization
 */
router.put(
  '/:orgId',
  [
    param('orgId').isMongoId().withMessage('Invalid organization ID'),
    body('name').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('settings').optional().isObject(),
  ],
  organizationController.updateOrganization
);

/**
 * POST /api/v2/core/organizations/:orgId/switch
 * Switch active organization
 */
router.post(
  '/:orgId/switch',
  [param('orgId').isMongoId().withMessage('Invalid organization ID')],
  organizationController.switchOrganization
);

// ============================================================
// ORGANIZATION MEMBERS
// ============================================================

/**
 * GET /api/v2/core/organizations/:orgId/members
 * List organization members
 */
router.get(
  '/:orgId/members',
  [param('orgId').isMongoId().withMessage('Invalid organization ID')],
  organizationController.getOrganizationMembers
);

/**
 * POST /api/v2/core/organizations/:orgId/members
 * Invite member to organization
 */
router.post(
  '/:orgId/members',
  [
    param('orgId').isMongoId().withMessage('Invalid organization ID'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('role').optional().isIn(['owner', 'admin', 'member']),
  ],
  organizationController.inviteMember
);

/**
 * DELETE /api/v2/core/organizations/:orgId/members/:memberId
 * Remove member from organization
 */
router.delete(
  '/:orgId/members/:memberId',
  [
    param('orgId').isMongoId().withMessage('Invalid organization ID'),
    param('memberId').isMongoId().withMessage('Invalid member ID'),
  ],
  organizationController.removeMember
);

export default router;
