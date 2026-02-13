import { Router } from 'express';
import authRoutes from './auth.routes';
import projectRoutes from './project.routes';
import organizationRoutes from './organization.routes';
import teamRoutes from './team.routes';
import taskRoutes from './task.routes';
import sprintRoutes from './sprint.routes';
import roadmapRoutes from './roadmap.routes';
import analyticsRoutes from './analytics.routes';
import commentRoutes from './comment.routes';
import activityRoutes from './activity.routes';
import searchRoutes from './search.routes';
import exportRoutes from './export.routes';
import methodologyRoutes from './methodology.routes';
import boardRoutes from './board.routes';
import standupRoutes from './standup.routes';
import retrospectiveRoutes from './retrospective.routes';
import planningPokerRoutes from './planningPoker.routes';
import workflowRoutes from './workflow.routes';

const router = Router();

// PM Auth routes (separate from main auth)
router.use('/pm/auth', authRoutes);

// Organization routes
router.use('/pm/organizations', organizationRoutes);

// Project routes
router.use('/pm/projects', projectRoutes);

// Methodology routes
router.use('/pm/projects', methodologyRoutes);

// Team routes
router.use('/pm/teams', teamRoutes);

// Task routes (mounted at root for /tasks/:taskId endpoints)
router.use('/pm', taskRoutes);

// Sprint routes
router.use('/pm', sprintRoutes);

// Roadmap routes
router.use('/pm', roadmapRoutes);

// Analytics routes
router.use('/pm/analytics', analyticsRoutes);

// Comment routes
router.use('/pm', commentRoutes);

// Activity routes
router.use('/pm', activityRoutes);

// Search routes
router.use('/pm/search', searchRoutes);

// Export routes
router.use('/pm/export', exportRoutes);

// Board routes
router.use('/pm', boardRoutes);

// Standup routes
router.use('/pm', standupRoutes);

// Retrospective routes
router.use('/pm', retrospectiveRoutes);

// Planning Poker routes
router.use('/pm', planningPokerRoutes);

// Workflow routes
router.use('/pm', workflowRoutes);

export default router;
