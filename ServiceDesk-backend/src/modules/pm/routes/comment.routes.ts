import { Router, Request, Response } from 'express';
import { body, param } from 'express-validator';
import * as commentController from '../controllers/comment.controller';
import { authenticate } from '../../../middleware/auth';
import { handleValidation } from '../../../shared/middleware/validate';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v2/pm/tasks/{taskId}/comments:
 *   post:
 *     summary: إنشاء تعليق على المهمة
 *     description: إضافة تعليق جديد على المهمة
 *     tags:
 *       - Comments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: هذا تعليق على المهمة
 *     responses:
 *       201:
 *         description: تم إنشاء التعليق بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post(
  '/tasks/:taskId/comments',
  [
    param('taskId').isMongoId().withMessage('Invalid task ID'),
    body('content').trim().notEmpty().withMessage('Content is required'),
    body('parentId').optional().isMongoId(),
  ],
  handleValidation,
  (req: Request, res: Response) => commentController.createComment(req, res)
);

/**
 * @swagger
 * /api/v2/pm/tasks/{taskId}/comments:
 *   get:
 *     summary: الحصول على تعليقات المهمة
 *     description: استرجاع جميع التعليقات على المهمة
 *     tags:
 *       - Comments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: قائمة التعليقات
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get(
  '/tasks/:taskId/comments',
  [param('taskId').isMongoId().withMessage('Invalid task ID')],
  handleValidation,
  (req: Request, res: Response) => commentController.getComments(req, res)
);

/**
 * @swagger
 * /api/v2/pm/comments/{commentId}:
 *   put:
 *     summary: تحديث التعليق
 *     description: تحديث محتوى التعليق
 *     tags:
 *       - Comments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: تم تحديث التعليق بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.put(
  '/comments/:commentId',
  [
    param('commentId').isMongoId().withMessage('Invalid comment ID'),
    body('content').trim().notEmpty().withMessage('Content is required'),
  ],
  handleValidation,
  (req: Request, res: Response) => commentController.updateComment(req, res)
);

/**
 * @swagger
 * /api/v2/pm/comments/{commentId}:
 *   delete:
 *     summary: حذف التعليق
 *     description: حذف التعليق من النظام
 *     tags:
 *       - Comments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: تم حذف التعليق بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.delete(
  '/comments/:commentId',
  [param('commentId').isMongoId().withMessage('Invalid comment ID')],
  handleValidation,
  (req: Request, res: Response) => commentController.deleteComment(req, res)
);

/**
 * @swagger
 * /api/v2/pm/comments/{commentId}/reactions:
 *   post:
 *     summary: إضافة رد فعل على التعليق
 *     description: إضافة أو تبديل رد فعل (emoji) على التعليق
 *     tags:
 *       - Comments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emoji:
 *                 type: string
 *                 example: '👍'
 *     responses:
 *       200:
 *         description: تم إضافة رد الفعل بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post(
  '/comments/:commentId/reactions',
  [
    param('commentId').isMongoId().withMessage('Invalid comment ID'),
    body('emoji').trim().notEmpty().withMessage('Emoji is required'),
  ],
  handleValidation,
  (req: Request, res: Response) => commentController.addReaction(req, res)
);

export default router;
