import { Router } from 'express';
import * as kpiController from '../controllers/kpiController';

const router = Router();

/**
 * @swagger
 * /api/v1/kpis:
 *   get:
 *     summary: الحصول على جميع مؤشرات الأداء
 *     description: استرجاع جميع تعريفات مؤشرات الأداء الرئيسية
 *     tags:
 *       - KPIs
 *     responses:
 *       200:
 *         description: قائمة مؤشرات الأداء
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم جلب مؤشرات الأداء بنجاح
 *               data:
 *                 - _id: 507f1f77bcf86cd799439011
 *                   name: معدل حل الحوادث
 *                   target: 95
 *                   unit: '%'
 */
router.get('/', kpiController.getAllKPIs);

/**
 * @swagger
 * /api/v1/kpis/{id}:
 *   get:
 *     summary: الحصول على مؤشر الأداء بالمعرّف
 *     description: استرجاع مؤشر أداء معين
 *     tags:
 *       - KPIs
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: معرّف مؤشر الأداء
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: تفاصيل مؤشر الأداء
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم جلب مؤشر الأداء بنجاح
 *               data:
 *                 _id: 507f1f77bcf86cd799439011
 *                 name: معدل حل الحوادث
 *                 target: 95
 *                 current: 92.5
 *       404:
 *         description: مؤشر الأداء غير موجود
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundResponse'
 */
router.get('/:id', kpiController.getKPIById);

/**
 * @swagger
 * /api/v1/kpis:
 *   post:
 *     summary: Create KPI
 *     description: Create a new KPI definition
 *     tags:
 *       - KPIs
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - target
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               target:
 *                 type: number
 *               unit:
 *                 type: string
 *     responses:
 *       201:
 *         description: KPI created
 */
router.post('/', kpiController.createKPI);

/**
 * @swagger
 * /api/v1/kpis/{id}:
 *   put:
 *     summary: Update KPI
 *     description: Update a KPI definition
 *     tags:
 *       - KPIs
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
 *               name:
 *                 type: string
 *               target:
 *                 type: number
 *     responses:
 *       200:
 *         description: KPI updated
 *       404:
 *         description: KPI not found
 */
router.put('/:id', kpiController.updateKPI);

/**
 * @swagger
 * /api/v1/kpis/{id}:
 *   delete:
 *     summary: Delete KPI
 *     description: Delete a KPI definition
 *     tags:
 *       - KPIs
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: KPI deleted
 *       404:
 *         description: KPI not found
 */
router.delete('/:id', kpiController.deleteKPI);

export default router;
