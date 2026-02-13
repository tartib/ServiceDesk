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
import projectRoutes from '../../../routes/pm/project.routes';
import taskRoutes from '../../../routes/pm/task.routes';
import sprintRoutes from '../../../routes/pm/sprint.routes';
import commentRoutes from '../../../routes/pm/comment.routes';
import activityRoutes from '../../../routes/pm/activity.routes';
import boardRoutes from '../../../routes/pm/board.routes';
import methodologyRoutes from '../../../routes/pm/methodology.routes';
import roadmapRoutes from '../../../routes/pm/roadmap.routes';
import searchRoutes from '../../../routes/pm/search.routes';
import exportRoutes from '../../../routes/pm/export.routes';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Project routes
router.use('/projects', projectRoutes);

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
