import { Router, Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import * as taskController from '../../controllers/pm/task.controller';
import { authenticate } from '../../middleware/auth';

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
  (req: Request, res: Response) => taskController.createTask(req as any, res)
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
  (req: Request, res: Response) => taskController.getTasks(req as any, res)
);

// Board tasks route moved to board.routes.ts (getFullBoard)

// Get single task
router.get(
  '/tasks/:taskId',
  [param('taskId').isMongoId().withMessage('Invalid task ID')],
  (req: Request, res: Response) => taskController.getTask(req as any, res)
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

router.put('/tasks/:taskId', updateTaskValidation, (req: Request, res: Response) => taskController.updateTask(req as any, res));
router.patch('/tasks/:taskId', updateTaskValidation, (req: Request, res: Response) => taskController.updateTask(req as any, res));

// Transition task status
router.post(
  '/tasks/:taskId/transition',
  [
    param('taskId').isMongoId().withMessage('Invalid task ID'),
    body('statusId').notEmpty().withMessage('Status ID is required'),
    body('comment').optional(),
  ],
  (req: Request, res: Response) => taskController.transitionTask(req as any, res)
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
  (req: Request, res: Response) => taskController.moveTask(req as any, res)
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
  (req: Request, res: Response) => taskController.reorderTasks(req as any, res)
);

// Delete task
router.delete(
  '/tasks/:taskId',
  [param('taskId').isMongoId().withMessage('Invalid task ID')],
  (req: Request, res: Response) => taskController.deleteTask(req as any, res)
);

// Clone task
router.post(
  '/tasks/:taskId/clone',
  [param('taskId').isMongoId().withMessage('Invalid task ID')],
  (req: Request, res: Response) => taskController.cloneTask(req as any, res)
);

// ==================== WATCHERS ====================

// Get watchers
router.get(
  '/tasks/:taskId/watchers',
  [param('taskId').isMongoId().withMessage('Invalid task ID')],
  (req: Request, res: Response) => taskController.getWatchers(req as any, res)
);

// Add watcher (self or specific user)
router.post(
  '/tasks/:taskId/watchers',
  [
    param('taskId').isMongoId().withMessage('Invalid task ID'),
    body('userId').optional().isMongoId().withMessage('Invalid user ID'),
  ],
  (req: Request, res: Response) => taskController.addWatcher(req as any, res)
);

// Remove watcher
router.delete(
  '/tasks/:taskId/watchers/:userId',
  [
    param('taskId').isMongoId().withMessage('Invalid task ID'),
    param('userId').isMongoId().withMessage('Invalid user ID'),
  ],
  (req: Request, res: Response) => taskController.removeWatcher(req as any, res)
);

// Remove self as watcher
router.delete(
  '/tasks/:taskId/watchers',
  [param('taskId').isMongoId().withMessage('Invalid task ID')],
  (req: Request, res: Response) => taskController.removeWatcher(req as any, res)
);

// ==================== SUBTASK PROGRESS ====================

// Get subtask progress for a task
router.get(
  '/tasks/:taskId/progress',
  [param('taskId').isMongoId().withMessage('Invalid task ID')],
  (req: Request, res: Response) => taskController.getSubtaskProgress(req as any, res)
);

// ==================== TASK LINKS ====================

// Get task links
router.get(
  '/tasks/:taskId/links',
  [param('taskId').isMongoId().withMessage('Invalid task ID')],
  (req: Request, res: Response) => taskController.getTaskLinks(req as any, res)
);

// Add task link
router.post(
  '/tasks/:taskId/links',
  [
    param('taskId').isMongoId().withMessage('Invalid task ID'),
    body('type').notEmpty().withMessage('Link type is required'),
    body('targetIssueKey').notEmpty().withMessage('Target issue key is required'),
  ],
  (req: Request, res: Response) => taskController.addTaskLink(req as any, res)
);

// Remove task link
router.delete(
  '/tasks/:taskId/links/:linkId',
  [
    param('taskId').isMongoId().withMessage('Invalid task ID'),
    param('linkId').isMongoId().withMessage('Invalid link ID'),
  ],
  (req: Request, res: Response) => taskController.removeTaskLink(req as any, res)
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
  (req: Request, res: Response) => taskController.addWebLink(req as any, res)
);

// Remove web link
router.delete(
  '/tasks/:taskId/web-links/:linkId',
  [
    param('taskId').isMongoId().withMessage('Invalid task ID'),
    param('linkId').isMongoId().withMessage('Invalid link ID'),
  ],
  (req: Request, res: Response) => taskController.removeWebLink(req as any, res)
);

// ==================== ISSUE TYPES (WORK TYPES) ====================

// Get project issue types
router.get(
  '/projects/:projectId/issue-types',
  [param('projectId').isMongoId().withMessage('Invalid project ID')],
  (req: Request, res: Response) => taskController.getIssueTypes(req as any, res)
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
  (req: Request, res: Response) => taskController.addIssueType(req as any, res)
);

// Update issue type
router.patch(
  '/projects/:projectId/issue-types/:typeId',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    param('typeId').notEmpty().withMessage('Type ID is required'),
  ],
  (req: Request, res: Response) => taskController.updateIssueType(req as any, res)
);

// Delete issue type
router.delete(
  '/projects/:projectId/issue-types/:typeId',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    param('typeId').notEmpty().withMessage('Type ID is required'),
  ],
  (req: Request, res: Response) => taskController.deleteIssueType(req as any, res)
);

export default router;
