import { Router } from 'express';
import { authenticate } from '../../../middleware/auth';
import * as kpiCtrl from '../controllers/kpi.controller';

const router = Router();

router.use(authenticate);

router.get('/', kpiCtrl.getAllKPIs);
router.get('/completion-rate', kpiCtrl.getCompletionRate);
router.get('/overdue', kpiCtrl.getOverdueTasks);
router.get('/avg-completion-time', kpiCtrl.getAverageCompletionTime);
router.get('/on-time-rate', kpiCtrl.getOnTimeCompletionRate);

export default router;
