import { Router, Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import * as projectController from '../controllers/project.controller';
import * as standupController from '../controllers/standup.controller';
import { authenticate, authorize } from '../../../middleware/auth';
import { handleValidation, validate, validateMulti } from '../../../shared/middleware/validate';
import Joi from 'joi';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  [
    body('key')
      .trim()
      .notEmpty()
      .withMessage('Project key is required')
      .isLength({ min: 2, max: 10 })
      .withMessage('Key must be 2-10 characters'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('description').optional().trim(),
    body('methodology').optional().isIn(['scrum', 'kanban', 'waterfall', 'itil', 'lean', 'okr']),
    body('startDate').optional().isISO8601(),
    body('targetEndDate').optional().isISO8601(),
  ],
  handleValidation,
  (req: Request, res: Response) => projectController.createProject(req, res)
);

router.get('/', (req: Request, res: Response) => projectController.getProjects(req, res));

router.get(
  '/:projectId',
  [param('projectId').isMongoId().withMessage('Invalid project ID')],
  handleValidation,
  (req: Request, res: Response) => projectController.getProject(req, res)
);

router.put(
  '/:projectId',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    body('name').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('methodology').optional().isIn(['scrum', 'kanban', 'waterfall', 'itil', 'lean', 'okr']),
    body('startDate').optional().isISO8601(),
    body('targetEndDate').optional().isISO8601(),
  ],
  handleValidation,
  (req: Request, res: Response) => projectController.updateProject(req, res)
);

router.delete(
  '/:projectId',
  authorize('admin', 'manager'),
  [param('projectId').isMongoId().withMessage('Invalid project ID')],
  handleValidation,
  (req: Request, res: Response) => projectController.deleteProject(req, res)
);

// Get project members
router.get(
  '/:projectId/members',
  [param('projectId').isMongoId().withMessage('Invalid project ID')],
  handleValidation,
  (req: Request, res: Response) => projectController.getProjectMembers(req, res)
);

// Add member by userId (legacy)
router.post(
  '/:projectId/members',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    body('userId').isMongoId().withMessage('Invalid user ID'),
    body('role').optional().isIn(['lead', 'manager', 'contributor', 'member', 'viewer']),
  ],
  handleValidation,
  (req: Request, res: Response) => projectController.addProjectMember(req, res)
);

// Add member by email or userId
router.post(
  '/:projectId/members/invite',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('userId').optional().isMongoId().withMessage('Invalid user ID'),
    body('role').optional().isIn(['manager', 'contributor', 'viewer']),
  ],
  handleValidation,
  (req: Request, res: Response) => projectController.addMemberByEmail(req, res)
);

// Update member role
router.put(
  '/:projectId/members/:memberId/role',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    param('memberId').isMongoId().withMessage('Invalid member ID'),
    body('role').isIn(['manager', 'contributor', 'viewer']).withMessage('Invalid role'),
  ],
  handleValidation,
  (req: Request, res: Response) => projectController.updateMemberRole(req, res)
);

// Remove member
router.delete(
  '/:projectId/members/:memberId',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    param('memberId').isMongoId().withMessage('Invalid member ID'),
  ],
  handleValidation,
  (req: Request, res: Response) => projectController.removeProjectMember(req, res)
);

// Get project labels
router.get(
  '/:projectId/labels',
  [param('projectId').isMongoId().withMessage('Invalid project ID')],
  handleValidation,
  (req: Request, res: Response) => projectController.getProjectLabels(req, res)
);

// Archive project (admin/manager/supervisor)
router.post(
  '/:projectId/archive',
  authorize('admin', 'manager', 'supervisor'),
  [param('projectId').isMongoId().withMessage('Invalid project ID')],
  handleValidation,
  (req: Request, res: Response) => projectController.archiveProject(req, res)
);

// Get project teams
router.get(
  '/:projectId/teams',
  [param('projectId').isMongoId().withMessage('Invalid project ID')],
  handleValidation,
  (req: Request, res: Response) => projectController.getProjectTeams(req, res)
);

// Get all available teams in organization (for adding to project)
router.get(
  '/:projectId/available-teams',
  [param('projectId').isMongoId().withMessage('Invalid project ID')],
  handleValidation,
  (req: Request, res: Response) => projectController.getAvailableTeams(req, res)
);

// Add team to project (either existing teamId or create new with name/description)
router.post(
  '/:projectId/teams',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    body('teamId').optional().isMongoId().withMessage('Invalid team ID'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('description').optional().trim(),
    body('role').optional().isIn(['primary', 'supporting']),
  ],
  handleValidation,
  (req: Request, res: Response) => projectController.addProjectTeam(req, res)
);

// Remove team from project
router.delete(
  '/:projectId/teams/:teamId',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    param('teamId').isMongoId().withMessage('Invalid team ID'),
  ],
  handleValidation,
  (req: Request, res: Response) => projectController.removeProjectTeam(req, res)
);

// Get team members within project context
router.get(
  '/:projectId/teams/:teamId/members',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    param('teamId').isMongoId().withMessage('Invalid team ID'),
  ],
  handleValidation,
  (req: Request, res: Response) => projectController.getProjectTeamMembers(req, res)
);

// Add member to team within project context
router.post(
  '/:projectId/teams/:teamId/members',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    param('teamId').isMongoId().withMessage('Invalid team ID'),
    body('userId').optional().isMongoId().withMessage('Invalid user ID'),
    body('email').optional().isEmail().withMessage('Invalid email'),
    body('role').optional().isIn(['lead', 'member']),
  ],
  handleValidation,
  (req: Request, res: Response) => projectController.addProjectTeamMember(req, res)
);

// Remove member from team within project context
router.delete(
  '/:projectId/teams/:teamId/members/:memberId',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    param('teamId').isMongoId().withMessage('Invalid team ID'),
    param('memberId').isMongoId().withMessage('Invalid member ID'),
  ],
  handleValidation,
  (req: Request, res: Response) => projectController.removeProjectTeamMember(req, res)
);

// ==================== Standup Routes ====================

// Create standup for a project
router.post(
  '/:projectId/standups',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    body('yesterday').optional().trim(),
    body('today').trim().notEmpty().withMessage('Today field is required'),
    body('blockers').optional().isArray(),
    body('blockers.*').optional().isString(),
    body('status').optional().isIn(['draft', 'published']),
    body('userId').optional().isMongoId().withMessage('Invalid user ID'),
    body('isTeamStandup').optional().isBoolean(),
  ],
  handleValidation,
  (req: Request, res: Response) => standupController.createStandup(req, res)
);

// Get all standups for a project
router.get(
  '/:projectId/standups',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    query('date').optional().isISO8601(),
    query('userId').optional().isMongoId(),
    query('status').optional().isIn(['draft', 'published']),
  ],
  handleValidation,
  (req: Request, res: Response) => standupController.getStandups(req, res)
);

// Get today's published standups for a project
router.get(
  '/:projectId/standups/today',
  [param('projectId').isMongoId().withMessage('Invalid project ID')],
  handleValidation,
  (req: Request, res: Response) => standupController.getTodayStandups(req, res)
);

// Get current user's standup for a project
router.get(
  '/:projectId/standups/me',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    query('date').optional().isISO8601(),
  ],
  handleValidation,
  (req: Request, res: Response) => standupController.getMyStandup(req, res)
);

// Get standup summary for leaders (User Story 5)
router.get(
  '/:projectId/standups/summary',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    query('date').optional().isISO8601(),
  ],
  handleValidation,
  (req: Request, res: Response) => standupController.getStandupSummary(req, res)
);

export default router;
