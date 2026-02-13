import { Router, Request, Response } from 'express';
import { query, param } from 'express-validator';
import * as searchController from '../../controllers/pm/search.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/pm/search:
 *   get:
 *     summary: البحث العام عن المهام والمشاريع
 *     description: البحث عن المهام والمشاريع باستخدام كلمات مفتاحية
 *     tags:
 *       - Search
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: كلمة البحث (على الأقل حرفين)
 *         example: تطوير
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [tasks, projects]
 *         description: نوع البحث
 *         example: tasks
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: الحد الأقصى للنتائج
 *     responses:
 *       200:
 *         description: نتائج البحث
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم البحث بنجاح
 *               data:
 *                 - _id: 507f1f77bcf86cd799439011
 *                   title: مهمة تطوير
 *                   type: task
 */
router.get(
  '/',
  [
    query('q').trim().isLength({ min: 2 }).withMessage('Query must be at least 2 characters'),
    query('type').optional().isIn(['tasks', 'projects']),
    query('limit').optional().isNumeric(),
  ],
  (req: Request, res: Response) => searchController.globalSearch(req as any, res)
);

/**
 * @swagger
 * /api/v1/pm/search/tasks:
 *   get:
 *     summary: البحث عن المهام مع الفلاتر
 *     description: البحث عن المهام مع إمكانية التصفية حسب الحالة والأولوية والمعين
 *     tags:
 *       - Search
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: كلمة البحث
 *         example: تطوير
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: حالة المهمة
 *         example: pending
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *         description: أولوية المهمة
 *         example: high
 *       - in: query
 *         name: assignee
 *         schema:
 *           type: string
 *         description: معرّف المعين
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: نتائج البحث
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get(
  '/tasks',
  [
    query('q').optional().trim(),
    query('status').optional(),
    query('type').optional(),
    query('priority').optional(),
    query('assignee').optional().isMongoId(),
    query('page').optional().isNumeric(),
    query('limit').optional().isNumeric(),
  ],
  (req: Request, res: Response) => searchController.searchTasks(req as any, res)
);

/**
 * @swagger
 * /api/v1/pm/search/projects/{projectId}/tasks:
 *   get:
 *     summary: البحث عن المهام في المشروع
 *     description: البحث عن المهام داخل مشروع معين
 *     tags:
 *       - Search
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: معرّف المشروع
 *         example: 507f1f77bcf86cd799439011
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: كلمة البحث
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: حالة المهمة
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *         description: أولوية المهمة
 *     responses:
 *       200:
 *         description: نتائج البحث
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: المشروع غير موجود
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundResponse'
 */
router.get(
  '/projects/:projectId/tasks',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    query('q').optional().trim(),
    query('status').optional(),
    query('type').optional(),
    query('priority').optional(),
  ],
  (req: Request, res: Response) => searchController.searchTasks(req as any, res)
);

export default router;
