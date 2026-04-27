import { Router } from 'express';
import { authorize } from '../../../middleware/auth';
import { UserRole } from '../../../types';
import * as ctrl from '../controllers/transfer.controller';

const router = Router();

router.get('/', ctrl.listTransfers);
router.post('/', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), ctrl.createTransfer);
router.patch('/:id/cancel', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), ctrl.cancelTransfer);

export default router;
