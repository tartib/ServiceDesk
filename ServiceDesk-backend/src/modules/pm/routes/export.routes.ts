import { Router, Request, Response } from 'express';
import { param, query } from 'express-validator';
import * as exportController from '../controllers/export.controller';
import { authenticate } from '../../../middleware/auth';
import { handleValidation } from '../../../shared/middleware/validate';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v2/pm/export/projects/{projectId}/tasks:
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
  handleValidation,
  (req: Request, res: Response) => exportController.exportProjectTasks(req, res)
);

/**
 * @swagger
 * /api/v2/pm/export/sprints/{sprintId}/report:
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
  handleValidation,
  (req: Request, res: Response) => exportController.exportSprintReport(req, res)
);

/**
 * @swagger
 * /api/v2/pm/export/projects/{projectId}/summary:
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
  handleValidation,
  (req: Request, res: Response) => exportController.exportProjectSummary(req, res)
);

export default router;
