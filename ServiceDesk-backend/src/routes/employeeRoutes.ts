import { Router } from 'express';
import * as employeeController from '../controllers/employeeController';

const router = Router();

/**
 * @swagger
 * /api/v1/employees:
 *   get:
 *     summary: الحصول على جميع الموظفين
 *     description: استرجاع قائمة بجميع الموظفين
 *     tags:
 *       - Employees
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
 *         description: قائمة الموظفين
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم جلب الموظفين بنجاح
 *               data:
 *                 - _id: 507f1f77bcf86cd799439011
 *                   name: أحمد محمد
 *                   email: ahmad@example.com
 *                   department: تقنية المعلومات
 *                   position: مهندس برمجيات
 */
router.get('/', employeeController.getAllEmployees);

/**
 * @swagger
 * /api/v1/employees/{id}:
 *   get:
 *     summary: الحصول على الموظف بالمعرّف
 *     description: استرجاع تفاصيل موظف معين
 *     tags:
 *       - Employees
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: معرّف الموظف
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: تفاصيل الموظف
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم جلب الموظف بنجاح
 *               data:
 *                 _id: 507f1f77bcf86cd799439011
 *                 name: أحمد محمد
 *                 email: ahmad@example.com
 *                 department: تقنية المعلومات
 *                 position: مهندس برمجيات
 *       404:
 *         description: الموظف غير موجود
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundResponse'
 */
router.get('/:id', employeeController.getEmployeeById);

/**
 * @swagger
 * /api/v1/employees:
 *   post:
 *     summary: إنشاء موظف جديد
 *     description: إنشاء موظف جديد في النظام
 *     tags:
 *       - Employees
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               department:
 *                 type: string
 *               position:
 *                 type: string
 *     responses:
 *       201:
 *         description: Employee created
 */
router.post('/', employeeController.createEmployee);

/**
 * @swagger
 * /api/v1/employees/{id}:
 *   put:
 *     summary: Update employee
 *     description: Update employee information
 *     tags:
 *       - Employees
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
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               department:
 *                 type: string
 *               position:
 *                 type: string
 *     responses:
 *       200:
 *         description: Employee updated
 *       404:
 *         description: Employee not found
 */
router.put('/:id', employeeController.updateEmployee);

/**
 * @swagger
 * /api/v1/employees/{id}:
 *   delete:
 *     summary: Delete employee
 *     description: Delete an employee
 *     tags:
 *       - Employees
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Employee deleted
 *       404:
 *         description: Employee not found
 */
router.delete('/:id', employeeController.deleteEmployee);

export default router;
