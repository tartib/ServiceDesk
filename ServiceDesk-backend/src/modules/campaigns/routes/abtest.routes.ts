import { Router } from 'express';
import * as ctrl from '../controllers/abtest.controller';

const router = Router();

router.get('/', ctrl.listABTests);
router.get('/:id', ctrl.getABTest);
router.post('/', ctrl.createABTest);
router.patch('/:id', ctrl.updateABTest);
router.delete('/:id', ctrl.deleteABTest);
router.post('/:id/start', ctrl.startABTest);
router.post('/:id/complete', ctrl.completeABTest);

export default router;
