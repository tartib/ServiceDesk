/**
 * Analytics Routes — /api/v2/forms/analytics
 * Section 2, Batch 7
 */

import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';

const router = Router();

router.get('/summary', analyticsController.getSummary);
router.get('/records-by-status', analyticsController.recordsByStatus);
router.get('/records-by-type', analyticsController.recordsByType);

export default router;
