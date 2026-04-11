import { Router } from 'express';
import pirController from '../controllers/pir.controller';
import { authorize } from '../../../middleware/auth';

const router = Router();

const TECH_ROLES = ['supervisor', 'manager'] as const;
const MANAGER_ROLES = ['manager'] as const;

// Static routes
router.get('/', authorize(...TECH_ROLES), pirController.listPIRs);

// Parameterized routes
router.get('/:pirId', authorize(...TECH_ROLES), pirController.getPIR);
router.patch('/:pirId', authorize(...TECH_ROLES), pirController.updatePIR);
router.post('/:pirId/follow-up-actions', authorize(...TECH_ROLES), pirController.addFollowUpAction);
router.patch('/:pirId/follow-up-actions/:actionId/complete', authorize(...TECH_ROLES), pirController.completeFollowUpAction);
router.patch('/:pirId/submit', authorize(...TECH_ROLES), pirController.submitForReview);
router.patch('/:pirId/complete', authorize(...MANAGER_ROLES), pirController.completePIR);

export default router;
