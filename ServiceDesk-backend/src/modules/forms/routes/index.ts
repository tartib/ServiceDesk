/**
 * Forms Module — Route Index
 *
 * Mounts template and submission sub-routers.
 */

import { Router } from 'express';
import templateRoutes from './template.routes';
import submissionRoutes from './submission.routes';
import definitionBindingRoutes from './definition-binding.routes';

const router = Router();

router.use('/templates', templateRoutes);
router.use('/submissions', submissionRoutes);
router.use('/definitions/:formId/workflow-binding', definitionBindingRoutes);

export default router;
