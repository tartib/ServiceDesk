import { Router, Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import * as taskController from '../controllers/task.controller';
import { authenticate } from '../../../middleware/auth';
import { handleValidation } from '../../../shared/middleware/validate';

const router = Router();

router.use(authenticate);

// Create task
router.post(
  '/projects/:projectId/tasks',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('type').optional().isString(),
    body('priority').optional().isIn(['critical', 'high', 'medium', 'low']),
    body('assignee').optional({ nullable: true, checkFalsy: true }).isMongoId(),
    body('storyPoints').optional({ nullable: true, checkFalsy: true }).isNumeric(),
    body('dueDate').optional({ nullable: true, checkFalsy: true }).isISO8601(),
  ],
  handleValidation,
  (req: Request, res: Response) => taskController.createTask(req, res)
);

// Get tasks for project
router.get(
  '/projects/:projectId/tasks',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    query('status').optional(),
    query('type').optional(),
    query('assignee').optional().isMongoId(),
    query('sprintId').optional().isMongoId(),
    query('page').optional().isNumeric(),
    query('limit').optional().isNumeric(),
  ],
  handleValidation,
  (req: Request, res: Response) => taskController.getTasks(req, res)
);

// Board tasks route moved to board.routes.ts (getFullBoard)

// Get single task
router.get(
  '/tasks/:taskId',
  [param('taskId').isMongoId().withMessage('Invalid task ID')],
  handleValidation,
  (req: Request, res: Response) => taskController.getTask(req, res)
);

// Update task
const updateTaskValidation = [
  param('taskId').isMongoId().withMessage('Invalid task ID'),
  body('title').optional().trim().notEmpty(),
  body('description').optional(),
  body('type').optional().isString(),
  body('priority').optional().isIn(['critical', 'high', 'medium', 'low']),
  body('assignee').optional({ nullable: true, checkFalsy: true }).isMongoId(),
  body('storyPoints').optional({ nullable: true, checkFalsy: true }).isNumeric(),
  body('dueDate').optional({ nullable: true, checkFalsy: true }).isISO8601(),
  body('startDate').optional({ nullable: true, checkFalsy: true }).isISO8601(),
];

router.patch('/tasks/:taskId', updateTaskValidation, handleValidation, (req: Request, res: Response) => taskController.updateTask(req, res));

// Transition task status
router.post(
  '/tasks/:taskId/transition',
  [
    param('taskId').isMongoId().withMessage('Invalid task ID'),
    body('statusId').notEmpty().withMessage('Status ID is required'),
    body('comment').optional(),
  ],
  handleValidation,
  (req: Request, res: Response) => taskController.transitionTask(req, res)
);

// Move task (drag & drop on board)
router.post(
  '/tasks/:taskId/move',
  [
    param('taskId').isMongoId().withMessage('Invalid task ID'),
    body('statusId').optional(),
    body('columnOrder').optional().isNumeric(),
    body('sprintId').optional(),
  ],
  handleValidation,
  (req: Request, res: Response) => taskController.moveTask(req, res)
);

// Reorder tasks (bulk update columnOrder after drag & drop)
router.post(
  '/projects/:projectId/tasks/reorder',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    body('tasks').isArray({ min: 1 }).withMessage('tasks array is required'),
    body('tasks.*.taskId').isMongoId().withMessage('Invalid task ID'),
    body('tasks.*.columnOrder').isNumeric().withMessage('columnOrder is required'),
  ],
  handleValidation,
  (req: Request, res: Response) => taskController.reorderTasks(req, res)
);

// Delete task
router.delete(
  '/tasks/:taskId',
  [param('taskId').isMongoId().withMessage('Invalid task ID')],
  handleValidation,
  (req: Request, res: Response) => taskController.deleteTask(req, res)
);

// Clone task
router.post(
  '/tasks/:taskId/clone',
  [param('taskId').isMongoId().withMessage('Invalid task ID')],
  handleValidation,
  (req: Request, res: Response) => taskController.cloneTask(req, res)
);

// ==================== WATCHERS ====================

// Get watchers
router.get(
  '/tasks/:taskId/watchers',
  [param('taskId').isMongoId().withMessage('Invalid task ID')],
  handleValidation,
  (req: Request, res: Response) => taskController.getWatchers(req, res)
);

