import { Router } from 'express';
import * as ctrl from '../controllers/webhook.controller';

const router = Router();

router.post('/:provider', ctrl.handleProviderWebhook);

export default router;
