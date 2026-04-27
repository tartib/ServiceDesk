import { Router } from 'express';
import * as ctrl from '../controllers/balance.controller';

const router = Router();

router.get('/', ctrl.listBalances);
router.get('/:partId', ctrl.getPartBalance);

export default router;
