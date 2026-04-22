/**
 * Core Module — Team Routes
 */

import { Router, Response, RequestHandler } from 'express';
import { body, param } from 'express-validator';
import { authenticate } from '../../../middleware/auth';
import * as teamCtrl from '../controllers/team.controller';
import { PMAuthRequest } from '../../../types/pm';

const asHandler = (fn: (req: PMAuthRequest, res: Response) => Promise<void>): RequestHandler =>
  fn as unknown as RequestHandler;

const router = Router();

router.use(authenticate);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('description').optional().trim(),
    body('settings').optional().isObject(),
  ],
  asHandler(teamCtrl.createTeam)
);

router.get('/', asHandler(teamCtrl.getTeams));

router.get(
  '/:teamId',
  [param('teamId').isMongoId().withMessage('Invalid team ID')],
  asHandler(teamCtrl.getTeam)
);

router.put(
  '/:teamId',
  [
    param('teamId').isMongoId().withMessage('Invalid team ID'),
    body('name').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('settings').optional().isObject(),
  ],
  asHandler(teamCtrl.updateTeam)
);

router.delete(
  '/:teamId',
  [param('teamId').isMongoId().withMessage('Invalid team ID')],
  asHandler(teamCtrl.deleteTeam)
);

// Members
router.post(
  '/:teamId/members',
  [
    param('teamId').isMongoId().withMessage('Invalid team ID'),
    body('userId').isMongoId().withMessage('Invalid user ID'),
    body('role').optional().isIn(['lead', 'leader', 'member']),
  ],
  asHandler(teamCtrl.addTeamMember)
);

router.delete(
  '/:teamId/members/:memberId',
  [
    param('teamId').isMongoId().withMessage('Invalid team ID'),
    param('memberId').isMongoId().withMessage('Invalid member ID'),
  ],
  asHandler(teamCtrl.removeTeamMember)
);

export default router;
