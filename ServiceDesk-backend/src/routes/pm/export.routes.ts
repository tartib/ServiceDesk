import { Router, Request, Response } from 'express';
import { param, query } from 'express-validator';
import * as exportController from '../../controllers/pm/export.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/pm/export/projects/{projectId}/tasks:
 *   get:
 *     summary: تصدير مهام المشروع
 *     description: تصدير مهام المشروع بصيغة JSON أو CSV
 *     tags:
 *       - Export
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *     responses:
 *       200:
 *         description: تم تصدير المهام بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get(
  '/projects/:projectId/tasks',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    query('format').optional().isIn(['json', 'csv']),
  ],
  (req: Request, res: Response) => exportController.exportProjectTasks(req as any, res)
);

/**
 * @swagger
 * /api/v1/pm/export/sprints/{sprintId}/report:
 *   get:
 *     summary: تصدير تقرير Sprint
 *     description: تصدير تقرير مفصل عن Sprint
 *     tags:
 *       - Export
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sprintId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: تم تصدير التقرير بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get(
  '/sprints/:sprintId/report',
  [param('sprintId').isMongoId().withMessage('Invalid sprint ID')],
  (req: Request, res: Response) => exportController.exportSprintReport(req as any, res)
);

/**
 * @swagger
 * /api/v1/pm/export/projects/{projectId}/summary:
 *   get:
 *     summary: تصدير ملخص المشروع
 *     description: تصدير ملخص شامل للمشروع
 *     tags:
 *       - Export
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: تم تصدير الملخص بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get(
  '/projects/:projectId/summary',
  [param('projectId').isMongoId().withMessage('Invalid project ID')],
  (req: Request, res: Response) => exportController.exportProjectSummary(req as any, res)
);

export default router;
