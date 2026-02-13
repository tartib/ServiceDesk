import { Router } from 'express';
import changeController from '../../controllers/ChangeController';
import { authenticate, authorize } from '../../../middleware/auth';
import { validate } from '../../../shared/middleware/validate';
import { createChangeSchema } from '../../../shared/validation/schemas';

const router = Router();

// Role constants
const TECH_ROLES = ['supervisor', 'manager'] as const;
const MANAGER_ROLES = ['manager'] as const;

// All routes require authentication
router.use(authenticate);

// Static routes MUST come before parameterized routes
router.get('/stats', authorize(...TECH_ROLES), changeController.getStats);
router.get('/pending-cab', authorize(...MANAGER_ROLES), changeController.getPendingCabApproval);
router.get('/scheduled', authorize(...TECH_ROLES), changeController.getScheduledChanges);
router.get('/emergency', authorize(...TECH_ROLES), changeController.getEmergencyChanges);
router.get('/my-requests', changeController.getMyRequests);

// List and create
router.get('/', authorize(...TECH_ROLES), changeController.getChanges);
router.post('/', validate(createChangeSchema), changeController.createChange);

// Parameterized routes MUST come last
router.get('/:id', changeController.getChange);
router.patch('/:id', authorize(...TECH_ROLES), changeController.updateChange);
router.post('/:id/submit', changeController.submitForApproval);
router.post('/:id/cab/approve', authorize(...MANAGER_ROLES), changeController.addCabApproval);
router.post('/:id/schedule', authorize(...MANAGER_ROLES), changeController.scheduleChange);
router.post('/:id/implement', authorize(...TECH_ROLES), changeController.startImplementation);
router.post('/:id/complete', authorize(...TECH_ROLES), changeController.completeChange);
router.post('/:id/cancel', authorize(...MANAGER_ROLES), changeController.cancelChange);

export default router;
