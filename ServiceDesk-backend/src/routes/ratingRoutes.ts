import { Router } from 'express';
import * as ratingController from '../controllers/ratingController';

const router = Router();

/**
 * @swagger
 * /api/v1/ratings/{employeeId}:
 *   get:
 *     summary: الحصول على سجل تقييمات الموظف
 *     description: استرجاع سجل التقييمات الخاص بموظف معين
 *     tags:
 *       - Ratings
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: معرّف الموظف
 *         example: 507f1f77bcf86cd799439011
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: الحد الأقصى للنتائج
 *     responses:
 *       200:
 *         description: سجل التقييمات
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم جلب سجل التقييمات بنجاح
 *               data:
 *                 - _id: 507f1f77bcf86cd799439011
 *                   rating: 4.5
 *                   month: January
 *                   year: 2025
 *       404:
 *         description: الموظف غير موجود
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundResponse'
 */
router.get('/:employeeId', ratingController.getEmployeeRatingHistory);

/**
 * @swagger
 * /api/v1/ratings/{employeeId}/current:
 *   get:
 *     summary: الحصول على تقييم الشهر الحالي
 *     description: استرجاع تقييم الموظف للشهر الحالي
 *     tags:
 *       - Ratings
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
 *         description: تقييم الشهر الحالي
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم جلب التقييم بنجاح
 *               data:
 *                 rating: 4.7
 *                 month: January
 *                 year: 2025
 *       404:
 *         description: الموظف غير موجود
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundResponse'
 */
router.get('/:employeeId/current', ratingController.getCurrentMonthRating);

export default router;