// Add watcher (self or specific user)
router.post(
  '/tasks/:taskId/watchers',
  [
    param('taskId').isMongoId().withMessage('Invalid task ID'),
    body('userId').optional().isMongoId().withMessage('Invalid user ID'),
  ],
  handleValidation,
  (req: Request, res: Response) => taskController.addWatcher(req, res)
);

// Remove watcher
router.delete(
  '/tasks/:taskId/watchers/:userId',
  [
    param('taskId').isMongoId().withMessage('Invalid task ID'),
    param('userId').isMongoId().withMessage('Invalid user ID'),
  ],
  handleValidation,
  (req: Request, res: Response) => taskController.removeWatcher(req, res)
);

// Remove self as watcher
router.delete(
  '/tasks/:taskId/watchers',
  [param('taskId').isMongoId().withMessage('Invalid task ID')],
  handleValidation,
  (req: Request, res: Response) => taskController.removeWatcher(req, res)
);

// ==================== SUBTASK PROGRESS ====================

// Get subtask progress for a task
router.get(
  '/tasks/:taskId/progress',
  [param('taskId').isMongoId().withMessage('Invalid task ID')],
  handleValidation,
  (req: Request, res: Response) => taskController.getSubtaskProgress(req, res)
);

// ==================== TASK LINKS ====================

// Get task links
router.get(
  '/tasks/:taskId/links',
  [param('taskId').isMongoId().withMessage('Invalid task ID')],
  handleValidation,
  (req: Request, res: Response) => taskController.getTaskLinks(req, res)
);

// Add task link
router.post(
  '/tasks/:taskId/links',
  [
    param('taskId').isMongoId().withMessage('Invalid task ID'),
    body('type').notEmpty().withMessage('Link type is required'),
    body('targetIssueKey').notEmpty().withMessage('Target issue key is required'),
  ],
  handleValidation,
  (req: Request, res: Response) => taskController.addTaskLink(req, res)
);

// Remove task link
router.delete(
  '/tasks/:taskId/links/:linkId',
  [
    param('taskId').isMongoId().withMessage('Invalid task ID'),
    param('linkId').isMongoId().withMessage('Invalid link ID'),
  ],
  handleValidation,
  (req: Request, res: Response) => taskController.removeTaskLink(req, res)
);

// ==================== WEB LINKS ====================

// Add web link
router.post(
  '/tasks/:taskId/web-links',
  [
    param('taskId').isMongoId().withMessage('Invalid task ID'),
    body('url').notEmpty().withMessage('URL is required'),
    body('title').notEmpty().withMessage('Title is required'),
  ],
  handleValidation,
  (req: Request, res: Response) => taskController.addWebLink(req, res)
);

// Remove web link
router.delete(
  '/tasks/:taskId/web-links/:linkId',
  [
    param('taskId').isMongoId().withMessage('Invalid task ID'),
    param('linkId').isMongoId().withMessage('Invalid link ID'),
  ],
  handleValidation,
  (req: Request, res: Response) => taskController.removeWebLink(req, res)
);

// ==================== ISSUE TYPES (WORK TYPES) ====================

// Get project issue types
router.get(
  '/projects/:projectId/issue-types',
  [param('projectId').isMongoId().withMessage('Invalid project ID')],
  handleValidation,
  (req: Request, res: Response) => taskController.getIssueTypes(req, res)
);

// Add issue type
router.post(
  '/projects/:projectId/issue-types',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    body('id').trim().notEmpty().withMessage('ID is required'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('icon').trim().notEmpty().withMessage('Icon is required'),
    body('color').trim().notEmpty().withMessage('Color is required'),
  ],
  handleValidation,
  (req: Request, res: Response) => taskController.addIssueType(req, res)
);

// Update issue type
router.patch(
  '/projects/:projectId/issue-types/:typeId',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    param('typeId').notEmpty().withMessage('Type ID is required'),
  ],
  handleValidation,
  (req: Request, res: Response) => taskController.updateIssueType(req, res)
);

// Delete issue type
router.delete(
  '/projects/:projectId/issue-types/:typeId',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    param('typeId').notEmpty().withMessage('Type ID is required'),
  ],
  handleValidation,
  (req: Request, res: Response) => taskController.deleteIssueType(req, res)
);

export default router;
