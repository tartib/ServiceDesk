/**
 * Ops Module — Route Index
 *
 * Mounts work order, asset, and category sub-routers.
 * Inventory has been moved to its own top-level module at /api/v2/inventory.
 */

import { Router } from 'express';
import workOrderRoutes from './workOrder.routes';
import assetRoutes from './asset.routes';
import categoryRoutes from './category.routes';

const router = Router();

router.use('/work-orders', workOrderRoutes);
router.use('/assets', assetRoutes);
router.use('/categories', categoryRoutes);

export default router;
