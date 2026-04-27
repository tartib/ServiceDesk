import { Router } from 'express';
import { authorize } from '../../../middleware/auth';
import { UserRole } from '../../../types';
import * as ctrl from '../controllers/warehouse.controller';

const router = Router();

router.get('/', ctrl.listWarehouses);
router.get('/:id', ctrl.getWarehouse);
router.post('/', authorize(UserRole.MANAGER), ctrl.createWarehouse);
router.put('/:id', authorize(UserRole.MANAGER), ctrl.updateWarehouse);
router.delete('/:id', authorize(UserRole.MANAGER), ctrl.deactivateWarehouse);

// Locations
router.get('/:warehouseId/locations', ctrl.listLocations);
router.post('/:warehouseId/locations', authorize(UserRole.MANAGER), ctrl.createLocation);
router.put('/:warehouseId/locations/:locationId', authorize(UserRole.MANAGER), ctrl.updateLocation);
router.delete('/:warehouseId/locations/:locationId', authorize(UserRole.MANAGER), ctrl.deactivateLocation);

export default router;
