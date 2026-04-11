/**
 * Ops Module — Inventory Routes
 */

import { Router } from 'express';
import { authorize } from '../../../middleware/auth';
import { uploadInventoryImage } from '../../../middleware/upload';
import { UserRole } from '../../../types';
import * as invCtrl from '../controllers/inventory.controller';

const router = Router();

router.get('/', invCtrl.getAllInventory);
router.get('/low-stock', invCtrl.getLowStock);
router.post('/', authorize(UserRole.MANAGER), uploadInventoryImage, invCtrl.createInventoryItem);
router.get('/:id/history', invCtrl.getStockHistory);
router.patch('/:id/restock', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), invCtrl.restockInventory);
router.patch('/:id/adjust', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), invCtrl.adjustStock);
router.get('/:id', invCtrl.getInventoryById);
router.patch('/:id', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), uploadInventoryImage, invCtrl.updateInventory);

export default router;
