import { Router, Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../../../middleware/auth';
import * as definitionController from '../controllers/definition.controller';

const router = Router();

router.use(authenticate);

// List definitions
router.get(
  '/',
  (req: Request, res: Response) => definitionController.listDefinitions(req as any, res)
);

// Get single definition
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid definition ID')],
  (req: Request, res: Response) => definitionController.getDefinition(req as any, res)
);

// Create definition
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('entityType').trim().notEmpty().withMessage('Entity type is required'),
    body('states').isArray({ min: 2 }).withMessage('At least 2 states are required'),
    body('initialState').trim().notEmpty().withMessage('Initial state is required'),
    body('finalStates').isArray({ min: 1 }).withMessage('At least 1 final state is required'),
  ],
  (req: Request, res: Response) => definitionController.createDefinition(req as any, res)
);

// Update definition
router.put(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid definition ID')],
  (req: Request, res: Response) => definitionController.updateDefinition(req as any, res)
);

// Delete definition
router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid definition ID')],
  (req: Request, res: Response) => definitionController.deleteDefinition(req as any, res)
);

// Publish definition
router.post(
  '/:id/publish',
  [param('id').isMongoId().withMessage('Invalid definition ID')],
  (req: Request, res: Response) => definitionController.publishDefinition(req as any, res)
);

// Deprecate definition
router.post(
  '/:id/deprecate',
  [param('id').isMongoId().withMessage('Invalid definition ID')],
  (req: Request, res: Response) => definitionController.deprecateDefinition(req as any, res)
);

// Get versions
router.get(
  '/:id/versions',
  [param('id').isMongoId().withMessage('Invalid definition ID')],
  (req: Request, res: Response) => definitionController.getVersions(req as any, res)
);

// Create new version
router.post(
  '/:id/versions',
  [param('id').isMongoId().withMessage('Invalid definition ID')],
  (req: Request, res: Response) => definitionController.createNewVersion(req as any, res)
);

export default router;
