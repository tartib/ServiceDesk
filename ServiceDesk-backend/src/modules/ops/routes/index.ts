/**
 * Ops Module — Route Index
 *
 * Mounts work order, asset, category, and inventory sub-routers.
 */

import { Router } from 'express';
import workOrderRoutes from './workOrder.routes';
import assetRoutes from './asset.routes';
import categoryRoutes from './category.routes';
import inventoryRoutes from './inventory.routes';

const router = Router();

router.use('/work-orders', workOrderRoutes);
router.use('/assets', assetRoutes);
router.use('/categories', categoryRoutes);
router.use('/inventory', inventoryRoutes);

export default router;
