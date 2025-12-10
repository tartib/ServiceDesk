import { Router } from 'express';
import {
  createTask,
  getAllTasks,
  getTodayTasks,
  getTasksByStatus,
  getTaskById,
  getTasksByProductId,
  assignTask,
  startTask,
  completeTask,
  markAsLate,
  updateUsage,
  getMyTasks,
} from '../controllers/prepTaskController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST create task - supervisor and manager only
router.post('/', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), createTask);

// GET all tasks - supervisor and manager only (limited to 100 most recent)
router.get('/all', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), getAllTasks);

// GET today's tasks - all authenticated users
router.get('/today', getTodayTasks);

// GET my tasks - all authenticated users
router.get('/my-tasks', getMyTasks);

// GET tasks by status - all authenticated users
router.get('/status/:status', getTasksByStatus);

// GET tasks by product ID - all authenticated users
router.get('/product/:productId', getTasksByProductId);

// GET single task - all authenticated users
router.get('/:id', getTaskById);

// PATCH assign task - supervisor and manager
router.patch('/:id/assign', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), assignTask);

// PATCH start task - all authenticated users (prep staff)
router.patch('/:id/start', startTask);

// PATCH complete task - all authenticated users (prep staff)
router.patch('/:id/complete', completeTask);

// PATCH mark as late - supervisor and manager (usually automated)
router.patch('/:id/late', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), markAsLate);

// PATCH update usage - supervisor and manager
router.patch('/:id/usage', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), updateUsage);

export default router;
