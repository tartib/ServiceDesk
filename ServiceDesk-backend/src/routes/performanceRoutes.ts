import { Router } from 'express';
import * as performanceController from '../controllers/performanceController';
import { requireAuth, requireRole, canRecordPerformance } from '../middleware/performanceAuth';
import { PerformanceRole } from '../types/roles';

const router = Router();

/**
 * @swagger
 * /api/v1/performance:
 *   post:
 *     summary: تسجيل الأداء
 *     description: تسجيل بيانات الأداء لموظف
 *     tags:
 *       - Performance
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - rating
 *             properties:
 *               employeeId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4.5
 *               comments:
 *                 type: string
 *                 example: أداء ممتاز في هذا الشهر
 *           example:
 *             employeeId: 507f1f77bcf86cd799439011
 *             rating: 4.5
 *             comments: أداء ممتاز في هذا الشهر
 *     responses:
 *       201:
 *         description: تم تسجيل الأداء بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 201
 *               message: تم تسجيل الأداء بنجاح
 *               data:
 *                 _id: 507f1f77bcf86cd799439011
 *                 employeeId: 507f1f77bcf86cd799439011
 *                 rating: 4.5
 */
router.post('/', requireAuth, canRecordPerformance, performanceController.recordPerformance);

/**
 * @swagger
 * /api/v1/performance/{employeeId}:
 *   get:
 *     summary: الحصول على سجل الأداء
 *     description: استرجاع سجل الأداء لموظف
 *     tags:
 *       - Performance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: معرّف الموظف
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: سجل الأداء
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم جلب سجل الأداء بنجاح
 *               data:
 *                 - _id: 507f1f77bcf86cd799439011
 *                   rating: 4.5
 *                   month: January
 *                   year: 2025
 */
router.get('/:employeeId', requireAuth, performanceController.getPerformanceHistory);

/**
 * @swagger
 * /api/v1/performance/{employeeId}/month/{month}/{year}:
 *   get:
 *     summary: الحصول على أداء الشهر
 *     description: استرجاع بيانات الأداء لشهر معين
 *     tags:
 *       - Performance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: معرّف الموظف
 *         example: 507f1f77bcf86cd799439011
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *         description: رقم الشهر (1-12)
 *         example: 1
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: السنة
 *         example: 2025
 *     responses:
 *       200:
 *         description: بيانات أداء الشهر
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم جلب بيانات الأداء بنجاح
 *               data:
 *                 rating: 4.5
 *                 month: 1
 *                 year: 2025
 */
router.get('/:employeeId/month/:month/:year', requireAuth, performanceController.getMonthlyPerformance);

/**
 * @swagger
 * /api/v1/performance/{id}:
 *   put:
 *     summary: Update performance
 *     description: Update performance record
 *     tags:
 *       - Performance
 *     security:
 *       - bearerAuth: []
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
 *             properties:
 *               rating:
 *                 type: number
 *               comments:
 *                 type: string
 *     responses:
 *       200:
 *         description: Performance updated
 *       404:
 *         description: Performance record not found
 */
router.put('/:id', requireAuth, canRecordPerformance, performanceController.updatePerformance);

/**
 * @swagger
 * /api/v1/performance/{id}:
 *   delete:
 *     summary: Delete performance
 *     description: Delete a performance record (admin only)
 *     tags:
 *       - Performance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Performance deleted
 *       403:
 *         description: Forbidden - admin only
 *       404:
 *         description: Performance record not found
 */
router.delete('/:id', requireAuth, requireRole(PerformanceRole.ADMIN), performanceController.deletePerformance);

export default router;
