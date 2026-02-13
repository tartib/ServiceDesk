import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getLeaveRequests,
  getMyLeaveRequests,
  createLeaveRequest,
  updateLeaveRequest,
  deleteLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
} from '../controllers/leaveRequest.controller';

const router = Router();

router.use(authenticate);

router.get('/', getLeaveRequests);
router.get('/my', getMyLeaveRequests);
router.post('/', createLeaveRequest);
router.put('/:id', updateLeaveRequest);
router.delete('/:id', deleteLeaveRequest);
router.patch('/:id/approve', approveLeaveRequest);
router.patch('/:id/reject', rejectLeaveRequest);

export default router;
