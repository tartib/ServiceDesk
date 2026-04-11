/**
 * Analytics Module — Routes
 *
 * Mounts report and dashboard endpoints under the analytics module prefix.
 */

import { Router } from 'express';
import * as reportController from '../controllers/report.controller';
import * as itsmReportController from '../controllers/itsm-report.controller';
import * as pmReportController from '../controllers/pm-report.controller';
import * as dashboardController from '../controllers/dashboard.controller';
import kpiRoutes from './kpi.routes';
import performanceRoutes from './performance.routes';
import leaderboardRoutes from './leaderboard.routes';
import ratingRoutes from './rating.routes';

const router = Router();

// ── Reports (legacy task-based) ─────────────────────────
router.get('/reports/dashboard', reportController.getDashboardAnalytics);
router.get('/reports/daily', reportController.getDailyReport);
router.get('/reports/weekly', reportController.getWeeklyReport);
router.get('/reports/monthly', reportController.getMonthlyReport);

// ── ITSM Analytics ──────────────────────────────────────
router.get('/itsm/summary', itsmReportController.getItsmSummary);
router.get('/itsm/incident-trend', itsmReportController.getIncidentTrend);
router.get('/itsm/sla-trend', itsmReportController.getSlaComplianceTrend);

// ── PM Analytics ────────────────────────────────────────
router.get('/pm/summary', pmReportController.getPmSummary);
router.get('/pm/velocity-trend', pmReportController.getVelocityTrend);

// ── KPIs ─────────────────────────────────────────────────
router.get('/kpis', dashboardController.getKPIs);
router.use('/kpi', kpiRoutes);

// ── Performance ──────────────────────────────────────────
router.get('/performance/team', dashboardController.getTeamPerformance);
router.get('/performance/top', dashboardController.getTopPerformers);
router.use('/performance', performanceRoutes);

// ── Leaderboard ──────────────────────────────────────────
router.use('/leaderboard', leaderboardRoutes);

// ── Ratings ──────────────────────────────────────────────
router.use('/ratings', ratingRoutes);

// ── Analytics ────────────────────────────────────────────
router.get('/distribution', dashboardController.getTaskDistribution);
router.get('/time-analysis', dashboardController.getTimeAnalysis);

export default router;
