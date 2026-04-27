import { Router } from 'express';
import { authorize } from '../../../middleware/auth';
import { UserRole } from '../../../types';
import * as ctrl from '../controllers/booking.controller';

const router = Router();

router.get('/', ctrl.listBookings);
router.post('/', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), ctrl.bookStock);
router.post('/:id/release', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), ctrl.releaseBooking);
router.post('/:id/cancel', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), ctrl.cancelBooking);

export default router;
