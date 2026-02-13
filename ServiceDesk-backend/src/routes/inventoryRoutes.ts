import { Router } from 'express';
import {
  getAllInventory,
  getInventoryById,
  createInventoryItem,
  updateInventory,
  restockInventory,
  getLowStock,
  adjustStock,
  getStockHistory,
} from '../controllers/inventoryController';
import { authenticate, authorize } from '../middleware/auth';
import { uploadInventoryImage } from '../middleware/upload';
import { UserRole } from '../types';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/inventory:
 *   get:
 *     summary: الحصول على جميع عناصر المخزون
 *     description: استرجاع جميع عناصر المخزون مع الترقيم
 *     tags:
 *       - Inventory
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
 *         description: عدد العناصر في الصفحة
 *     responses:
 *       200:
 *         description: قائمة عناصر المخزون
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم جلب عناصر المخزون بنجاح
 *               data:
 *                 - _id: 507f1f77bcf86cd799439011
 *                   name: ماوس لاسلكي
 *                   quantity: 45
 *                   minStock: 10
 *                   unitPrice: 25.50
 *                 - _id: 507f1f77bcf86cd799439012
 *                   name: لوحة مفاتيح ميكانيكية
 *                   quantity: 30
 *                   minStock: 5
 *                   unitPrice: 85.00
 *       401:
 *         description: غير مصرح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 */
router.get('/', getAllInventory);

/**
 * @swagger
 * /api/v1/inventory/low-stock:
 *   get:
 *     summary: Get low stock items
 *     description: Retrieve items with stock below minimum threshold
 *     tags:
 *       - Inventory
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of low stock items
 *       401:
 *         description: Unauthorized
 */
router.get('/low-stock', getLowStock);

/**
 * @swagger
 * /api/v1/inventory:
 *   post:
 *     summary: Create inventory item
 *     description: Create a new inventory item (manager only)
 *     tags:
 *       - Inventory
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - sku
 *               - quantity
 *             properties:
 *               name:
 *                 type: string
 *                 example: Laptop Dell XPS
 *               sku:
 *                 type: string
 *                 example: DELL-XPS-001
 *               quantity:
 *                 type: integer
 *                 example: 50
 *               minStock:
 *                 type: integer
 *                 example: 10
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Inventory item created
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/', authorize(UserRole.MANAGER), uploadInventoryImage, createInventoryItem);

/**
 * @swagger
 * /api/v1/inventory/{id}/history:
 *   get:
 *     summary: Get stock history
 *     description: Retrieve stock adjustment history for an item
 *     tags:
 *       - Inventory
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Inventory item ID
 *     responses:
 *       200:
 *         description: Stock history
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Item not found
 */
router.get('/:id/history', getStockHistory);

/**
 * @swagger
 * /api/v1/inventory/{id}/restock:
 *   patch:
 *     summary: Restock inventory item
 *     description: Add stock to an inventory item (supervisor/manager only)
 *     tags:
 *       - Inventory
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Inventory item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 example: 25
 *               notes:
 *                 type: string
 *                 example: New shipment received
 *     responses:
 *       200:
 *         description: Item restocked successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Item not found
 */
router.patch('/:id/restock', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), restockInventory);

/**
 * @swagger
 * /api/v1/inventory/{id}/adjust:
 *   patch:
 *     summary: Adjust inventory stock
 *     description: Adjust stock quantity for an item (supervisor/manager only)
 *     tags:
 *       - Inventory
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Inventory item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adjustment
 *             properties:
 *               adjustment:
 *                 type: integer
 *                 example: -5
 *                 description: Positive or negative adjustment
 *               reason:
 *                 type: string
 *                 example: Damaged items
 *     responses:
 *       200:
 *         description: Stock adjusted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Item not found
 */
router.patch('/:id/adjust', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), adjustStock);

/**
 * @swagger
 * /api/v1/inventory/{id}:
 *   get:
 *     summary: Get inventory item by ID
 *     description: Retrieve a specific inventory item
 *     tags:
 *       - Inventory
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Inventory item ID
 *     responses:
 *       200:
 *         description: Inventory item details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Item not found
 */
router.get('/:id', getInventoryById);

/**
 * @swagger
 * /api/v1/inventory/{id}:
 *   patch:
 *     summary: Update inventory item
 *     description: Update inventory item details (supervisor/manager only)
 *     tags:
 *       - Inventory
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Inventory item ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               sku:
 *                 type: string
 *               minStock:
 *                 type: integer
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Item updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Item not found
 */
router.patch('/:id', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), uploadInventoryImage, updateInventory);

export default router;
