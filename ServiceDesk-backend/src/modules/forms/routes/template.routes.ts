/**
 * Forms Module — Template Routes
 */

import { Router } from 'express';
import * as templateCtrl from '../controllers/formTemplate.controller';

const router = Router();

// Public
router.get('/published', templateCtrl.getPublishedTemplates);
router.get('/categories', templateCtrl.getCategories);

// CRUD
router.post('/', templateCtrl.createTemplate);
router.get('/', templateCtrl.listTemplates);
router.get('/:id', templateCtrl.getTemplate);
router.patch('/:id', templateCtrl.updateTemplate);
router.delete('/:id', templateCtrl.deleteTemplate);

// Actions
router.post('/:id/publish', templateCtrl.publishTemplate);
router.post('/:id/unpublish', templateCtrl.unpublishTemplate);
router.post('/:id/clone', templateCtrl.cloneTemplate);
router.post('/:id/new-version', templateCtrl.createNewVersion);
router.post('/:id/validate', templateCtrl.validateTemplate);

// Fields
router.post('/:id/fields', templateCtrl.addField);
router.patch('/:id/fields/:fieldId', templateCtrl.updateField);
router.delete('/:id/fields/:fieldId', templateCtrl.removeField);
router.put('/:id/fields/reorder', templateCtrl.reorderFields);

// Workflow & Approval
router.put('/:id/workflow', templateCtrl.updateWorkflow);
router.put('/:id/approval', templateCtrl.updateApproval);

// Rules
router.post('/:id/conditional-rules', templateCtrl.addConditionalRule);
router.post('/:id/business-rules', templateCtrl.addBusinessRule);

export default router;
