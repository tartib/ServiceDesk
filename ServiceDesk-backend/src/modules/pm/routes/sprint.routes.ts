import { Router, Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import * as sprintController from '../controllers/sprint.controller';
import { authenticate } from '../../../middleware/auth';
import { handleValidation } from '../../../shared/middleware/validate';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v2/pm/projects/{projectId}/sprints:
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
  handleValidation,
  (req: Request, res: Response) => sprintController.createSprint(req, res)
);

/**
 * @swagger
 * /api/v2/pm/projects/{projectId}/sprints:
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
  handleValidation,
  (req: Request, res: Response) => sprintController.getSprints(req, res)
);

// Get backlog (tasks without sprint)
router.get(
  '/projects/:projectId/backlog',
  [param('projectId').isMongoId().withMessage('Invalid project ID')],
  handleValidation,
  (req: Request, res: Response) => sprintController.getBacklog(req, res)
);

// Get single sprint
router.get(
  '/sprints/:sprintId',
  [param('sprintId').isMongoId().withMessage('Invalid sprint ID')],
  handleValidation,
  (req: Request, res: Response) => sprintController.getSprint(req, res)
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
  handleValidation,
  (req: Request, res: Response) => sprintController.updateSprint(req, res)
);

// Start sprint
router.post(
  '/sprints/:sprintId/start',
  [
    param('sprintId').isMongoId().withMessage('Invalid sprint ID'),
    body('skipValidation').optional().isBoolean(),
    body('participants').optional().isArray(),
  ],
  handleValidation,
  (req: Request, res: Response) => sprintController.startSprint(req, res)
);

// Complete sprint
router.post(
  '/sprints/:sprintId/complete',
  [
    param('sprintId').isMongoId().withMessage('Invalid sprint ID'),
    body('moveIncompleteToBacklog').optional().isBoolean(),
    body('moveToSprintId').optional().isMongoId(),
  ],
  handleValidation,
  (req: Request, res: Response) => sprintController.completeSprint(req, res)
);

// Get sprint insights
router.get(
  '/sprints/:sprintId/insights',
  [param('sprintId').isMongoId().withMessage('Invalid sprint ID')],
  handleValidation,
  (req: Request, res: Response) => sprintController.getSprintInsights(req, res)
);

// Delete sprint
router.delete(
  '/sprints/:sprintId',
  [param('sprintId').isMongoId().withMessage('Invalid sprint ID')],
  handleValidation,
  (req: Request, res: Response) => sprintController.deleteSprint(req, res)
);

// ==================== SPRINT PLANNING ====================

// Get sprint planning summary
router.get(
  '/sprints/:sprintId/planning',
  [param('sprintId').isMongoId().withMessage('Invalid sprint ID')],
  handleValidation,
  (req: Request, res: Response) => sprintController.getSprintPlanningSummary(req, res)
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
  handleValidation,
  (req: Request, res: Response) => sprintController.updateTeamCapacity(req, res)
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
  handleValidation,
  (req: Request, res: Response) => sprintController.updateSprintSettings(req, res)
);

export default router;
