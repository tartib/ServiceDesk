import { Router, Request, Response } from 'express';
import { body, param } from 'express-validator';
import * as teamController from '../../controllers/pm/team.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('description').optional().trim(),
    body('settings').optional().isObject(),
  ],
  (req: Request, res: Response) => teamController.createTeam(req as any, res)
);

router.get('/', (req: Request, res: Response) => teamController.getTeams(req as any, res));

router.get(
  '/:teamId',
  [param('teamId').isMongoId().withMessage('Invalid team ID')],
  (req: Request, res: Response) => teamController.getTeam(req as any, res)
);

router.put(
  '/:teamId',
  [
    param('teamId').isMongoId().withMessage('Invalid team ID'),
    body('name').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('settings').optional().isObject(),
  ],
  (req: Request, res: Response) => teamController.updateTeam(req as any, res)
);

router.delete(
  '/:teamId',
  [param('teamId').isMongoId().withMessage('Invalid team ID')],
  (req: Request, res: Response) => teamController.deleteTeam(req as any, res)
);

router.post(
  '/:teamId/members',
  [
    param('teamId').isMongoId().withMessage('Invalid team ID'),
    body('userId').isMongoId().withMessage('Invalid user ID'),
    body('role').optional().isIn(['lead', 'member']),
  ],
  (req: Request, res: Response) => teamController.addTeamMember(req as any, res)
);

router.delete(
  '/:teamId/members/:memberId',
  [
    param('teamId').isMongoId().withMessage('Invalid team ID'),
    param('memberId').isMongoId().withMessage('Invalid member ID'),
  ],
  (req: Request, res: Response) => teamController.removeTeamMember(req as any, res)
);

export default router;
