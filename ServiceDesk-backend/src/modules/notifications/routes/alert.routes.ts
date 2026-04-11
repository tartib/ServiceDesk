import { Router } from 'express';
import { authenticate } from '../../../middleware/auth';
import * as alertCtrl from '../controllers/alert.controller';

const router = Router();

router.use(authenticate);

router.get('/', alertCtrl.getAlerts);
router.get('/all', alertCtrl.getAllAlerts);
router.patch('/:id/acknowledge', alertCtrl.acknowledgeAlert);
router.get('/employee/:employeeId', alertCtrl.getAlertsByEmployee);

export default router;
