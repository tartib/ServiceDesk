/**
 * Form Definition — Workflow Binding Routes
 *
 * Mounted at /forms/definitions/:formId/workflow-binding
 */

import { Router } from 'express';
import * as bindingCtrl from '../controllers/formWorkflowBinding.controller';

const router = Router({ mergeParams: true });

router.get('/', bindingCtrl.getBindingStatus);
router.post('/bind', bindingCtrl.bindWorkflow);
router.post('/unbind', bindingCtrl.unbindWorkflow);
router.post('/disable', bindingCtrl.disableWorkflow);

export default router;
