import { Router, Request, Response } from 'express';
import { param, query } from 'express-validator';
import * as activityController from '../controllers/activity.controller';
import { authenticate } from '../../../middleware/auth';
import { handleValidation } from '../../../shared/middleware/validate';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v2/pm/projects/{projectId}/activity:
 *   get:
 *     summary: الحصول على سجل نشاط المشروع
 *     description: استرجاع سجل النشاطات في المشروع
 *     tags:
 *       - Activity
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
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: سجل النشاط
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get(
  '/projects/:projectId/activity',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    query('page').optional().isNumeric(),
    query('limit').optional().isNumeric(),
  ],
  handleValidation,
  (req: Request, res: Response) => activityController.getProjectActivity(req, res)
);

// Alias: frontend uses plural "activities"
router.get(
  '/projects/:projectId/activities',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    query('page').optional().isNumeric(),
    query('limit').optional().isNumeric(),
  ],
  handleValidation,
  (req: Request, res: Response) => activityController.getProjectActivity(req, res)
);

/**
 * @swagger
 * /api/v2/pm/tasks/{taskId}/activity:
 *   get:
 *     summary: الحصول على نشاط المهمة
 *     description: استرجاع سجل النشاطات للمهمة
 *     tags:
 *       - Activity
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: نشاط المهمة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get(
  '/tasks/:taskId/activity',
  [param('taskId').isMongoId().withMessage('Invalid task ID')],
  handleValidation,
  (req: Request, res: Response) => activityController.getTaskActivity(req, res)
);

/**
 * @swagger
 * /api/v2/pm/me/activity:
 *   get:
 *     summary: الحصول على نشاطي
 *     description: استرجاع سجل النشاطات الخاص بالمستخدم الحالي
 *     tags:
 *       - Activity
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: نشاطات المستخدم
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get('/me/activity', (req: Request, res: Response) => activityController.getUserActivity(req, res));

/**
 * @swagger
 * /api/v2/pm/feed:
 *   get:
 *     summary: الحصول على تغذية المنظمة
 *     description: استرجاع سجل النشاطات العام للمنظمة
 *     tags:
 *       - Activity
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تغذية المنظمة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get('/feed', (req: Request, res: Response) => activityController.getOrganizationFeed(req, res));

export default router;
