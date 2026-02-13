/**
 * Team Routes - مسارات الفرق
 * Support Team Management API
 */

import { Router } from 'express';
import {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  updateMemberRole,
  getTeamMembers,
} from '../controllers/teamController';

const router = Router();

/**
 * @swagger
 * /api/v1/teams:
 *   post:
 *     summary: إنشاء فريق جديد
 *     description: إنشاء فريق دعم جديد
 *     tags:
 *       - Teams
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
 *                 example: فريق الدعم الأول
 *               description:
 *                 type: string
 *                 example: فريق الدعم الرئيسي للعملاء
 *           example:
 *             name: فريق الدعم الأول
 *             description: فريق الدعم الرئيسي للعملاء
 *     responses:
 *       201:
 *         description: تم إنشاء الفريق بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 201
 *               message: تم إنشاء الفريق بنجاح
 *               data:
 *                 _id: 507f1f77bcf86cd799439011
 *                 name: فريق الدعم الأول
 *                 description: فريق الدعم الرئيسي للعملاء
 *       400:
 *         description: البيانات المدخلة غير صحيحة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 */
router.post('/', createTeam);

/**
 * @swagger
 * /api/v1/teams:
 *   get:
 *     summary: الحصول على جميع الفرق
 *     description: استرجاع جميع فرق الدعم
 *     tags:
 *       - Teams
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
 *         description: قائمة الفرق
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم جلب الفرق بنجاح
 *               data:
 *                 - _id: 507f1f77bcf86cd799439011
 *                   name: فريق الدعم الأول
 *                   description: فريق الدعم الرئيسي للعملاء
 *                   memberCount: 5
 */
router.get('/', getTeams);

/**
 * @swagger
 * /api/v1/teams/{id}:
 *   get:
 *     summary: الحصول على الفريق بالمعرّف
 *     description: استرجاع تفاصيل فريق معين
 *     tags:
 *       - Teams
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: معرّف الفريق
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: تفاصيل الفريق
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم جلب الفريق بنجاح
 *               data:
 *                 _id: 507f1f77bcf86cd799439011
 *                 name: فريق الدعم الأول
 *                 description: فريق الدعم الرئيسي للعملاء
 *       404:
 *         description: الفريق غير موجود
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundResponse'
 */
router.get('/:id', getTeamById);

/**
 * @swagger
 * /api/v1/teams/{id}:
 *   put:
 *     summary: تحديث الفريق
 *     description: تحديث معلومات الفريق
 *     tags:
 *       - Teams
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: معرّف الفريق
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
 *                 example: فريق الدعم المحدّث
 *               description:
 *                 type: string
 *                 example: فريق الدعم المحدّث للعملاء
 *           example:
 *             name: فريق الدعم المحدّث
 *             description: فريق الدعم المحدّث للعملاء
 *     responses:
 *       200:
 *         description: تم تحديث الفريق بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم تحديث الفريق بنجاح
 *       404:
 *         description: الفريق غير موجود
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundResponse'
 */
router.put('/:id', updateTeam);

/**
 * @swagger
 * /api/v1/teams/{id}:
 *   delete:
 *     summary: حذف الفريق
 *     description: حذف فريق من النظام
 *     tags:
 *       - Teams
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: معرّف الفريق
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: تم حذف الفريق بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم حذف الفريق بنجاح
 *       404:
 *         description: الفريق غير موجود
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundResponse'
 */
router.delete('/:id', deleteTeam);

/**
 * @swagger
 * /api/v1/teams/{id}/members:
 *   get:
 *     summary: الحصول على أعضاء الفريق
 *     description: استرجاع جميع أعضاء الفريق
 *     tags:
 *       - Teams
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: معرّف الفريق
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: قائمة أعضاء الفريق
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم جلب أعضاء الفريق بنجاح
 *               data:
 *                 - _id: 507f1f77bcf86cd799439011
 *                   name: أحمد محمد
 *                   email: ahmad@example.com
 *                   role: lead
 *       404:
 *         description: الفريق غير موجود
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundResponse'
 */
router.get('/:id/members', getTeamMembers);

/**
 * @swagger
 * /api/v1/teams/{id}/members:
 *   post:
 *     summary: Add team member
 *     description: Add a user to a team
 *     tags:
 *       - Teams
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Member added successfully
 *       404:
 *         description: Team or user not found
 */
router.post('/:id/members', addTeamMember);

/**
 * @swagger
 * /api/v1/teams/{id}/members/{userId}:
 *   delete:
 *     summary: Remove team member
 *     description: Remove a user from a team
 *     tags:
 *       - Teams
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member removed successfully
 *       404:
 *         description: Team or member not found
 */
router.delete('/:id/members/:userId', removeTeamMember);

/**
 * @swagger
 * /api/v1/teams/{id}/members/{userId}:
 *   patch:
 *     summary: Update member role
 *     description: Update a team member's role
 *     tags:
 *       - Teams
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
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
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Member role updated successfully
 *       404:
 *         description: Team or member not found
 */
router.patch('/:id/members/:userId', updateMemberRole);

export default router;
