import { Router, Request, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import * as teamController from '../controllers/team.controller';
import { authenticate } from '../../../middleware/auth';
import { handleValidation } from '../../../shared/middleware/validate';

const router = Router();

router.use(authenticate);

/**
 * @deprecated PM team routes are deprecated. Use /api/v1/teams with scope=organization instead.
 * Sunset date: 2026-09-01
 */
router.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Deprecation', 'true');
  res.setHeader('Sunset', 'Tue, 01 Sep 2026 00:00:00 GMT');
  res.setHeader('Link', '</api/v1/teams>; rel="successor-version"');
  next();
});

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('description').optional().trim(),
    body('settings').optional().isObject(),
  ],
  handleValidation,
  (req: Request, res: Response) => teamController.createTeam(req, res)
);

router.get('/', (req: Request, res: Response) => teamController.getTeams(req, res));

router.get(
  '/:teamId',
  [param('teamId').isMongoId().withMessage('Invalid team ID')],
  handleValidation,
  (req: Request, res: Response) => teamController.getTeam(req, res)
);

router.put(
  '/:teamId',
  [
    param('teamId').isMongoId().withMessage('Invalid team ID'),
    body('name').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('settings').optional().isObject(),
  ],
  handleValidation,
  (req: Request, res: Response) => teamController.updateTeam(req, res)
);

router.delete(
  '/:teamId',
  [param('teamId').isMongoId().withMessage('Invalid team ID')],
  handleValidation,
  (req: Request, res: Response) => teamController.deleteTeam(req, res)
);

router.post(
  '/:teamId/members',
  [
    param('teamId').isMongoId().withMessage('Invalid team ID'),
    body('userId').isMongoId().withMessage('Invalid user ID'),
    body('role').optional().isIn(['lead', 'leader', 'member']),
  ],
  handleValidation,
  (req: Request, res: Response) => teamController.addTeamMember(req, res)
);

router.delete(
  '/:teamId/members/:memberId',
  [
    param('teamId').isMongoId().withMessage('Invalid team ID'),
    param('memberId').isMongoId().withMessage('Invalid member ID'),
  ],
  handleValidation,
  (req: Request, res: Response) => teamController.removeTeamMember(req, res)
);

export default router;
