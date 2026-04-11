import { Router } from 'express';
import * as ctrl from '../controllers/campaign.controller';

const router = Router();

router.get('/', ctrl.listCampaigns);
router.get('/:id', ctrl.getCampaign);
router.post('/', ctrl.createCampaign);
router.patch('/:id', ctrl.updateCampaign);
router.delete('/:id', ctrl.deleteCampaign);

// Actions
router.post('/:id/schedule', ctrl.scheduleCampaign);
router.post('/:id/send', ctrl.sendCampaign);
router.post('/:id/pause', ctrl.pauseCampaign);
router.post('/:id/resume', ctrl.resumeCampaign);
router.post('/:id/cancel', ctrl.cancelCampaign);
router.post('/:id/test', ctrl.testCampaign);

// Messages
router.get('/:id/messages', ctrl.listCampaignMessages);

export default router;
