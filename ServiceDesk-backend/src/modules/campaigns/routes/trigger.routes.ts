import { Router } from 'express';
import * as ctrl from '../controllers/trigger.controller';

const router = Router();

router.get('/', ctrl.listTriggers);
router.get('/:id', ctrl.getTrigger);
router.post('/', ctrl.createTrigger);
router.patch('/:id', ctrl.updateTrigger);
router.delete('/:id', ctrl.deleteTrigger);
router.post('/:id/toggle', ctrl.toggleTrigger);

export default router;
