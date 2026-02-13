import { Router, Request, Response } from 'express';
import { body, param } from 'express-validator';
import * as boardController from '../../controllers/pm/board.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/pm/projects/{projectId}/board/config:
 *   get:
 *     summary: الحصول على إعدادات لوحة المشروع
 *     description: استرجاع إعدادات لوحة كانبان للمشروع
 *     tags:
 *       - Board
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
 *     responses:
 *       200:
 *         description: إعدادات اللوحة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم جلب إعدادات اللوحة بنجاح
 *               data:
 *                 _id: 507f1f77bcf86cd799439011
 *                 projectId: 507f1f77bcf86cd799439011
 *                 columns:
 *                   - _id: col1
 *                     name: To Do
 *                     order: 1
 *       404:
 *         description: المشروع غير موجود
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundResponse'
 */
// Full board data (active sprint + tasks grouped by status + board config)
router.get(
  '/projects/:projectId/board',
  [param('projectId').isMongoId().withMessage('Invalid project ID')],
  (req: Request, res: Response) => boardController.getFullBoard(req as any, res)
);

router.get(
  '/projects/:projectId/board/config',
  [param('projectId').isMongoId().withMessage('Invalid project ID')],
  (req: Request, res: Response) => boardController.getBoardByProject(req as any, res)
);

/**
 * @swagger
 * /api/v1/pm/projects/{projectId}/board/columns:
 *   post:
 *     summary: إنشاء عمود جديد
 *     description: إنشاء عمود جديد في لوحة كانبان
 *     tags:
 *       - Board
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: To Do
 *               statusId:
 *                 type: string
 *                 example: status1
 *               wipLimit:
 *                 type: number
 *                 example: 5
 *           example:
 *             name: To Do
 *             statusId: status1
 *             wipLimit: 5
 *     responses:
 *       201:
 *         description: تم إنشاء العمود بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: البيانات المدخلة غير صحيحة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 */
router.post(
  '/projects/:projectId/board/columns',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    body('name').trim().notEmpty().withMessage('Column name is required'),
    body('statusId').optional().trim(),
    body('wipLimit').optional().isNumeric(),
  ],
  (req: Request, res: Response) => boardController.createColumn(req as any, res)
);

/**
 * @swagger
 * /api/v1/pm/projects/{projectId}/board/columns/{columnId}:
 *   patch:
 *     summary: تحديث العمود
 *     description: تحديث معلومات العمود
 *     tags:
 *       - Board
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
 *       - in: path
 *         name: columnId
 *         required: true
 *         schema:
 *           type: string
 *         description: معرّف العمود
 *         example: col1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: In Progress
 *               wipLimit:
 *                 type: number
 *                 example: 3
 *           example:
 *             name: In Progress
 *             wipLimit: 3
 *     responses:
 *       200:
 *         description: تم تحديث العمود بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: العمود غير موجود
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundResponse'
 */
router.patch(
  '/projects/:projectId/board/columns/:columnId',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    param('columnId').notEmpty().withMessage('Column ID is required'),
    body('name').optional().trim().notEmpty(),
    body('wipLimit').optional().isNumeric(),
  ],
  (req: Request, res: Response) => boardController.updateColumn(req as any, res)
);

/**
 * @swagger
 * /api/v1/pm/projects/{projectId}/board/columns/{columnId}:
 *   delete:
 *     summary: حذف العمود
 *     description: حذف عمود من اللوحة
 *     tags:
 *       - Board
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
 *       - in: path
 *         name: columnId
 *         required: true
 *         schema:
 *           type: string
 *         description: معرّف العمود
 *         example: col1
 *     responses:
 *       200:
 *         description: تم حذف العمود بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: العمود غير موجود
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundResponse'
 */
router.delete(
  '/projects/:projectId/board/columns/:columnId',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    param('columnId').notEmpty().withMessage('Column ID is required'),
  ],
  (req: Request, res: Response) => boardController.deleteColumn(req as any, res)
);

/**
 * @swagger
 * /api/v1/pm/projects/{projectId}/board/columns/reorder:
 *   patch:
 *     summary: إعادة ترتيب الأعمدة
 *     description: إعادة ترتيب أعمدة اللوحة
 *     tags:
 *       - Board
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - columnOrder
 *             properties:
 *               columnOrder:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [col1, col2, col3]
 *           example:
 *             columnOrder: [col1, col2, col3]
 *     responses:
 *       200:
 *         description: تم إعادة الترتيب بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: البيانات المدخلة غير صحيحة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 */
router.patch(
  '/projects/:projectId/board/columns/reorder',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    body('columnOrder').isArray().withMessage('columnOrder must be an array'),
  ],
  (req: Request, res: Response) => boardController.reorderColumns(req as any, res)
);

/**
 * @swagger
 * /api/v1/pm/projects/{projectId}/members:
 *   get:
 *     summary: الحصول على أعضاء المشروع
 *     description: استرجاع قائمة أعضاء المشروع للتعيين
 *     tags:
 *       - Board
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
 *     responses:
 *       200:
 *         description: قائمة أعضاء المشروع
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم جلب أعضاء المشروع بنجاح
 *               data:
 *                 - _id: 507f1f77bcf86cd799439011
 *                   name: أحمد محمد
 *                   email: ahmad@example.com
 *                   role: lead
 *       404:
 *         description: المشروع غير موجود
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundResponse'
 */
router.get(
  '/projects/:projectId/members',
  [param('projectId').isMongoId().withMessage('Invalid project ID')],
  (req: Request, res: Response) => boardController.getProjectMembers(req as any, res)
);

export default router;
