import { Router, Request, Response } from 'express';
import { param, query } from 'express-validator';
import * as analyticsController from '../../controllers/pm/analytics.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/pm/sprints/{sprintId}/burndown:
 *   get:
 *     summary: الحصول على مخطط احتراق الـ Sprint
 *     description: استرجاع بيانات مخطط احتراق الـ Sprint
 *     tags:
 *       - Analytics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sprintId
 *         required: true
 *         schema:
 *           type: string
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: مخطط الاحتراق
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get(
  '/sprints/:sprintId/burndown',
  [param('sprintId').isMongoId().withMessage('Invalid sprint ID')],
  (req: Request, res: Response) => analyticsController.getSprintBurndown(req as any, res)
);

/**
 * @swagger
 * /api/v1/pm/projects/{projectId}/velocity:
 *   get:
 *     summary: الحصول على مخطط السرعة
 *     description: استرجاع بيانات سرعة المشروع
 *     tags:
 *       - Analytics
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
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: مخطط السرعة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get(
  '/projects/:projectId/velocity',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    query('limit').optional().isNumeric(),
  ],
  (req: Request, res: Response) => analyticsController.getVelocityChart(req as any, res)
);

// Project statistics
router.get(
  '/projects/:projectId/stats',
  [param('projectId').isMongoId().withMessage('Invalid project ID')],
  (req: Request, res: Response) => analyticsController.getProjectStats(req as any, res)
);

// Cumulative flow diagram
router.get(
  '/projects/:projectId/cumulative-flow',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    query('days').optional().isNumeric(),
  ],
  (req: Request, res: Response) => analyticsController.getCumulativeFlow(req as any, res)
);

export default router;
