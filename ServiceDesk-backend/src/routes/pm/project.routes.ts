import { Router, Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import * as projectController from '../../controllers/pm/project.controller';
import * as standupController from '../../controllers/pm/standup.controller';
import { authenticate } from '../../middleware/auth';
import { validate, validateMulti } from '../../shared/middleware/validate';
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
  (req: Request, res: Response) => projectController.createProject(req as any, res)
);

router.get('/', (req: Request, res: Response) => projectController.getProjects(req as any, res));

router.get(
  '/:projectId',
  [param('projectId').isMongoId().withMessage('Invalid project ID')],
  (req: Request, res: Response) => projectController.getProject(req as any, res)
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
  (req: Request, res: Response) => projectController.updateProject(req as any, res)
);

router.delete(
  '/:projectId',
  [param('projectId').isMongoId().withMessage('Invalid project ID')],
  (req: Request, res: Response) => projectController.deleteProject(req as any, res)
);

// Get project members
router.get(
  '/:projectId/members',
  [param('projectId').isMongoId().withMessage('Invalid project ID')],
  (req: Request, res: Response) => projectController.getProjectMembers(req as any, res)
);

// Add member by userId (legacy)
router.post(
  '/:projectId/members',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    body('userId').isMongoId().withMessage('Invalid user ID'),
    body('role').optional().isIn(['lead', 'manager', 'contributor', 'member', 'viewer']),
  ],
  (req: Request, res: Response) => projectController.addProjectMember(req as any, res)
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
  (req: Request, res: Response) => projectController.addMemberByEmail(req as any, res)
);

// Update member role
router.put(
  '/:projectId/members/:memberId/role',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    param('memberId').isMongoId().withMessage('Invalid member ID'),
    body('role').isIn(['manager', 'contributor', 'viewer']).withMessage('Invalid role'),
  ],
  (req: Request, res: Response) => projectController.updateMemberRole(req as any, res)
);

// Remove member
router.delete(
  '/:projectId/members/:memberId',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    param('memberId').isMongoId().withMessage('Invalid member ID'),
  ],
  (req: Request, res: Response) => projectController.removeProjectMember(req as any, res)
);

// Get project labels
router.get(
  '/:projectId/labels',
  [param('projectId').isMongoId().withMessage('Invalid project ID')],
  (req: Request, res: Response) => projectController.getProjectLabels(req as any, res)
);

// Archive project
router.post(
  '/:projectId/archive',
  [param('projectId').isMongoId().withMessage('Invalid project ID')],
  (req: Request, res: Response) => projectController.archiveProject(req as any, res)
);

// Get project teams
router.get(
  '/:projectId/teams',
  [param('projectId').isMongoId().withMessage('Invalid project ID')],
  (req: Request, res: Response) => projectController.getProjectTeams(req as any, res)
);

// Get all available teams in organization (for adding to project)
router.get(
  '/:projectId/available-teams',
  [param('projectId').isMongoId().withMessage('Invalid project ID')],
  (req: Request, res: Response) => projectController.getAvailableTeams(req as any, res)
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
  (req: Request, res: Response) => projectController.addProjectTeam(req as any, res)
);

// Remove team from project
router.delete(
  '/:projectId/teams/:teamId',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    param('teamId').isMongoId().withMessage('Invalid team ID'),
  ],
  (req: Request, res: Response) => projectController.removeProjectTeam(req as any, res)
);

// Get team members within project context
router.get(
  '/:projectId/teams/:teamId/members',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    param('teamId').isMongoId().withMessage('Invalid team ID'),
  ],
  (req: Request, res: Response) => projectController.getProjectTeamMembers(req as any, res)
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
  (req: Request, res: Response) => projectController.addProjectTeamMember(req as any, res)
);

// Remove member from team within project context
router.delete(
  '/:projectId/teams/:teamId/members/:memberId',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    param('teamId').isMongoId().withMessage('Invalid team ID'),
    param('memberId').isMongoId().withMessage('Invalid member ID'),
  ],
  (req: Request, res: Response) => projectController.removeProjectTeamMember(req as any, res)
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
  (req: Request, res: Response) => standupController.createStandup(req as any, res)
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
  (req: Request, res: Response) => standupController.getStandups(req as any, res)
);

// Get today's published standups for a project
router.get(
  '/:projectId/standups/today',
  [param('projectId').isMongoId().withMessage('Invalid project ID')],
  (req: Request, res: Response) => standupController.getTodayStandups(req as any, res)
);

// Get current user's standup for a project
router.get(
  '/:projectId/standups/me',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    query('date').optional().isISO8601(),
  ],
  (req: Request, res: Response) => standupController.getMyStandup(req as any, res)
);

// Get standup summary for leaders (User Story 5)
router.get(
  '/:projectId/standups/summary',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    query('date').optional().isISO8601(),
  ],
  (req: Request, res: Response) => standupController.getStandupSummary(req as any, res)
);

export default router;
