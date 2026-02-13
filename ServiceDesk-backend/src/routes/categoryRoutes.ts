import { Router } from 'express';
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  hardDeleteCategory,
} from '../controllers/categoryController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     summary: الحصول على جميع الفئات
 *     description: استرجاع جميع الفئات النشطة
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: رقم الصفحة
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: عدد النتائج في الصفحة
 *     responses:
 *       200:
 *         description: قائمة الفئات
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم جلب الفئات بنجاح
 *               data:
 *                 - _id: 507f1f77bcf86cd799439011
 *                   name: البريد الإلكتروني
 *                   description: مشاكل البريد الإلكتروني والتطبيقات المرتبطة
 *                   isActive: true
 *                 - _id: 507f1f77bcf86cd799439012
 *                   name: الشبكة
 *                   description: مشاكل الشبكة والاتصال
 *                   isActive: true
 *       401:
 *         description: غير مصرح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 */
router.get('/', getAllCategories);

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   get:
 *     summary: الحصول على الفئة بالمعرّف
 *     description: استرجاع فئة معينة باستخدام معرّفها
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: معرّف الفئة
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: تفاصيل الفئة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم جلب الفئة بنجاح
 *               data:
 *                 _id: 507f1f77bcf86cd799439011
 *                 name: البريد الإلكتروني
 *                 description: مشاكل البريد الإلكتروني والتطبيقات المرتبطة
 *                 isActive: true
 *       401:
 *         description: غير مصرح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 *       404:
 *         description: الفئة غير موجودة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundResponse'
 */
router.get('/:id', getCategoryById);

/**
 * @swagger
 * /api/v1/categories:
 *   post:
 *     summary: إنشاء فئة جديدة
 *     description: إنشاء فئة جديدة (المديرون فقط)
 *     tags:
 *       - Categories
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
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *                 example: مشاكل الأجهزة
 *               description:
 *                 type: string
 *                 example: مشاكل متعلقة بمكونات الأجهزة
 *               color:
 *                 type: string
 *                 example: '#FF5733'
 *           example:
 *             name: مشاكل الأجهزة
 *             description: مشاكل متعلقة بمكونات الأجهزة
 *             color: '#FF5733'
 *     responses:
 *       201:
 *         description: تم إنشاء الفئة بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 201
 *               message: تم إنشاء الفئة بنجاح
 *               data:
 *                 _id: 507f1f77bcf86cd799439013
 *                 name: مشاكل الأجهزة
 *                 description: مشاكل متعلقة بمكونات الأجهزة
 *                 color: '#FF5733'
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
 *       403:
 *         description: ليس لديك صلاحية
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForbiddenResponse'
 */
router.post('/', authorize(UserRole.MANAGER), createCategory);

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   put:
 *     summary: تحديث الفئة
 *     description: تحديث فئة موجودة (المديرون فقط)
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: معرّف الفئة
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
 *                 example: مشاكل الأجهزة المحدثة
 *               description:
 *                 type: string
 *                 example: مشاكل متعلقة بمكونات الأجهزة والطابعات
 *               color:
 *                 type: string
 *                 example: '#FF6633'
 *           example:
 *             name: مشاكل الأجهزة المحدثة
 *             description: مشاكل متعلقة بمكونات الأجهزة والطابعات
 *             color: '#FF6633'
 *     responses:
 *       200:
 *         description: تم تحديث الفئة بنجاح
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
 *       401:
 *         description: غير مصرح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 *       403:
 *         description: ليس لديك صلاحية
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForbiddenResponse'
 *       404:
 *         description: الفئة غير موجودة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundResponse'
 */
router.put('/:id', authorize(UserRole.MANAGER), updateCategory);

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   delete:
 *     summary: حذف الفئة (حذف ناعم)
 *     description: حذف الفئة بشكل ناعم (المديرون فقط) - تحديد الفئة كغير نشطة
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: معرّف الفئة
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: تم حذف الفئة بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم حذف الفئة بنجاح
 *       401:
 *         description: غير مصرح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 *       403:
 *         description: ليس لديك صلاحية
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForbiddenResponse'
 *       404:
 *         description: الفئة غير موجودة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundResponse'
 */
router.delete('/:id', authorize(UserRole.MANAGER), deleteCategory);

/**
 * @swagger
 * /api/v1/categories/{id}/permanent:
 *   delete:
 *     summary: حذف الفئة بشكل دائم
 *     description: حذف الفئة بشكل دائم من قاعدة البيانات (المديرون فقط)
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: معرّف الفئة
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: تم حذف الفئة بشكل دائم
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم حذف الفئة بشكل دائم
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Category not found
 */
router.delete('/:id/permanent', authorize(UserRole.MANAGER), hardDeleteCategory);

export default router;
