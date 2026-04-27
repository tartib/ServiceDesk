/**
 * Inventory Module — Route Index
 *
 * Mounts all inventory sub-routers under /api/v2/inventory.
 */
import { Router } from 'express';
import itemRoutes from './item.routes';
import warehouseRoutes from './warehouse.routes';
import receiptRoutes from './receipt.routes';
import bookingRoutes from './booking.routes';
import issueRoutes from './issue.routes';
import transferRoutes from './transfer.routes';
import adjustmentRoutes from './adjustment.routes';
import returnRoutes from './return.routes';
import balanceRoutes from './balance.routes';
import movementRoutes from './movement.routes';
import * as movementCtrl from '../controllers/movement.controller';

const router = Router();

router.use('/items', itemRoutes);
router.use('/warehouses', warehouseRoutes);
router.use('/receipts', receiptRoutes);
router.use('/bookings', bookingRoutes);
router.use('/issues', issueRoutes);
router.use('/transfers', transferRoutes);
router.use('/adjustments', adjustmentRoutes);
router.use('/returns', returnRoutes);
router.use('/balances', balanceRoutes);
router.use('/movements', movementRoutes);

// GET /api/v2/inventory/items/:id/movements
router.get('/items/:id/movements', movementCtrl.getItemMovements);

export default router;
