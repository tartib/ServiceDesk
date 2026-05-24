import { Router } from 'express';
import { authorize } from '../../../middleware/auth';
import { UserRole } from '../../../types';
import * as ctrl from '../controllers/countTask.controller';

const router = Router();

router.get('/', ctrl.listTasks);
router.get('/:id', ctrl.getTask);
router.post('/generate', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), ctrl.generateTasks);
router.patch('/:id/start', ctrl.startTask);
router.patch('/:id/items/:index', ctrl.updateCountItem);
router.patch('/:id/items/:index/variance-reason', ctrl.updateVarianceReason);
router.patch('/:id/submit', ctrl.submitTask);
router.patch('/:id/review', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), ctrl.reviewTask);

export default router;
