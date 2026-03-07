/**
 * PM Domain - Project Management
 * 
 * Resources:
 * - /projects  : Project management
 * - /items     : Work items (renamed from tasks to avoid collision)
 * - /sprints   : Sprint management
 * - /comments  : Comment management
 * - /roadmaps  : Roadmap generation
 */

import { Router } from 'express';
import { authenticate } from '../../../middleware/auth';

// Import existing PM routes
import projectRoutes from '../../../modules/pm/routes/project.routes';
import projectExtrasRoutes from '../../../modules/pm/routes/projectExtras.routes';
import workflowRoutes from '../../../modules/pm/routes/workflow.routes';
import taskRoutes from '../../../modules/pm/routes/task.routes';
import sprintRoutes from '../../../modules/pm/routes/sprint.routes';
import commentRoutes from '../../../modules/pm/routes/comment.routes';
import activityRoutes from '../../../modules/pm/routes/activity.routes';
import boardRoutes from '../../../modules/pm/routes/board.routes';
import methodologyRoutes from '../../../modules/pm/routes/methodology.routes';
import roadmapRoutes from '../../../modules/pm/routes/roadmap.routes';
import searchRoutes from '../../../modules/pm/routes/search.routes';
import exportRoutes from '../../../modules/pm/routes/export.routes';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Project routes
router.use('/projects', projectRoutes);

// Project extras routes (phases, gates, milestones, files, etc.)
router.use('/projects', projectExtrasRoutes);

// Workflow routes (must come after project routes to avoid conflicts)
router.use('/projects', workflowRoutes);

// Methodology routes (project-scoped)
router.use('/projects', methodologyRoutes);

// Task routes (will be renamed to items in future)
// Currently using existing task routes for compatibility
router.use('/', taskRoutes);

// Sprint routes
router.use('/', sprintRoutes);

// Comment routes
router.use('/', commentRoutes);

// Activity routes
router.use('/', activityRoutes);

// Board routes
router.use('/', boardRoutes);

// Roadmap routes
router.use('/', roadmapRoutes);

// Search routes
router.use('/search', searchRoutes);

// Export routes
router.use('/export', exportRoutes);

export default router;
