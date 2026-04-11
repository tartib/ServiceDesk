/**
 * Campaigns Module — Routes
 *
 * Mounted at /api/v2/campaigns
 */

import { Router } from 'express';
import campaignRoutes from './campaign.routes';
import templateRoutes from './template.routes';
import segmentRoutes from './segment.routes';
import triggerRoutes from './trigger.routes';
import journeyRoutes from './journey.routes';
import preferenceRoutes from './preference.routes';
import providerRoutes from './provider.routes';
import abtestRoutes from './abtest.routes';
import analyticsRoutes from './analytics.routes';
import auditRoutes from './audit.routes';
import webhookRoutes from './webhook.routes';

const router = Router();

router.use('/', campaignRoutes);
router.use('/templates', templateRoutes);
router.use('/segments', segmentRoutes);
router.use('/triggers', triggerRoutes);
router.use('/journeys', journeyRoutes);
router.use('/preferences', preferenceRoutes);
router.use('/providers', providerRoutes);
router.use('/ab-tests', abtestRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/audit', auditRoutes);
router.use('/webhooks', webhookRoutes);

export default router;
