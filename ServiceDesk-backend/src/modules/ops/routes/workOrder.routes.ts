/**
 * Ops Module — Work Order Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import { authorize } from '../../../middleware/auth';
import { UserRole } from '../../../types';
import * as woCtrl from '../controllers/workOrder.controller';

const router = Router();

// CRUD
router.post('/', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), woCtrl.createTask);
router.get('/', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), woCtrl.getAllTasks);
router.get('/today', woCtrl.getTodayTasks);
router.get('/my', woCtrl.getMyTasks);
router.get('/status/:status', [param('status').notEmpty()], woCtrl.getTasksByStatus);
router.get('/product/:productId', [param('productId').notEmpty()], woCtrl.getTasksByProductId);
router.get('/:workOrderId', [param('workOrderId').isMongoId()], woCtrl.getTaskById);

// Unified transition
router.post(
  '/:workOrderId/transition',
  [
    param('workOrderId').isMongoId(),
    body('targetStatus').notEmpty(),
    body('comment').optional().trim(),
    body('metadata').optional().isObject(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { targetStatus, metadata } = req.body;
      switch (targetStatus) {
        case 'in_progress':
          return woCtrl.startTask(req, res, next);
        case 'completed':
          if (metadata) {
            req.body.preparedQuantity = metadata.preparedQuantity;
            req.body.unit = metadata.unit;
          }
          return woCtrl.completeTask(req, res, next);
        case 'overdue':
          return woCtrl.markTaskAsLate(req, res, next);
        default:
          return res.status(400).json({
            success: false,
            message: `Invalid target status: ${targetStatus}`,
            validStatuses: ['in_progress', 'completed', 'overdue'],
          });
      }
    } catch (error) {
      next(error);
    }
  }
);

// Actions
router.post(
  '/:workOrderId/assign',
  [param('workOrderId').isMongoId()],
  authorize(UserRole.SUPERVISOR, UserRole.MANAGER),
  woCtrl.assignTask
);

router.post(
  '/:workOrderId/usage',
  [param('workOrderId').isMongoId()],
  authorize(UserRole.SUPERVISOR, UserRole.MANAGER),
  woCtrl.updateTaskUsage
);

export default router;
