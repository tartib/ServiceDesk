import { Router } from 'express';
import * as leaderboardController from '../controllers/leaderboardController';

const router = Router();

/**
 * @swagger
 * /api/v1/leaderboard:
 *   get:
 *     summary: الحصول على لوحة الترتيب
 *     description: استرجاع لوحة الترتيب العامة
 *     tags:
 *       - Leaderboard
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: الحد الأقصى للنتائج
 *     responses:
 *       200:
 *         description: بيانات لوحة الترتيب
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم جلب لوحة الترتيب بنجاح
 *               data:
 *                 - rank: 1
 *                   employeeName: أحمد محمد
 *                   score: 950
 *                 - rank: 2
 *                   employeeName: فاطمة علي
 *                   score: 920
 */
router.get('/', leaderboardController.getLeaderboard);

/**
 * @swagger
 * /api/v1/leaderboard/month/{month}/{year}:
 *   get:
 *     summary: الحصول على لوحة الترتيب حسب الشهر
 *     description: استرجاع لوحة الترتيب لشهر معين
 *     tags:
 *       - Leaderboard
 *     parameters:
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
 *         description: لوحة الترتيب الشهرية
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم جلب لوحة الترتيب بنجاح
 *               data:
 *                 - rank: 1
 *                   employeeName: أحمد محمد
 *                   score: 950
 */
router.get('/month/:month/:year', leaderboardController.getLeaderboardByMonth);

/**
 * @swagger
 * /api/v1/leaderboard/department/{department}:
 *   get:
 *     summary: الحصول على لوحة الترتيب حسب القسم
 *     description: استرجاع لوحة الترتيب لقسم معين
 *     tags:
 *       - Leaderboard
 *     parameters:
 *       - in: path
 *         name: department
 *         required: true
 *         schema:
 *           type: string
 *         description: اسم القسم
 *         example: تقنية المعلومات
 *     responses:
 *       200:
 *         description: لوحة ترتيب القسم
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم جلب لوحة الترتيب بنجاح
 *               data:
 *                 - rank: 1
 *                   employeeName: أحمد محمد
 *                   score: 950
 */
router.get('/department/:department', leaderboardController.getLeaderboardByDepartment);

export default router;
