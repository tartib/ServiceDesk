import { Router } from 'express';
import {
  createTask,
  getAllTasks,
  getTodayTasks,
  getTasksByStatus,
  getTaskById,
  getTasksByProductId,
  assignTask,
  startTask,
  completeTask,
  markTaskAsLate,
  updateTaskUsage,
  getMyTasks,
} from '../controllers/prepTaskController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/tasks:
 *   post:
 *     summary: إنشاء مهمة جديدة
 *     description: إنشاء مهمة جديدة (المشرفون والمديرون فقط)
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - productId
 *             properties:
 *               title:
 *                 type: string
 *                 example: تحضير دفعة منتج
 *               description:
 *                 type: string
 *                 example: تحضير 100 وحدة من المنتج X
 *               productId:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *     responses:
 *       201:
 *         description: تم إنشاء المهمة بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 201
 *               message: تم إنشاء المهمة بنجاح
 *               data:
 *                 _id: 507f1f77bcf86cd799439011
 *                 title: تحضير دفعة منتج
 *                 status: pending
 *       400:
 *         description: البيانات المدخلة غير صحيحة
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
 *       403:
 *         description: ليس لديك صلاحية
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForbiddenResponse'
 */
router.post('/', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), createTask);

/**
 * @swagger
 * /api/v1/tasks/all:
 *   get:
 *     summary: الحصول على جميع المهام
 *     description: استرجاع جميع المهام (محدود إلى 100 الأحدث، المشرفون والمديرون فقط)
 *     tags:
 *       - Tasks
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
 *         description: قائمة المهام
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم جلب المهام بنجاح
 *               data:
 *                 - _id: 507f1f77bcf86cd799439011
 *                   title: تحضير دفعة منتج
 *                   status: pending
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
router.get('/all', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), getAllTasks);

/**
 * @swagger
 * /api/v1/tasks/today:
 *   get:
 *     summary: الحصول على مهام اليوم
 *     description: استرجاع المهام المعينة لهذا اليوم
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: قائمة مهام اليوم
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم جلب مهام اليوم بنجاح
 *               data:
 *                 - _id: 507f1f77bcf86cd799439011
 *                   title: تحضير دفعة منتج
 *                   dueDate: 2025-01-02T23:59:59Z
 *       401:
 *         description: غير مصرح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 */
router.get('/today', getTodayTasks);

/**
 * @swagger
 * /api/v1/tasks/my-tasks:
 *   get:
 *     summary: الحصول على مهامي
 *     description: استرجاع المهام المعينة للمستخدم الحالي
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: قائمة مهام المستخدم
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم جلب مهامك بنجاح
 *               data:
 *                 - _id: 507f1f77bcf86cd799439011
 *                   title: تحضير دفعة منتج
 *                   status: in_progress
 *       401:
 *         description: غير مصرح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 */
router.get('/my-tasks', getMyTasks);

/**
 * @swagger
 * /api/v1/tasks/status/{status}:
 *   get:
 *     summary: الحصول على المهام حسب الحالة
 *     description: استرجاع المهام المصفاة حسب الحالة
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed, cancelled]
 *         description: Task status
 *     responses:
 *       200:
 *         description: List of tasks with specified status
 *       401:
 *         description: Unauthorized
 */
router.get('/status/:status', getTasksByStatus);

/**
 * @swagger
 * /api/v1/tasks/product/{productId}:
 *   get:
 *     summary: Get tasks by product
 *     description: Retrieve tasks for a specific product
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: List of tasks for the product
 *       401:
 *         description: Unauthorized
 */
router.get('/product/:productId', getTasksByProductId);

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   get:
 *     summary: Get task by ID
 *     description: Retrieve a specific task by its ID
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Task not found
 */
router.get('/:id', getTaskById);

/**
 * @swagger
 * /api/v1/tasks/{id}/assign:
 *   patch:
 *     summary: Assign task to user
 *     description: Assign a task to a user (supervisor and manager only)
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
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
 *                 description: User ID to assign task to
 *     responses:
 *       200:
 *         description: Task assigned successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Task not found
 */
router.patch('/:id/assign', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), assignTask);

/**
 * @swagger
 * /api/v1/tasks/{id}/start:
 *   patch:
 *     summary: Start task
 *     description: Mark a task as started
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task started successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Task not found
 */
router.patch('/:id/start', startTask);

/**
 * @swagger
 * /api/v1/tasks/{id}/complete:
 *   patch:
 *     summary: Complete task
 *     description: Mark a task as completed
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task completed successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Task not found
 */
router.patch('/:id/complete', completeTask);

/**
 * @swagger
 * /api/v1/tasks/{id}/late:
 *   patch:
 *     summary: Mark task as late
 *     description: Mark a task as late (supervisor and manager only)
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task marked as late
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Task not found
 */
router.patch('/:id/late', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), markTaskAsLate);

/**
 * @swagger
 * /api/v1/tasks/{id}/usage:
 *   patch:
 *     summary: Update task usage
 *     description: Update resource usage for a task (supervisor and manager only)
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               usage:
 *                 type: number
 *                 description: Resource usage amount
 *     responses:
 *       200:
 *         description: Usage updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Task not found
 */
router.patch('/:id/usage', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), updateTaskUsage);

export default router;
