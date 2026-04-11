import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authorize } from '../../../middleware/auth';
import * as definitionController from '../controllers/definition.controller';

const router = Router();

// List definitions
router.get(
  '/',
  definitionController.listDefinitions
);

// Get single definition
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid definition ID')],
  definitionController.getDefinition
);

// Create definition (admin/manager only)
router.post(
  '/',
  authorize('admin', 'manager'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('entityType').trim().notEmpty().withMessage('Entity type is required'),
    body('states').isArray({ min: 2 }).withMessage('At least 2 states are required'),
    body('initialState').trim().notEmpty().withMessage('Initial state is required'),
    body('finalStates').isArray({ min: 1 }).withMessage('At least 1 final state is required'),
  ],
  definitionController.createDefinition
);

// Update definition (admin/manager only)
router.put(
  '/:id',
  authorize('admin', 'manager'),
  [param('id').isMongoId().withMessage('Invalid definition ID')],
  definitionController.updateDefinition
);

// Delete definition (admin/manager only)
router.delete(
  '/:id',
  authorize('admin', 'manager'),
  [param('id').isMongoId().withMessage('Invalid definition ID')],
  definitionController.deleteDefinition
);

// Publish definition (admin/manager only)
router.post(
  '/:id/publish',
  authorize('admin', 'manager'),
  [param('id').isMongoId().withMessage('Invalid definition ID')],
  definitionController.publishDefinition
);

// Deprecate definition (admin/manager only)
router.post(
  '/:id/deprecate',
  authorize('admin', 'manager'),
  [param('id').isMongoId().withMessage('Invalid definition ID')],
  definitionController.deprecateDefinition
);

// Get versions
router.get(
  '/:id/versions',
  [param('id').isMongoId().withMessage('Invalid definition ID')],
  definitionController.getVersions
);

// Create new version (admin/manager only)
router.post(
  '/:id/versions',
  authorize('admin', 'manager'),
  [param('id').isMongoId().withMessage('Invalid definition ID')],
  definitionController.createNewVersion
);

export default router;
