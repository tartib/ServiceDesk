import { Router } from 'express';
import { authenticate } from '../../../middleware/auth';
import * as perfCtrl from '../controllers/performance.controller';

const router = Router();

router.use(authenticate);

router.get('/team', perfCtrl.getTeamPerformance);
router.get('/top', perfCtrl.getTopPerformers);
router.get('/active-members', perfCtrl.getActiveMembers);
router.get('/member/:memberId', perfCtrl.getMemberPerformance);
router.get('/history/:employeeId', perfCtrl.getPerformanceHistory);
router.get('/monthly/:employeeId/:month/:year', perfCtrl.getMonthlyPerformance);
router.post('/', perfCtrl.recordPerformance);
router.put('/:id', perfCtrl.updatePerformance);
router.delete('/:id', perfCtrl.deletePerformance);

export default router;
