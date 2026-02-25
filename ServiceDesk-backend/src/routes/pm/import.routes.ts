import { Router, Request, Response } from 'express';
import { param } from 'express-validator';
import * as importController from '../../controllers/pm/import.controller';
import { authenticate } from '../../middleware/auth';
import { uploadCSV } from '../../middleware/upload';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/pm/projects/{projectId}/import/csv:
 *   post:
 *     summary: Import tasks from CSV file
 *     description: Upload a CSV file to bulk-create tasks in the project backlog
 *     tags:
 *       - Import
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV file (.csv, max 2MB)
 *     responses:
 *       200:
 *         description: Import completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     imported:
 *                       type: number
 *                     skipped:
 *                       type: number
 *                     warnings:
 *                       type: number
 *                     total:
 *                       type: number
 */
router.post(
  '/projects/:projectId/import/csv',
  [param('projectId').isMongoId().withMessage('Invalid project ID')],
  uploadCSV,
  (req: Request, res: Response) => importController.importTasksFromCSV(req as any, res)
);

export default router;
