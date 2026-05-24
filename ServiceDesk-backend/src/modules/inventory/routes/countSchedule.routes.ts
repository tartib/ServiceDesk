import { Router } from 'express';
import { authorize } from '../../../middleware/auth';
import { UserRole } from '../../../types';
import * as ctrl from '../controllers/countSchedule.controller';

const router = Router();

router.get('/', ctrl.listSchedules);
router.get('/:id', ctrl.getSchedule);
router.post('/', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), ctrl.createSchedule);
router.put('/:id', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), ctrl.updateSchedule);
router.patch('/:id/pause', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), ctrl.pauseSchedule);
router.patch('/:id/resume', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), ctrl.resumeSchedule);
router.patch('/:id/archive', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), ctrl.archiveSchedule);

export default router;
