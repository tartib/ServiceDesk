import { Router, Request, Response } from 'express';
import { param, body, query } from 'express-validator';
import * as ctrl from '../controllers/teamPerformance.controller';
import { authenticate } from '../../../middleware/auth';
import { handleValidation } from '../../../shared/middleware/validate';

const router = Router();

router.use(authenticate);

const wrap = (fn: Function) => (req: Request, res: Response) => fn(req, res);

// ─── Team Performance Dashboard ─────────────────────────────────────────────

router.get('/users', wrap(ctrl.getTeamPerformance));

router.get(
  '/users/:userId',
  [param('userId').isMongoId().withMessage('Invalid user ID')],
  handleValidation,
  wrap(ctrl.getUserPerformanceDetail)
);

// ─── Goal CRUD ──────────────────────────────────────────────────────────────

router.post(
  '/goals',
  [
    body('ownerId').isMongoId().withMessage('Invalid owner ID'),
    body('title').notEmpty().withMessage('Title is required'),
    body('targetValue').isNumeric().withMessage('Target value is required'),
  ],
  handleValidation,
  wrap(ctrl.createGoal)
);

router.get('/goals', wrap(ctrl.getGoals));

router.patch(
  '/goals/:goalId',
  [param('goalId').isMongoId().withMessage('Invalid goal ID')],
  handleValidation,
  wrap(ctrl.updateGoal)
);

// ─── Point Transaction CRUD ─────────────────────────────────────────────────

router.post(
  '/points',
  [
    body('userId').isMongoId().withMessage('Invalid user ID'),
    body('amount').isNumeric().withMessage('Amount is required'),
    body('type').isIn(['earned', 'spent', 'bonus', 'penalty']).withMessage('Invalid type'),
  ],
  handleValidation,
  wrap(ctrl.createPointTransaction)
);

router.get('/points', wrap(ctrl.getPointTransactions));

export default router;
