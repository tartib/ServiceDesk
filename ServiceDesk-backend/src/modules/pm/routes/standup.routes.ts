import { Router, Request, Response } from 'express';
import { body, param } from 'express-validator';
import * as standupController from '../controllers/standup.controller';
import { authenticate } from '../../../middleware/auth';
import { handleValidation } from '../../../shared/middleware/validate';

const router = Router();

router.use(authenticate);

// Get single standup
router.get(
  '/standups/:standupId',
  [param('standupId').isMongoId().withMessage('Invalid standup ID')],
  handleValidation,
  (req: Request, res: Response) => standupController.getStandup(req, res)
);

// Update standup
router.put(
  '/standups/:standupId',
  [
    param('standupId').isMongoId().withMessage('Invalid standup ID'),
    body('yesterday').optional().trim(),
    body('today').optional().trim(),
    body('blockers').optional().isArray(),
    body('blockers.*').optional().isString(),
    body('status').optional().isIn(['draft', 'published']),
  ],
  handleValidation,
  (req: Request, res: Response) => standupController.updateStandup(req, res)
);

// Delete standup
router.delete(
  '/standups/:standupId',
  [param('standupId').isMongoId().withMessage('Invalid standup ID')],
  handleValidation,
  (req: Request, res: Response) => standupController.deleteStandup(req, res)
);

export default router;
