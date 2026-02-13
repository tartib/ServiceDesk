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
    body('type').optional().isIn(['epic', 'story', 'task', 'bug', 'feature', 'subtask', 'change', 'incident', 'problem']),
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
  body('type').optional().isIn(['epic', 'story', 'task', 'bug', 'feature', 'subtask', 'change', 'incident', 'problem']),
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

// Delete task
router.delete(
  '/tasks/:taskId',
  [param('taskId').isMongoId().withMessage('Invalid task ID')],
  (req: Request, res: Response) => taskController.deleteTask(req as any, res)
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

export default router;
