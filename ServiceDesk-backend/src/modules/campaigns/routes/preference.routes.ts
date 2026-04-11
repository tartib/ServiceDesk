import { Router } from 'express';
import * as ctrl from '../controllers/preference.controller';

const router = Router();

router.get('/me', ctrl.getMyPreferences);
router.patch('/me', ctrl.updateMyPreferences);
router.get('/user/:userId', ctrl.getUserPreferences);
router.post('/unsubscribe', ctrl.unsubscribe);

export default router;
