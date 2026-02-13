/**
 * OPS Work Order Routes
 * 
 * Migrated from:
 * - /api/v1/tasks (legacy prep tasks)
 * - /api/v1/prep-tasks
 * 
 * Renamed "Task" to "WorkOrder" to avoid naming collision with PM module
 */

import { Router, Request, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import { authenticate, authorize } from '../../../middleware/auth';
import { UserRole } from '../../../types';
import * as prepTaskController from '../../../controllers/prepTaskController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================================
// WORK ORDER CRUD
// ============================================================

/**
 * POST /api/v2/ops/work-orders
 * Create a new work order (Supervisor/Manager only)
 */
router.post(
  '/',
  authorize(UserRole.SUPERVISOR, UserRole.MANAGER),
  prepTaskController.createTask
);

/**
 * GET /api/v2/ops/work-orders
 * List all work orders (Supervisor/Manager only)
 */
router.get(
  '/',
  authorize(UserRole.SUPERVISOR, UserRole.MANAGER),
  prepTaskController.getAllTasks
);

/**
 * GET /api/v2/ops/work-orders/today
 * Get today's work orders
 */
router.get('/today', prepTaskController.getTodayTasks);

/**
 * GET /api/v2/ops/work-orders/my
 * Get current user's assigned work orders
 */
router.get('/my', prepTaskController.getMyTasks);

/**
 * GET /api/v2/ops/work-orders/status/:status
 * Get work orders by status
 */
router.get(
  '/status/:status',
  [param('status').notEmpty().withMessage('Status is required')],
  prepTaskController.getTasksByStatus
);

/**
 * GET /api/v2/ops/work-orders/product/:productId
 * Get work orders for a specific product
 */
router.get(
  '/product/:productId',
  [param('productId').notEmpty().withMessage('Product ID is required')],
  prepTaskController.getTasksByProductId
);

/**
 * GET /api/v2/ops/work-orders/:workOrderId
 * Get work order by ID
 */
router.get(
  '/:workOrderId',
  [param('workOrderId').isMongoId().withMessage('Invalid work order ID')],
  prepTaskController.getTaskById
);

// ============================================================
// WORK ORDER TRANSITIONS (Unified Pattern)
// ============================================================

/**
 * POST /api/v2/ops/work-orders/:workOrderId/transition
 * Unified status transition endpoint
 * 
 * Request body:
 * {
 *   "targetStatus": "in_progress" | "completed" | "cancelled",
 *   "comment": "Optional transition comment",
 *   "metadata": {
 *     "preparedQuantity": 5,
 *     "unit": "pcs"
 *   }
 * }
 */
router.post(
  '/:workOrderId/transition',
  [
    param('workOrderId').isMongoId().withMessage('Invalid work order ID'),
    body('targetStatus').notEmpty().withMessage('Target status is required'),
    body('comment').optional().trim(),
    body('metadata').optional().isObject(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { targetStatus, metadata } = req.body;
      
      // Route to appropriate controller based on target status
      switch (targetStatus) {
        case 'in_progress':
          return prepTaskController.startTask(req, res, next);
        case 'completed':
          // Merge metadata into body for the controller
          if (metadata) {
            req.body.preparedQuantity = metadata.preparedQuantity;
            req.body.unit = metadata.unit;
          }
          return prepTaskController.completeTask(req, res, next);
        case 'overdue':
          return prepTaskController.markTaskAsLate(req, res, next);
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

// ============================================================
// WORK ORDER ACTIONS
// ============================================================

/**
 * POST /api/v2/ops/work-orders/:workOrderId/assign
 * Assign work order to user (Supervisor/Manager only)
 */
router.post(
  '/:workOrderId/assign',
  [param('workOrderId').isMongoId().withMessage('Invalid work order ID')],
  authorize(UserRole.SUPERVISOR, UserRole.MANAGER),
  prepTaskController.assignTask
);

/**
 * POST /api/v2/ops/work-orders/:workOrderId/usage
 * Update usage data (Supervisor/Manager only)
 */
router.post(
  '/:workOrderId/usage',
  [param('workOrderId').isMongoId().withMessage('Invalid work order ID')],
  authorize(UserRole.SUPERVISOR, UserRole.MANAGER),
  prepTaskController.updateTaskUsage
);

// ============================================================
// LEGACY COMPATIBILITY ROUTES
// These mirror the old endpoints for backward compatibility
// ============================================================

/**
 * @deprecated Use POST /:workOrderId/transition with targetStatus: "in_progress"
 */
router.patch('/:workOrderId/start', prepTaskController.startTask);

/**
 * @deprecated Use POST /:workOrderId/transition with targetStatus: "completed"
 */
router.patch('/:workOrderId/complete', prepTaskController.completeTask);

/**
 * @deprecated Use POST /:workOrderId/transition with targetStatus: "overdue"
 */
router.patch(
  '/:workOrderId/late',
  authorize(UserRole.SUPERVISOR, UserRole.MANAGER),
  prepTaskController.markTaskAsLate
);

/**
 * @deprecated Use POST /:workOrderId/assign
 */
router.patch(
  '/:workOrderId/assign',
  authorize(UserRole.SUPERVISOR, UserRole.MANAGER),
  prepTaskController.assignTask
);

/**
 * @deprecated Use POST /:workOrderId/usage
 */
router.patch(
  '/:workOrderId/usage',
  authorize(UserRole.SUPERVISOR, UserRole.MANAGER),
  prepTaskController.updateTaskUsage
);

export default router;
