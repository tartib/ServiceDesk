import { Router, Request, Response } from 'express';
import { body, param } from 'express-validator';
import { authenticate } from '../../middleware/auth';
import * as externalTaskController from '../../controllers/workflow-engine/externalTask.controller';

const router = Router();

router.use(authenticate);

// Fetch and lock available external tasks (worker polling endpoint)
router.post(
  '/fetch-and-lock',
  [
    body('topic').trim().notEmpty().withMessage('Topic is required'),
    body('workerId').trim().notEmpty().withMessage('Worker ID is required'),
    body('lockDuration').optional().isInt({ min: 1000 }).withMessage('Lock duration must be at least 1000ms'),
    body('maxTasks').optional().isInt({ min: 1, max: 100 }).withMessage('Max tasks must be between 1 and 100'),
  ],
  (req: Request, res: Response) => externalTaskController.fetchAndLock(req as any, res)
);

// Complete an external task
router.post(
  '/:id/complete',
  [
    param('id').isMongoId().withMessage('Invalid external task ID'),
    body('workerId').trim().notEmpty().withMessage('Worker ID is required'),
  ],
  (req: Request, res: Response) => externalTaskController.complete(req as any, res)
);

// Report failure for an external task
router.post(
  '/:id/failure',
  [
    param('id').isMongoId().withMessage('Invalid external task ID'),
    body('workerId').trim().notEmpty().withMessage('Worker ID is required'),
    body('errorMessage').trim().notEmpty().withMessage('Error message is required'),
  ],
  (req: Request, res: Response) => externalTaskController.handleFailure(req as any, res)
);

// Extend lock on an external task
router.post(
  '/:id/extend-lock',
  [
    param('id').isMongoId().withMessage('Invalid external task ID'),
    body('workerId').trim().notEmpty().withMessage('Worker ID is required'),
    body('lockDuration').isInt({ min: 1000 }).withMessage('Lock duration must be at least 1000ms'),
  ],
  (req: Request, res: Response) => externalTaskController.extendLock(req as any, res)
);

// List external tasks (monitoring)
router.get(
  '/',
  (req: Request, res: Response) => externalTaskController.list(req as any, res)
);

// Get single external task
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid external task ID')],
  (req: Request, res: Response) => externalTaskController.getById(req as any, res)
);

export default router;
