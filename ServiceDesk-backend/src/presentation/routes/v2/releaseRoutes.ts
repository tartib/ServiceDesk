import { Router } from 'express';
import releaseController from '../../controllers/ReleaseController';
import { authenticate, authorize } from '../../../middleware/auth';

const router = Router();

router.use(authenticate);

const TECH_ROLES = ['supervisor', 'manager'] as const;

// Static routes first
router.get('/stats', authorize(...TECH_ROLES), releaseController.getStats);

// CRUD
router.get('/', authorize(...TECH_ROLES), releaseController.getReleases);
router.post('/', authorize(...TECH_ROLES), releaseController.createRelease);

// Parameterized routes last
router.get('/:id', authorize(...TECH_ROLES), releaseController.getRelease);
router.patch('/:id', authorize(...TECH_ROLES), releaseController.updateRelease);
router.delete('/:id', authorize(...TECH_ROLES), releaseController.deleteRelease);

export default router;
