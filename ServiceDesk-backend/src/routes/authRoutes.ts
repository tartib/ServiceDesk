import { Router } from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { validate } from '../shared/middleware/validate';
import {
  loginSchema,
  registerSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../shared/validation/schemas';

const router = Router();

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: تسجيل مستخدم جديد
 *     description: إنشاء حساب مستخدم جديد باستخدام البريد الإلكتروني وكلمة المرور
 *     tags:
 *       - Authentication
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
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: SecurePass123
 *               firstName:
 *                 type: string
 *                 example: أحمد
 *               lastName:
 *                 type: string
 *                 example: محمد
 *           example:
 *             email: user@example.com
 *             password: SecurePass123
 *             firstName: أحمد
 *             lastName: محمد
 *     responses:
 *       201:
 *         description: تم تسجيل المستخدم بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 201
 *               message: تم إنشاء الحساب بنجاح
 *               data:
 *                 _id: 507f1f77bcf86cd799439011
 *                 email: user@example.com
 *                 firstName: أحمد
 *                 lastName: محمد
 *       400:
 *         description: البيانات المدخلة غير صحيحة أو البريد مستخدم بالفعل
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       429:
 *         description: محاولات تسجيل كثيرة جداً
 */
router.post('/register', authLimiter, validate(registerSchema), register);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: تسجيل الدخول
 *     description: المصادقة باستخدام البريد الإلكتروني وكلمة المرور، إرجاع رمز JWT
 *     tags:
 *       - Authentication
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
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123
 *           example:
 *             email: user@example.com
 *             password: SecurePass123
 *     responses:
 *       200:
 *         description: تم تسجيل الدخول بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم تسجيل الدخول بنجاح
 *               data:
 *                 token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   _id: 507f1f77bcf86cd799439011
 *                   email: user@example.com
 *                   firstName: أحمد
 *                   lastName: محمد
 *                   role: user
 *       400:
 *         description: البيانات المدخلة غير صحيحة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: بيانات اعتماد غير صحيحة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 *       429:
 *         description: محاولات دخول كثيرة جداً
 */
router.post('/login', authLimiter, validate(loginSchema), login);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: الحصول على ملف المستخدم الحالي
 *     description: استرجاع معلومات الملف الشخصي للمستخدم المصرح
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم جلب الملف الشخصي بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم جلب الملف الشخصي بنجاح
 *               data:
 *                 _id: 507f1f77bcf86cd799439011
 *                 email: user@example.com
 *                 firstName: أحمد
 *                 lastName: محمد
 *                 role: user
 *                 isActive: true
 *       401:
 *         description: غير مصرح - رمز غير صحيح أو مفقود
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 */
router.get('/me', authenticate, getMe);

/**
 * @swagger
 * /api/v1/auth/profile:
 *   patch:
 *     summary: تحديث الملف الشخصي
 *     description: تحديث معلومات الملف الشخصي للمستخدم المصرح
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: أحمد
 *               lastName:
 *                 type: string
 *                 example: محمد
 *               phone:
 *                 type: string
 *                 example: +966501234567
 *               department:
 *                 type: string
 *                 example: دعم تقني
 *           example:
 *             firstName: أحمد
 *             lastName: محمد
 *             phone: +966501234567
 *             department: دعم تقني
 *     responses:
 *       200:
 *         description: تم تحديث الملف الشخصي بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم تحديث الملف الشخصي بنجاح
 *               data:
 *                 _id: 507f1f77bcf86cd799439011
 *                 firstName: أحمد
 *                 lastName: محمد
 *                 phone: +966501234567
 *                 department: دعم تقني
 *       400:
 *         description: البيانات المدخلة غير صحيحة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: غير مصرح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 */
router.patch('/profile', authenticate, validate(updateProfileSchema), updateProfile);

/**
 * @swagger
 * /api/v1/auth/password:
 *   patch:
 *     summary: تغيير كلمة المرور
 *     description: تغيير كلمة المرور للمستخدم المصرح
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 example: OldPass123
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: NewPass456
 *           example:
 *             currentPassword: OldPass123
 *             newPassword: NewPass456
 *     responses:
 *       200:
 *         description: تم تغيير كلمة المرور بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم تغيير كلمة المرور بنجاح
 *       400:
 *         description: كلمة المرور الحالية غير صحيحة أو كلمة المرور الجديدة ضعيفة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: غير مصرح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 */
router.patch('/password', authenticate, validate(changePasswordSchema), changePassword);

export default router;
