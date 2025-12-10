import { Router } from 'express';
import {
  getAllInventory,
  getInventoryById,
  createInventoryItem,
  updateInventory,
  restockInventory,
  getLowStock,
} from '../controllers/inventoryController';
import { authenticate, authorize } from '../middleware/auth';
import { uploadInventoryImage } from '../middleware/upload';
import { UserRole } from '../types';

const router = Router();

router.use(authenticate);

router.get('/', getAllInventory);
router.get('/low-stock', getLowStock);
router.get('/:id', getInventoryById);

router.post('/', authorize(UserRole.MANAGER), uploadInventoryImage, createInventoryItem);
router.patch('/:id', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), uploadInventoryImage, updateInventory);
router.patch('/:id/restock', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), restockInventory);

export default router;
