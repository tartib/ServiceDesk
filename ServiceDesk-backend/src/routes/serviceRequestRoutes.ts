import { Router } from 'express';
import { serviceRequestController } from '../controllers/serviceRequestController';

const router = Router();

/**
 * @swagger
 * /api/v1/service-requests:
 *   post:
 *     summary: إنشاء طلب خدمة
 *     description: إنشاء طلب خدمة جديد
 *     tags:
 *       - Service Requests
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *                 example: طلب إعادة تعيين كلمة المرور
 *               description:
 *                 type: string
 *                 example: أحتاج إلى إعادة تعيين كلمة مرور حسابي
 *               category:
 *                 type: string
 *                 example: الحسابات
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *                 example: high
 *           example:
 *             title: طلب إعادة تعيين كلمة المرور
 *             description: أحتاج إلى إعادة تعيين كلمة مرور حسابي
 *             category: الحسابات
 *             priority: high
 *     responses:
 *       201:
 *         description: تم إنشاء طلب الخدمة بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 201
 *               message: تم إنشاء طلب الخدمة بنجاح
 *               data:
 *                 _id: 507f1f77bcf86cd799439011
 *                 title: طلب إعادة تعيين كلمة المرور
 *                 status: pending
 *       400:
 *         description: البيانات المدخلة غير صحيحة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 */
router.post('/', serviceRequestController.create);

/**
 * @swagger
 * /api/v1/service-requests:
 *   get:
 *     summary: Get all service requests
 *     description: Retrieve all service requests
 *     tags:
 *       - Service Requests
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of service requests
 */
router.get('/', serviceRequestController.getAll);

/**
 * @swagger
 * /api/v1/service-requests/stats:
 *   get:
 *     summary: Get service request statistics
 *     description: Retrieve service request statistics
 *     tags:
 *       - Service Requests
 *     responses:
 *       200:
 *         description: Service request statistics
 */
router.get('/stats', serviceRequestController.getStats);

/**
 * @swagger
 * /api/v1/service-requests/my/{userId}:
 *   get:
 *     summary: Get my service requests
 *     description: Retrieve service requests for a specific user
 *     tags:
 *       - Service Requests
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User's service requests
 */
router.get('/my/:userId', serviceRequestController.getMyRequests);

/**
 * @swagger
 * /api/v1/service-requests/{id}:
 *   get:
 *     summary: Get service request by ID
 *     description: Retrieve a specific service request
 *     tags:
 *       - Service Requests
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Service request details
 *       404:
 *         description: Service request not found
 */
router.get('/:id', serviceRequestController.getById);

/**
 * @swagger
 * /api/v1/service-requests/{id}:
 *   put:
 *     summary: Update service request
 *     description: Update a service request
 *     tags:
 *       - Service Requests
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Service request updated
 *       404:
 *         description: Service request not found
 */
router.put('/:id', serviceRequestController.update);

/**
 * @swagger
 * /api/v1/service-requests/{id}/status:
 *   post:
 *     summary: Update service request status
 *     description: Update the status of a service request
 *     tags:
 *       - Service Requests
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
 *                 enum: [open, in_progress, pending, resolved, closed]
 *     responses:
 *       200:
 *         description: Status updated
 *       404:
 *         description: Service request not found
 */
router.post('/:id/status', serviceRequestController.updateStatus);

/**
 * @swagger
 * /api/v1/service-requests/{id}/approve:
 *   post:
 *     summary: Process approval
 *     description: Process approval for a service request
 *     tags:
 *       - Service Requests
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
 *               - approved
 *             properties:
 *               approved:
 *                 type: boolean
 *               comments:
 *                 type: string
 *     responses:
 *       200:
 *         description: Approval processed
 *       404:
 *         description: Service request not found
 */
router.post('/:id/approve', serviceRequestController.processApproval);

/**
 * @swagger
 * /api/v1/service-requests/{id}/assign:
 *   post:
 *     summary: Assign service request
 *     description: Assign a service request to a user
 *     tags:
 *       - Service Requests
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
 *               - assignedTo
 *             properties:
 *               assignedTo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Service request assigned
 *       404:
 *         description: Service request not found
 */
router.post('/:id/assign', serviceRequestController.assign);

/**
 * @swagger
 * /api/v1/service-requests/{id}/fulfill:
 *   post:
 *     summary: Fulfill service request
 *     description: Mark a service request as fulfilled
 *     tags:
 *       - Service Requests
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
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Service request fulfilled
 *       404:
 *         description: Service request not found
 */
router.post('/:id/fulfill', serviceRequestController.fulfill);

export default router;
