import { Router } from 'express';
import * as ctrl from '../controllers/provider.controller';

const router = Router();

router.get('/', ctrl.listProviders);
router.get('/:id', ctrl.getProvider);
router.post('/', ctrl.createProvider);
router.patch('/:id', ctrl.updateProvider);
router.delete('/:id', ctrl.deleteProvider);
router.post('/:id/test', ctrl.testProvider);
router.post('/:id/set-default', ctrl.setDefaultProvider);

export default router;
