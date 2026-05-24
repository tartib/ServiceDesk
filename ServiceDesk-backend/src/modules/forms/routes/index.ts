/**
 * Forms Module — Route Index
 *
 * Mounts template and submission sub-routers.
 */

import { Router } from 'express';
import templateRoutes from './template.routes';
import submissionRoutes from './submission.routes';
import definitionBindingRoutes from './definition-binding.routes';
import requestTypeRoutes from './request-type.routes';
import recordRoutes from './record.routes';
import analyticsRoutes from './analytics.routes';

const router = Router();

router.use('/templates', templateRoutes);
router.use('/submissions', submissionRoutes);
router.use('/definitions/:formId/workflow-binding', definitionBindingRoutes);
router.use('/request-types', requestTypeRoutes);
router.use('/records', recordRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
