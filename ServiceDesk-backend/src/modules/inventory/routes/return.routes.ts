import { Router } from 'express';
import { authorize } from '../../../middleware/auth';
import { UserRole } from '../../../types';
import * as ctrl from '../controllers/return.controller';

const router = Router();

router.get('/', ctrl.listReturns);
router.post('/', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), ctrl.createReturn);

export default router;
