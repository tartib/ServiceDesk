/**
 * Core Team Routes
 * 
 * Consolidates team management from:
 * - /api/v1/teams (legacy)
 * - /api/v1/pm/teams (PM module)
 */

import { Router, Response, RequestHandler } from 'express';
import { body, param } from 'express-validator';
import { authenticate } from '../../../middleware/auth';
import * as pmTeamController from '../../../controllers/pm/team.controller';
import { PMAuthRequest } from '../../../types/pm';

// Type wrapper to bridge PMAuthRequest handlers with Express RequestHandler
const asHandler = (fn: (req: PMAuthRequest, res: Response) => Promise<void>): RequestHandler => 
  fn as unknown as RequestHandler;

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/v2/core/teams
 * Create a new team
 */
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('description').optional().trim(),
    body('settings').optional().isObject(),
  ],
  asHandler(pmTeamController.createTeam)
);

/**
 * GET /api/v2/core/teams
 * List all teams
 */
router.get('/', asHandler(pmTeamController.getTeams));

/**
 * GET /api/v2/core/teams/:teamId
 * Get team by ID
 */
router.get(
  '/:teamId',
  [param('teamId').isMongoId().withMessage('Invalid team ID')],
  asHandler(pmTeamController.getTeam)
);

/**
 * PUT /api/v2/core/teams/:teamId
 * Update team
 */
router.put(
  '/:teamId',
  [
    param('teamId').isMongoId().withMessage('Invalid team ID'),
    body('name').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('settings').optional().isObject(),
  ],
  asHandler(pmTeamController.updateTeam)
);

/**
 * DELETE /api/v2/core/teams/:teamId
 * Delete team
 */
router.delete(
  '/:teamId',
  [param('teamId').isMongoId().withMessage('Invalid team ID')],
  asHandler(pmTeamController.deleteTeam)
);

// ============================================================
// TEAM MEMBERS
// ============================================================

/**
 * POST /api/v2/core/teams/:teamId/members
 * Add member to team
 */
router.post(
  '/:teamId/members',
  [
    param('teamId').isMongoId().withMessage('Invalid team ID'),
    body('userId').isMongoId().withMessage('Invalid user ID'),
    body('role').optional().isIn(['lead', 'member']),
  ],
  asHandler(pmTeamController.addTeamMember)
);

/**
 * DELETE /api/v2/core/teams/:teamId/members/:memberId
 * Remove member from team
 */
router.delete(
  '/:teamId/members/:memberId',
  [
    param('teamId').isMongoId().withMessage('Invalid team ID'),
    param('memberId').isMongoId().withMessage('Invalid member ID'),
  ],
  asHandler(pmTeamController.removeTeamMember)
);

export default router;
