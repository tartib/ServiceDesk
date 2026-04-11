/**
 * Forms Module — Route Index
 *
 * Mounts template and submission sub-routers.
 */

import { Router } from 'express';
import templateRoutes from './template.routes';
import submissionRoutes from './submission.routes';

const router = Router();

router.use('/templates', templateRoutes);
router.use('/submissions', submissionRoutes);

export default router;
