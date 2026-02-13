import { Router } from 'express';
import { assetController } from '../controllers/assetController';

const router = Router();

/**
 * @swagger
 * /api/v1/assets:
 *   post:
 *     summary: إنشاء أصل جديد
 *     description: إنشاء أصل تكنولوجي جديد
 *     tags:
 *       - Assets
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - assetType
 *             properties:
 *               name:
 *                 type: string
 *                 example: جهاز كمبيوتر محمول Dell XPS 13
 *               assetType:
 *                 type: string
 *                 example: جهاز كمبيوتر محمول
 *               serialNumber:
 *                 type: string
 *                 example: SN123456789
 *               purchaseDate:
 *                 type: string
 *                 format: date
 *                 example: 2025-01-01
 *               status:
 *                 type: string
 *                 enum: [active, inactive, retired]
 *                 example: active
 *           example:
 *             name: جهاز كمبيوتر محمول Dell XPS 13
 *             assetType: جهاز كمبيوتر محمول
 *             serialNumber: SN123456789
 *             purchaseDate: 2025-01-01
 *             status: active
 *     responses:
 *       201:
 *         description: تم إنشاء الأصل بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 201
 *               message: تم إنشاء الأصل بنجاح
 *               data:
 *                 _id: 507f1f77bcf86cd799439011
 *                 name: جهاز كمبيوتر محمول Dell XPS 13
 *                 assetType: جهاز كمبيوتر محمول
 *                 serialNumber: SN123456789
 *                 status: active
 *       400:
 *         description: البيانات المدخلة غير صحيحة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 */
router.post('/', assetController.create);

/**
 * @swagger
 * /api/v1/assets:
 *   get:
 *     summary: الحصول على جميع الأصول
 *     description: استرجاع جميع الأصول التكنولوجية مع الترقيم
 *     tags:
 *       - Assets
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, retired]
 *         description: حالة الأصل
 *     responses:
 *       200:
 *         description: قائمة الأصول
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم جلب الأصول بنجاح
 *               data:
 *                 - _id: 507f1f77bcf86cd799439011
 *                   name: جهاز كمبيوتر محمول Dell XPS 13
 *                   assetType: جهاز كمبيوتر محمول
 *                   status: active
 */
router.get('/', assetController.getAll);

/**
 * @swagger
 * /api/v1/assets/stats:
 *   get:
 *     summary: Get asset statistics
 *     description: Retrieve asset statistics and summary
 *     tags:
 *       - Assets
 *     responses:
 *       200:
 *         description: Asset statistics
 */
router.get('/stats', assetController.getStats);

/**
 * @swagger
 * /api/v1/assets/user/{userId}:
 *   get:
 *     summary: Get assets by user
 *     description: Retrieve all assets assigned to a specific user
 *     tags:
 *       - Assets
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User's assets
 *       404:
 *         description: User not found
 */
router.get('/user/:userId', assetController.getByUser);

/**
 * @swagger
 * /api/v1/assets/{id}:
 *   get:
 *     summary: Get asset by ID
 *     description: Retrieve a specific asset
 *     tags:
 *       - Assets
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Asset details
 *       404:
 *         description: Asset not found
 */
router.get('/:id', assetController.getById);

/**
 * @swagger
 * /api/v1/assets/{id}:
 *   put:
 *     summary: Update asset
 *     description: Update asset information
 *     tags:
 *       - Assets
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
 *               assetType:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Asset updated successfully
 *       404:
 *         description: Asset not found
 */
router.put('/:id', assetController.update);

/**
 * @swagger
 * /api/v1/assets/{id}:
 *   delete:
 *     summary: Delete asset
 *     description: Delete an asset
 *     tags:
 *       - Assets
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Asset deleted successfully
 *       404:
 *         description: Asset not found
 */
router.delete('/:id', assetController.delete);

/**
 * @swagger
 * /api/v1/assets/{id}/assign:
 *   post:
 *     summary: Assign asset to user
 *     description: Assign an asset to a user
 *     tags:
 *       - Assets
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
 *               assignmentDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Asset assigned successfully
 *       404:
 *         description: Asset or user not found
 */
router.post('/:id/assign', assetController.assign);

/**
 * @swagger
 * /api/v1/assets/{id}/unassign:
 *   post:
 *     summary: Unassign asset from user
 *     description: Remove asset assignment from a user
 *     tags:
 *       - Assets
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Asset unassigned successfully
 *       404:
 *         description: Asset not found
 */
router.post('/:id/unassign', assetController.unassign);

/**
 * @swagger
 * /api/v1/assets/{id}/status:
 *   post:
 *     summary: Change asset status
 *     description: Change the status of an asset
 *     tags:
 *       - Assets
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, retired]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Asset status updated
 *       404:
 *         description: Asset not found
 */
router.post('/:id/status', assetController.changeStatus);

/**
 * @swagger
 * /api/v1/assets/{id}/link-incident:
 *   post:
 *     summary: Link asset to incident
 *     description: Link an asset to an incident
 *     tags:
 *       - Assets
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
 *               - incidentId
 *             properties:
 *               incidentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Asset linked to incident
 *       404:
 *         description: Asset or incident not found
 */
router.post('/:id/link-incident', assetController.linkIncident);

export default router;
