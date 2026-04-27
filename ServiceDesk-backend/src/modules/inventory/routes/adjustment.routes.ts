import { Router } from 'express';
import { authorize } from '../../../middleware/auth';
import { UserRole } from '../../../types';
import * as ctrl from '../controllers/adjustment.controller';

const router = Router();

router.get('/', ctrl.listAdjustments);
router.post('/', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), ctrl.createAdjustment);

export default router;
