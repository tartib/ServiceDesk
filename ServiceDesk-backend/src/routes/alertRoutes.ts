import { Router } from 'express';
import * as alertController from '../controllers/alertController';

const router = Router();

/**
 * @swagger
 * /api/v1/alerts:
 *   get:
 *     summary: الحصول على التنبيهات
 *     description: استرجاع التنبيهات النشطة
 *     tags:
 *       - Alerts
 *     responses:
 *       200:
 *         description: قائمة التنبيهات
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم جلب التنبيهات بنجاح
 *               data:
 *                 - _id: 507f1f77bcf86cd799439011
 *                   title: تنبيه أداء النظام
 *                   message: استخدام CPU مرتفع
 *                   severity: high
 *                   createdAt: 2025-01-02T04:41:00Z
 */
router.get('/', alertController.getAlerts);

/**
 * @swagger
 * /api/v1/alerts/all:
 *   get:
 *     summary: الحصول على جميع التنبيهات
 *     description: استرجاع جميع التنبيهات بما فيها المؤرشفة
 *     tags:
 *       - Alerts
 *     responses:
 *       200:
 *         description: جميع التنبيهات
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم جلب جميع التنبيهات بنجاح
 *               data:
 *                 - _id: 507f1f77bcf86cd799439011
 *                   title: تنبيه أداء النظام
 *                   severity: high
 *                   archived: false
 */
router.get('/all', alertController.getAllAlerts);

/**
 * @swagger
 * /api/v1/alerts/employee/{employeeId}:
 *   get:
 *     summary: الحصول على تنبيهات الموظف
 *     description: استرجاع التنبيهات الخاصة بموظف معين
 *     tags:
 *       - Alerts
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
 *         description: تنبيهات الموظف
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم جلب التنبيهات بنجاح
 *               data:
 *                 - _id: 507f1f77bcf86cd799439011
 *                   title: تنبيه مهمة جديدة
 *                   message: تم تعيين مهمة جديدة لك
 *       404:
 *         description: الموظف غير موجود
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundResponse'
 */
router.get('/employee/:employeeId', alertController.getAlertsByEmployee);

/**
 * @swagger
 * /api/v1/alerts/{id}/acknowledge:
 *   put:
 *     summary: الإقرار بالتنبيه
 *     description: تحديد التنبيه كمُقرّ به
 *     tags:
 *       - Alerts
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: تم الإقرار بالتنبيه بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم الإقرار بالتنبيه بنجاح
 *       404:
 *         description: Alert not found
 */
router.put('/:id/acknowledge', alertController.acknowledgeAlert);

export default router;
