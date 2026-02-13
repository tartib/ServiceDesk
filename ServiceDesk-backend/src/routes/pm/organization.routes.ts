import { Router, Request, Response } from 'express';
import { body, param } from 'express-validator';
import * as organizationController from '../../controllers/pm/organization.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/pm/organizations:
 *   post:
 *     summary: إنشاء منظمة جديدة
 *     description: إنشاء منظمة جديدة في النظام
 *     tags:
 *       - Organization
 *     security:
 *       - bearerAuth: []
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
 *                 example: منظمتي
 *               description:
 *                 type: string
 *                 example: وصف المنظمة
 *     responses:
 *       201:
 *         description: تم إنشاء المنظمة بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('description').optional().trim(),
    body('settings').optional().isObject(),
  ],
  (req: Request, res: Response) => organizationController.createOrganization(req as any, res)
);

/**
 * @swagger
 * /api/v1/pm/organizations:
 *   get:
 *     summary: الحصول على المنظمات
 *     description: استرجاع قائمة المنظمات
 *     tags:
 *       - Organization
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: قائمة المنظمات
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get('/', (req: Request, res: Response) => organizationController.getOrganizations(req as any, res));

/**
 * @swagger
 * /api/v1/pm/organizations/{organizationId}:
 *   get:
 *     summary: الحصول على المنظمة
 *     description: استرجاع تفاصيل منظمة معينة
 *     tags:
 *       - Organization
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: تفاصيل المنظمة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: المنظمة غير موجودة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundResponse'
 */
router.get(
  '/:organizationId',
  [param('organizationId').isMongoId().withMessage('Invalid organization ID')],
  (req: Request, res: Response) => organizationController.getOrganization(req as any, res)
);

/**
 * @swagger
 * /api/v1/pm/organizations/{organizationId}:
 *   put:
 *     summary: تحديث المنظمة
 *     description: تحديث معلومات المنظمة
 *     tags:
 *       - Organization
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: تم تحديث المنظمة بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.put(
  '/:organizationId',
  [
    param('organizationId').isMongoId().withMessage('Invalid organization ID'),
    body('name').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('settings').optional().isObject(),
  ],
  (req: Request, res: Response) => organizationController.updateOrganization(req as any, res)
);

router.get(
  '/:organizationId/members',
  [param('organizationId').isMongoId().withMessage('Invalid organization ID')],
  (req: Request, res: Response) => organizationController.getOrganizationMembers(req as any, res)
);

router.post(
  '/:organizationId/members',
  [
    param('organizationId').isMongoId().withMessage('Invalid organization ID'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('role').optional().isIn(['owner', 'admin', 'member']),
  ],
  (req: Request, res: Response) => organizationController.inviteMember(req as any, res)
);

router.delete(
  '/:organizationId/members/:memberId',
  [
    param('organizationId').isMongoId().withMessage('Invalid organization ID'),
    param('memberId').isMongoId().withMessage('Invalid member ID'),
  ],
  (req: Request, res: Response) => organizationController.removeMember(req as any, res)
);

router.post(
  '/:organizationId/switch',
  [param('organizationId').isMongoId().withMessage('Invalid organization ID')],
  (req: Request, res: Response) => organizationController.switchOrganization(req as any, res)
);

export default router;
