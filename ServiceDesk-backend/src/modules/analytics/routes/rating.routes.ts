import { Router } from 'express';
import { authenticate } from '../../../middleware/auth';
import * as ratingCtrl from '../controllers/rating.controller';

const router = Router();

router.use(authenticate);

router.get('/:employeeId/history', ratingCtrl.getEmployeeRatingHistory);
router.get('/:employeeId/current', ratingCtrl.getCurrentMonthRating);

export default router;
