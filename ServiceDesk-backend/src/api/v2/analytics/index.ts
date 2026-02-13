/**
 * Analytics Domain - Dashboards, Reports, KPIs
 * 
 * Resources:
 * - /dashboards : Dashboard data
 * - /reports    : Generated reports
 * - /charts     : Chart data (velocity, burndown, CFD)
 * - /exports    : Data exports
 * - /search     : Global search
 * - /activity   : Activity feeds
 */

import { Router } from 'express';
import { authenticate } from '../../../middleware/auth';

// Import existing routes
import analyticsRoutes from '../../../routes/pm/analytics.routes';
import reportRoutes from '../../../routes/reportRoutes';
import activityRoutes from '../../../routes/pm/activity.routes';
import searchRoutes from '../../../routes/pm/search.routes';
import exportRoutes from '../../../routes/pm/export.routes';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Dashboard routes
router.use('/dashboards', analyticsRoutes);

// Report routes
router.use('/reports', reportRoutes);

// Chart routes (PM analytics)
router.use('/charts', analyticsRoutes);

// Activity feed
router.use('/activity', activityRoutes);

// Global search
router.use('/search', searchRoutes);

// Exports
router.use('/exports', exportRoutes);

export default router;
