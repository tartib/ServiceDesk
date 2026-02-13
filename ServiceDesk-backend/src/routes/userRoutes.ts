import { Router } from 'express';
import { getAllUsers, getUsersByRole, getUserById, updateUser, searchUsers } from '../controllers/userController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: الحصول على جميع المستخدمين النشطين
 *     description: استرجاع قائمة بجميع المستخدمين النشطين في النظام
 *     tags:
 *       - Users
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
 *         description: تم جلب قائمة المستخدمين بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم جلب المستخدمين بنجاح
 *               data:
 *                 - _id: 507f1f77bcf86cd799439011
 *                   email: user1@example.com
 *                   firstName: أحمد
 *                   lastName: محمد
 *                   role: user
 *                 - _id: 507f1f77bcf86cd799439012
 *                   email: user2@example.com
 *                   firstName: فاطمة
 *                   lastName: علي
 *                   role: admin
 *       401:
 *         description: غير مصرح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 */
router.get('/', getAllUsers);

/**
 * @swagger
 * /api/v1/users/search:
 *   get:
 *     summary: البحث عن المستخدمين بالاسم
 *     description: البحث عن المستخدمين باستخدام الاسم الأول أو الأخير
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: كلمة البحث (الاسم)
 *         example: أحمد
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
 *                   email: ahmad@example.com
 *                   firstName: أحمد
 *                   lastName: محمد
 *       400:
 *         description: كلمة البحث مفقودة
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
router.get('/search', searchUsers);

/**
 * @swagger
 * /api/v1/users/role/{role}:
 *   get:
 *     summary: الحصول على المستخدمين حسب الدور
 *     description: استرجاع جميع المستخدمين بدور معين
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [admin, supervisor, manager, staff, viewer]
 *         description: دور المستخدم
 *         example: admin
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: رقم الصفحة
 *     responses:
 *       200:
 *         description: المستخدمون بالدور المحدد
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم جلب المستخدمين بنجاح
 *               data:
 *                 - _id: 507f1f77bcf86cd799439011
 *                   email: admin@example.com
 *                   firstName: محمد
 *                   lastName: علي
 *                   role: admin
 *       401:
 *         description: غير مصرح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 *       404:
 *         description: الدور غير موجود
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundResponse'
 */
router.get('/role/:role', getUsersByRole);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: الحصول على المستخدم بالمعرّف
 *     description: استرجاع تفاصيل مستخدم معين باستخدام معرّفه
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: معرّف المستخدم
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: تم جلب تفاصيل المستخدم بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم جلب المستخدم بنجاح
 *               data:
 *                 _id: 507f1f77bcf86cd799439011
 *                 email: user@example.com
 *                 firstName: أحمد
 *                 lastName: محمد
 *                 role: user
 *                 isActive: true
 *       401:
 *         description: غير مصرح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 *       404:
 *         description: المستخدم غير موجود
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundResponse'
 */
router.get('/:id', getUserById);
router.put('/:id', updateUser);

export default router;
