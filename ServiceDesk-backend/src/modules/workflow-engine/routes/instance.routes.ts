import { Router } from 'express';
import { body, param } from 'express-validator';
import { authorize } from '../../../middleware/auth';
import * as instanceController from '../controllers/instance.controller';

const router = Router();

// List instances
router.get(
  '/',
  instanceController.listInstances
);

// Start workflow
router.post(
  '/',
  [
    body('definitionId').isMongoId().withMessage('Invalid definition ID'),
    body('entityType').trim().notEmpty().withMessage('Entity type is required'),
    body('entityId').trim().notEmpty().withMessage('Entity ID is required'),
  ],
  instanceController.startWorkflow
);

// Get instance
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid instance ID')],
  instanceController.getInstance
);

// Execute transition
router.post(
  '/:id/transition',
  [
    param('id').isMongoId().withMessage('Invalid instance ID'),
    body('transitionId').trim().notEmpty().withMessage('Transition ID is required'),
  ],
  instanceController.executeTransition
);

// Get available transitions
router.get(
  '/:id/transitions',
  [param('id').isMongoId().withMessage('Invalid instance ID')],
  instanceController.getAvailableTransitions
);

// Get instance events (audit trail)
router.get(
  '/:id/events',
  [param('id').isMongoId().withMessage('Invalid instance ID')],
  instanceController.getInstanceEvents
);

// Cancel workflow (admin/manager only)
router.post(
  '/:id/cancel',
  authorize('admin', 'manager'),
  [param('id').isMongoId().withMessage('Invalid instance ID')],
  instanceController.cancelWorkflow
);

// Suspend workflow (admin/manager only)
router.post(
  '/:id/suspend',
  authorize('admin', 'manager'),
  [param('id').isMongoId().withMessage('Invalid instance ID')],
  instanceController.suspendWorkflow
);

// Resume workflow (admin/manager only)
router.post(
  '/:id/resume',
  authorize('admin', 'manager'),
  [param('id').isMongoId().withMessage('Invalid instance ID')],
  instanceController.resumeWorkflow
);

// Migrate instances (admin only — affects all instances)
router.post(
  '/migrate',
  authorize('admin'),
  [
    body('fromDefinitionId').isMongoId().withMessage('Invalid source definition ID'),
    body('toDefinitionId').isMongoId().withMessage('Invalid target definition ID'),
    body('toVersion').isInt({ min: 1 }).withMessage('Version must be a positive integer'),
    body('strategy').isIn(['keep_state', 'reset', 'map_states']).withMessage('Invalid migration strategy'),
  ],
  instanceController.migrateInstances
);

export default router;
