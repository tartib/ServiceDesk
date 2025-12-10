import { Router } from 'express';
import {
  getDashboardAnalytics,
  getDailyReport,
  getWeeklyReport,
  getMonthlyReport,
} from '../controllers/reportController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

// All report routes require authentication
router.use(authenticate);

// Dashboard analytics - accessible by all authenticated users
router.get('/analytics', getDashboardAnalytics);

// Detailed reports - accessible by supervisors and managers
router.get('/daily', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), getDailyReport);
router.get('/weekly', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), getWeeklyReport);
router.get('/monthly', authorize(UserRole.SUPERVISOR, UserRole.MANAGER), getMonthlyReport);

export default router;
