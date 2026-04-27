import { Router } from 'express';
import { authorize } from '../../../middleware/auth';
import { UserRole } from '../../../types';
import * as ctrl from '../controllers/receipt.controller';

const router = Router();

router.get('/', ctrl.listReceipts);
router.post('/', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), ctrl.createReceipt);
router.patch('/:id/confirm', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), ctrl.confirmReceipt);
router.patch('/:id/cancel', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), ctrl.cancelReceipt);

export default router;
