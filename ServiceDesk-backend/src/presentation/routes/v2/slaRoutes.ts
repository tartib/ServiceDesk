import { Router } from 'express';
import slaController from '../../controllers/SLAController';
import { authenticate, authorize } from '../../../middleware/auth';

const router = Router();

router.use(authenticate);

const TECH_ROLES = ['supervisor', 'manager'] as const;

// Static routes first
router.get('/stats', authorize(...TECH_ROLES), slaController.getStats);

// CRUD
router.get('/', authorize(...TECH_ROLES), slaController.getSLAs);
router.post('/', authorize(...TECH_ROLES), slaController.createSLA);

// Parameterized routes last
router.get('/:id', authorize(...TECH_ROLES), slaController.getSLA);
router.patch('/:id', authorize(...TECH_ROLES), slaController.updateSLA);
router.delete('/:id', authorize(...TECH_ROLES), slaController.deleteSLA);

export default router;
