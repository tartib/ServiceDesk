import { Router } from 'express';
import * as ctrl from '../controllers/analytics.controller';

const router = Router();

router.get('/overview', ctrl.getOverview);
router.get('/channels', ctrl.getByChannel);
router.get('/campaigns/:campaignId', ctrl.getCampaignStats);
router.post('/campaigns/:campaignId/refresh', ctrl.refreshStats);

export default router;
