import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import * as authController from '../../controllers/pm/auth.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/v1/pm/auth/register:
 *   post:
 *     summary: تسجيل مستخدم جديد
 *     description: إنشاء حساب مستخدم جديد في النظام
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: Password123
 *               firstName:
 *                 type: string
 *                 example: أحمد
 *               lastName:
 *                 type: string
 *                 example: محمد
 *     responses:
 *       201:
 *         description: تم التسجيل بنجاح
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
  '/register',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and number'),
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('organizationName').optional().trim(),
  ],
  (req: Request, res: Response) => authController.register(req as any, res)
);

/**
 * @swagger
 * /api/v1/pm/auth/login:
 *   post:
 *     summary: تسجيل الدخول
 *     description: تسجيل الدخول إلى النظام
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: Password123
 *     responses:
 *       200:
 *         description: تم تسجيل الدخول بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  (req: Request, res: Response) => authController.login(req as any, res)
);

/**
 * @swagger
 * /api/v1/pm/auth/refresh:
 *   post:
 *     summary: تحديث التوكن
 *     description: تحديث رمز الوصول
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: تم تحديث التوكن بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post('/refresh', (req: Request, res: Response) => authController.refreshToken(req as any, res));

/**
 * @swagger
 * /api/v1/pm/auth/logout:
 *   post:
 *     summary: تسجيل الخروج
 *     description: تسجيل الخروج من النظام
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم تسجيل الخروج بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post('/logout', authenticate, (req: Request, res: Response) => authController.logout(req as any, res));

router.post(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and number'),
  ],
  (req: Request, res: Response) => authController.changePassword(req as any, res)
);

router.get('/me', authenticate, (req: Request, res: Response) => authController.me(req as any, res));

export default router;
