import { Router } from 'express';
import serviceCatalogController from '../../controllers/ServiceCatalogController';
import { authenticate, authorize } from '../../../middleware/auth';

const router = Router();

router.use(authenticate);

const TECH_ROLES = ['supervisor', 'manager'] as const;

// Static routes first
router.get('/stats', authorize(...TECH_ROLES), serviceCatalogController.getStats);

// List (all authenticated users can browse catalog)
router.get('/', serviceCatalogController.getServices);

// Create/Update/Delete (managers only)
router.post('/', authorize(...TECH_ROLES), serviceCatalogController.createService);

// Parameterized routes last
router.get('/:id', serviceCatalogController.getService);
router.patch('/:id', authorize(...TECH_ROLES), serviceCatalogController.updateService);
router.delete('/:id', authorize(...TECH_ROLES), serviceCatalogController.deleteService);

export default router;
