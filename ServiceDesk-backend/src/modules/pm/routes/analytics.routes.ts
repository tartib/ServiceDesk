import { Router, Request, Response } from 'express';
import { param, query } from 'express-validator';
import * as analyticsController from '../controllers/analytics.controller';
import { authenticate } from '../../../middleware/auth';
import { handleValidation } from '../../../shared/middleware/validate';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v2/pm/sprints/{sprintId}/burndown:
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
  handleValidation,
  (req: Request, res: Response) => analyticsController.getSprintBurndown(req, res)
);

/**
 * @swagger
 * /api/v2/pm/projects/{projectId}/velocity:
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
  handleValidation,
  (req: Request, res: Response) => analyticsController.getVelocityChart(req, res)
);

// Project statistics
router.get(
  '/projects/:projectId/stats',
  [param('projectId').isMongoId().withMessage('Invalid project ID')],
  handleValidation,
  (req: Request, res: Response) => analyticsController.getProjectStats(req, res)
);

// Cumulative flow diagram
router.get(
  '/projects/:projectId/cumulative-flow',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    query('days').optional().isNumeric(),
  ],
  handleValidation,
  (req: Request, res: Response) => analyticsController.getCumulativeFlow(req, res)
);

export default router;
