import { Router } from 'express';
import {
  getDashboardAnalytics,
  getDailyReport,
  getWeeklyReport,
  getMonthlyReport,
} from '../controllers/reportController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

// All report routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/reports/analytics:
 *   get:
 *     summary: الحصول على تحليلات لوحة التحكم
 *     description: استرجاع تحليلات لوحة التحكم ومؤشرات الأداء الرئيسية (متاح لجميع المستخدمين المصرحين)
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month]
 *         description: الفترة الزمنية للتحليلات
 *         example: week
 *     responses:
 *       200:
 *         description: بيانات تحليلات لوحة التحكم
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم جلب التحليلات بنجاح
 *               data:
 *                 totalIncidents: 150
 *                 openIncidents: 45
 *                 resolvedIncidents: 105
 *                 avgResolutionTime: 4.5
 *                 slaCompliance: 92.5
 *       401:
 *         description: غير مصرح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 */
router.get('/analytics', getDashboardAnalytics);

/**
 * @swagger
 * /api/v1/reports/daily:
 *   get:
 *     summary: الحصول على التقرير اليومي
 *     description: استرجاع تقرير الأداء اليومي (المشرفون والمديرون فقط)
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: تاريخ التقرير (YYYY-MM-DD)
 *         example: 2025-01-02
 *     responses:
 *       200:
 *         description: بيانات التقرير اليومي
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم جلب التقرير بنجاح
 *               data:
 *                 date: 2025-01-02
 *                 totalTickets: 25
 *                 resolvedTickets: 18
 *                 avgResolutionTime: 3.2
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
router.get('/daily', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), getDailyReport);

/**
 * @swagger
 * /api/v1/reports/weekly:
 *   get:
 *     summary: Get weekly report
 *     description: Retrieve weekly performance report (supervisor/manager only)
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: week
 *         schema:
 *           type: string
 *         description: Week identifier (YYYY-W##)
 *     responses:
 *       200:
 *         description: Weekly report data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/weekly', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), getWeeklyReport);

/**
 * @swagger
 * /api/v1/reports/monthly:
 *   get:
 *     summary: Get monthly report
 *     description: Retrieve monthly performance report (supervisor/manager only)
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *         description: Month identifier (YYYY-MM)
 *     responses:
 *       200:
 *         description: Monthly report data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/monthly', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), getMonthlyReport);

export default router;
