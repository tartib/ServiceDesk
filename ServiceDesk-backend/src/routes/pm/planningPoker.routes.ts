import { Router, Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import * as planningPokerController from '../../controllers/pm/planningPoker.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/pm/tasks/{taskId}/poker:
 *   post:
 *     summary: إنشاء جلسة Planning Poker
 *     description: إنشاء جلسة Planning Poker جديدة للمهمة
 *     tags:
 *       - Planning Poker
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
 *             properties:
 *               estimationType:
 *                 type: string
 *                 enum: [story_points, hours, days]
 *     responses:
 *       201:
 *         description: تم إنشاء الجلسة بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post(
  '/tasks/:taskId/poker',
  [
    param('taskId').isMongoId().withMessage('Invalid task ID'),
    body('estimationType').optional({ nullable: true, checkFalsy: true }).isIn(['story_points', 'hours', 'days']),
    // sprintId is completely optional - no validation, handled in controller
  ],
  (req: Request, res: Response) => planningPokerController.createSession(req as any, res)
);

/**
 * @swagger
 * /api/v1/pm/poker/{sessionId}:
 *   get:
 *     summary: الحصول على جلسة Planning Poker
 *     description: استرجاع تفاصيل جلسة Planning Poker
 *     tags:
 *       - Planning Poker
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: تفاصيل الجلسة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get(
  '/poker/:sessionId',
  [param('sessionId').isMongoId().withMessage('Invalid session ID')],
  (req: Request, res: Response) => planningPokerController.getSession(req as any, res)
);

/**
 * @swagger
 * /api/v1/pm/sprints/{sprintId}/poker:
 *   get:
 *     summary: الحصول على جلسات Sprint
 *     description: استرجاع جميع جلسات Planning Poker للـ Sprint
 *     tags:
 *       - Planning Poker
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sprintId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [voting, revealed, completed]
 *     responses:
 *       200:
 *         description: قائمة الجلسات
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get(
  '/sprints/:sprintId/poker',
  [
    param('sprintId').isMongoId().withMessage('Invalid sprint ID'),
    query('status').optional().isIn(['voting', 'revealed', 'completed']),
  ],
  (req: Request, res: Response) => planningPokerController.getSprintSessions(req as any, res)
);

/**
 * @swagger
 * /api/v1/pm/poker/{sessionId}/vote:
 *   post:
 *     summary: تقديم تصويت
 *     description: تقديم تصويت في جلسة Planning Poker
 *     tags:
 *       - Planning Poker
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
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
 *               value:
 *                 type: number
 *     responses:
 *       200:
 *         description: تم تقديم التصويت بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post(
  '/poker/:sessionId/vote',
  [
    param('sessionId').isMongoId().withMessage('Invalid session ID'),
    body('value').notEmpty().withMessage('Vote value is required'),
  ],
  (req: Request, res: Response) => planningPokerController.submitVote(req as any, res)
);

/**
 * @swagger
 * /api/v1/pm/poker/{sessionId}/reveal:
 *   post:
 *     summary: الكشف عن الأصوات
 *     description: الكشف عن جميع الأصوات في الجلسة
 *     tags:
 *       - Planning Poker
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: تم الكشف عن الأصوات بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post(
  '/poker/:sessionId/reveal',
  [param('sessionId').isMongoId().withMessage('Invalid session ID')],
  (req: Request, res: Response) => planningPokerController.revealVotes(req as any, res)
);

/**
 * @swagger
 * /api/v1/pm/poker/{sessionId}/new-round:
 *   post:
 *     summary: بدء جولة تصويت جديدة
 *     description: بدء جولة تصويت جديدة في الجلسة
 *     tags:
 *       - Planning Poker
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: تم بدء الجولة الجديدة بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post(
  '/poker/:sessionId/new-round',
  [param('sessionId').isMongoId().withMessage('Invalid session ID')],
  (req: Request, res: Response) => planningPokerController.startNewRound(req as any, res)
);

/**
 * @swagger
 * /api/v1/pm/poker/{sessionId}/complete:
 *   post:
 *     summary: إكمال الجلسة
 *     description: إكمال جلسة Planning Poker وحفظ التقدير
 *     tags:
 *       - Planning Poker
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
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
 *               finalEstimate:
 *                 type: number
 *     responses:
 *       200:
 *         description: تم إكمال الجلسة بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post(
  '/poker/:sessionId/complete',
  [
    param('sessionId').isMongoId().withMessage('Invalid session ID'),
    body('finalEstimate').isNumeric().withMessage('Final estimate is required'),
  ],
  (req: Request, res: Response) => planningPokerController.completeSession(req as any, res)
);

/**
 * @swagger
 * /api/v1/pm/poker/{sessionId}:
 *   delete:
 *     summary: إلغاء الجلسة
 *     description: إلغاء جلسة Planning Poker
 *     tags:
 *       - Planning Poker
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: تم إلغاء الجلسة بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.delete(
  '/poker/:sessionId',
  [param('sessionId').isMongoId().withMessage('Invalid session ID')],
  (req: Request, res: Response) => planningPokerController.cancelSession(req as any, res)
);

export default router;
