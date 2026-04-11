import { Router } from 'express';
import { body, param } from 'express-validator';
import * as externalTaskController from '../controllers/externalTask.controller';

const router = Router();

// Fetch and lock available external tasks (worker polling endpoint)
router.post(
  '/fetch-and-lock',
  [
    body('topic').trim().notEmpty().withMessage('Topic is required'),
    body('workerId').trim().notEmpty().withMessage('Worker ID is required'),
    body('lockDuration').optional().isInt({ min: 1000 }).withMessage('Lock duration must be at least 1000ms'),
    body('maxTasks').optional().isInt({ min: 1, max: 100 }).withMessage('Max tasks must be between 1 and 100'),
  ],
  externalTaskController.fetchAndLock
);

// Complete an external task
router.post(
  '/:id/complete',
  [
    param('id').isMongoId().withMessage('Invalid external task ID'),
    body('workerId').trim().notEmpty().withMessage('Worker ID is required'),
  ],
  externalTaskController.complete
);

// Report failure for an external task
router.post(
  '/:id/failure',
  [
    param('id').isMongoId().withMessage('Invalid external task ID'),
    body('workerId').trim().notEmpty().withMessage('Worker ID is required'),
    body('errorMessage').trim().notEmpty().withMessage('Error message is required'),
  ],
  externalTaskController.handleFailure
);

// Extend lock on an external task
router.post(
  '/:id/extend-lock',
  [
    param('id').isMongoId().withMessage('Invalid external task ID'),
    body('workerId').trim().notEmpty().withMessage('Worker ID is required'),
    body('lockDuration').isInt({ min: 1000 }).withMessage('Lock duration must be at least 1000ms'),
  ],
  externalTaskController.extendLock
);

// List external tasks (monitoring)
router.get(
  '/',
  externalTaskController.list
);

// Get single external task
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid external task ID')],
  externalTaskController.getById
);

export default router;
