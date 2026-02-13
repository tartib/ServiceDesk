import { Router, Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import * as sprintController from '../../controllers/pm/sprint.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/pm/projects/{projectId}/sprints:
 *   post:
 *     summary: إنشاء Sprint جديد
 *     description: إنشاء Sprint جديد للمشروع
 *     tags:
 *       - Sprint
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Sprint 1
 *               goal:
 *                 type: string
 *                 example: إكمال الميزات الأساسية
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: تم إنشاء Sprint بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post(
  '/projects/:projectId/sprints',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    body('name').optional().trim(),
    body('goal').optional().trim(),
    body('startDate').isISO8601().withMessage('Start date is required'),
    body('endDate').isISO8601().withMessage('End date is required'),
    body('capacity').optional().isObject(),
  ],
  (req: Request, res: Response) => sprintController.createSprint(req as any, res)
);

/**
 * @swagger
 * /api/v1/pm/projects/{projectId}/sprints:
 *   get:
 *     summary: الحصول على Sprints المشروع
 *     description: استرجاع قائمة Sprints للمشروع
 *     tags:
 *       - Sprint
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         example: 507f1f77bcf86cd799439011
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [planning, active, completed, cancelled]
 *     responses:
 *       200:
 *         description: قائمة Sprints
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get(
  '/projects/:projectId/sprints',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    query('status').optional().isIn(['planning', 'active', 'completed', 'cancelled']),
  ],
  (req: Request, res: Response) => sprintController.getSprints(req as any, res)
);

// Get backlog (tasks without sprint)
router.get(
  '/projects/:projectId/backlog',
  [param('projectId').isMongoId().withMessage('Invalid project ID')],
  (req: Request, res: Response) => sprintController.getBacklog(req as any, res)
);

// Get single sprint
router.get(
  '/sprints/:sprintId',
  [param('sprintId').isMongoId().withMessage('Invalid sprint ID')],
  (req: Request, res: Response) => sprintController.getSprint(req as any, res)
);

// Update sprint
router.put(
  '/sprints/:sprintId',
  [
    param('sprintId').isMongoId().withMessage('Invalid sprint ID'),
    body('name').optional().trim(),
    body('goal').optional().trim(),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
  ],
  (req: Request, res: Response) => sprintController.updateSprint(req as any, res)
);

// Start sprint
router.post(
  '/sprints/:sprintId/start',
  [
    param('sprintId').isMongoId().withMessage('Invalid sprint ID'),
    body('skipValidation').optional().isBoolean(),
    body('participants').optional().isArray(),
  ],
  (req: Request, res: Response) => sprintController.startSprint(req as any, res)
);

// Complete sprint
router.post(
  '/sprints/:sprintId/complete',
  [
    param('sprintId').isMongoId().withMessage('Invalid sprint ID'),
    body('moveIncompleteToBacklog').optional().isBoolean(),
    body('moveToSprintId').optional().isMongoId(),
  ],
  (req: Request, res: Response) => sprintController.completeSprint(req as any, res)
);

// Get sprint insights
router.get(
  '/sprints/:sprintId/insights',
  [param('sprintId').isMongoId().withMessage('Invalid sprint ID')],
  (req: Request, res: Response) => sprintController.getSprintInsights(req as any, res)
);

// Delete sprint
router.delete(
  '/sprints/:sprintId',
  [param('sprintId').isMongoId().withMessage('Invalid sprint ID')],
  (req: Request, res: Response) => sprintController.deleteSprint(req as any, res)
);

// ==================== SPRINT PLANNING ====================

// Get sprint planning summary
router.get(
  '/sprints/:sprintId/planning',
  [param('sprintId').isMongoId().withMessage('Invalid sprint ID')],
  (req: Request, res: Response) => sprintController.getSprintPlanningSummary(req as any, res)
);

// Update team capacity
router.put(
  '/sprints/:sprintId/capacity',
  [
    param('sprintId').isMongoId().withMessage('Invalid sprint ID'),
    body('teamCapacity').isArray().withMessage('Team capacity is required'),
    body('teamCapacity.*.userId').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('Invalid user ID'),
    body('teamCapacity.*.availableDays').isNumeric(),
    body('teamCapacity.*.hoursPerDay').optional().isNumeric(),
    body('teamCapacity.*.plannedLeave').optional().isNumeric(),
    body('teamCapacity.*.meetingHours').optional().isNumeric(),
  ],
  (req: Request, res: Response) => sprintController.updateTeamCapacity(req as any, res)
);

// Update sprint settings
router.put(
  '/sprints/:sprintId/settings',
  [
    param('sprintId').isMongoId().withMessage('Invalid sprint ID'),
    body('settings').isObject().withMessage('Settings object is required'),
    body('settings.requireGoal').optional().isBoolean(),
    body('settings.requireEstimates').optional().isBoolean(),
    body('settings.enforceCapacity').optional().isBoolean(),
  ],
  (req: Request, res: Response) => sprintController.updateSprintSettings(req as any, res)
);

export default router;
