import { Router, Request, Response } from 'express';
import { body, param } from 'express-validator';
import { authenticate } from '../../middleware/auth';
import * as instanceController from '../../controllers/workflow-engine/instance.controller';

const router = Router();

router.use(authenticate);

// List instances
router.get(
  '/',
  (req: Request, res: Response) => instanceController.listInstances(req as any, res)
);

// Start workflow
router.post(
  '/',
  [
    body('definitionId').isMongoId().withMessage('Invalid definition ID'),
    body('entityType').trim().notEmpty().withMessage('Entity type is required'),
    body('entityId').trim().notEmpty().withMessage('Entity ID is required'),
  ],
  (req: Request, res: Response) => instanceController.startWorkflow(req as any, res)
);

// Get instance
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid instance ID')],
  (req: Request, res: Response) => instanceController.getInstance(req as any, res)
);

// Execute transition
router.post(
  '/:id/transition',
  [
    param('id').isMongoId().withMessage('Invalid instance ID'),
    body('transitionId').trim().notEmpty().withMessage('Transition ID is required'),
  ],
  (req: Request, res: Response) => instanceController.executeTransition(req as any, res)
);

// Get available transitions
router.get(
  '/:id/transitions',
  [param('id').isMongoId().withMessage('Invalid instance ID')],
  (req: Request, res: Response) => instanceController.getAvailableTransitions(req as any, res)
);

// Get instance events (audit trail)
router.get(
  '/:id/events',
  [param('id').isMongoId().withMessage('Invalid instance ID')],
  (req: Request, res: Response) => instanceController.getInstanceEvents(req as any, res)
);

// Cancel workflow
router.post(
  '/:id/cancel',
  [param('id').isMongoId().withMessage('Invalid instance ID')],
  (req: Request, res: Response) => instanceController.cancelWorkflow(req as any, res)
);

// Suspend workflow
router.post(
  '/:id/suspend',
  [param('id').isMongoId().withMessage('Invalid instance ID')],
  (req: Request, res: Response) => instanceController.suspendWorkflow(req as any, res)
);

// Resume workflow
router.post(
  '/:id/resume',
  [param('id').isMongoId().withMessage('Invalid instance ID')],
  (req: Request, res: Response) => instanceController.resumeWorkflow(req as any, res)
);

// Migrate instances
router.post(
  '/migrate',
  [
    body('fromDefinitionId').isMongoId().withMessage('Invalid source definition ID'),
    body('toDefinitionId').isMongoId().withMessage('Invalid target definition ID'),
    body('toVersion').isInt({ min: 1 }).withMessage('Version must be a positive integer'),
    body('strategy').isIn(['keep_state', 'reset', 'map_states']).withMessage('Invalid migration strategy'),
  ],
  (req: Request, res: Response) => instanceController.migrateInstances(req as any, res)
);

export default router;
