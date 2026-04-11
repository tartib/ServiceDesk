import { Router, Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import * as retrospectiveController from '../controllers/retrospective.controller';
import { authenticate } from '../../../middleware/auth';
import { handleValidation } from '../../../shared/middleware/validate';

const router = Router();

router.use(authenticate);

// ==================== RETROSPECTIVE CRUD ====================

// Create retrospective for a sprint
router.post(
  '/sprints/:sprintId/retrospective',
  [
    param('sprintId').isMongoId().withMessage('Invalid sprint ID'),
    body('maxVotesPerUser').optional().isInt({ min: 1, max: 10 }).withMessage('Max votes must be between 1 and 10'),
  ],
  handleValidation,
  (req: Request, res: Response) => retrospectiveController.createRetrospective(req, res)
);

// Get retrospective by sprint ID
router.get(
  '/sprints/:sprintId/retrospective',
  [param('sprintId').isMongoId().withMessage('Invalid sprint ID')],
  handleValidation,
  (req: Request, res: Response) => retrospectiveController.getRetrospectiveBySprintId(req, res)
);

// Get all retrospectives for a project
router.get(
  '/projects/:projectId/retrospectives',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    query('status').optional().isIn(['draft', 'voting', 'published', 'archived']),
  ],
  handleValidation,
  (req: Request, res: Response) => retrospectiveController.getProjectRetrospectives(req, res)
);

// Get single retrospective
router.get(
  '/retrospectives/:retrospectiveId',
  [param('retrospectiveId').isMongoId().withMessage('Invalid retrospective ID')],
  handleValidation,
  (req: Request, res: Response) => retrospectiveController.getRetrospective(req, res)
);

// Update retrospective
router.put(
  '/retrospectives/:retrospectiveId',
  [
    param('retrospectiveId').isMongoId().withMessage('Invalid retrospective ID'),
    body('maxVotesPerUser').optional().isInt({ min: 1, max: 10 }).withMessage('Max votes must be between 1 and 10'),
    body('status').optional().isIn(['draft', 'voting', 'published', 'archived']),
  ],
  handleValidation,
  (req: Request, res: Response) => retrospectiveController.updateRetrospective(req, res)
);

// Delete retrospective
router.delete(
  '/retrospectives/:retrospectiveId',
  [param('retrospectiveId').isMongoId().withMessage('Invalid retrospective ID')],
  handleValidation,
  (req: Request, res: Response) => retrospectiveController.deleteRetrospective(req, res)
);

// ==================== STATUS MANAGEMENT ====================

// Start voting phase
router.post(
  '/retrospectives/:retrospectiveId/start-voting',
  [param('retrospectiveId').isMongoId().withMessage('Invalid retrospective ID')],
  handleValidation,
  (req: Request, res: Response) => retrospectiveController.startVoting(req, res)
);

// Publish retrospective
router.post(
  '/retrospectives/:retrospectiveId/publish',
  [param('retrospectiveId').isMongoId().withMessage('Invalid retrospective ID')],
  handleValidation,
  (req: Request, res: Response) => retrospectiveController.publishRetrospective(req, res)
);

// Archive retrospective
router.post(
  '/retrospectives/:retrospectiveId/archive',
  [param('retrospectiveId').isMongoId().withMessage('Invalid retrospective ID')],
  handleValidation,
  (req: Request, res: Response) => retrospectiveController.archiveRetrospective(req, res)
);

// ==================== NOTES ====================

// Add note
router.post(
  '/retrospectives/:retrospectiveId/notes',
  [
    param('retrospectiveId').isMongoId().withMessage('Invalid retrospective ID'),
    body('category').isIn(['went_well', 'to_improve']).withMessage('Category must be went_well or to_improve'),
    body('content').trim().notEmpty().withMessage('Content is required').isLength({ max: 1000 }),
  ],
  handleValidation,
  (req: Request, res: Response) => retrospectiveController.addNote(req, res)
);

// Update note
router.put(
  '/retrospectives/:retrospectiveId/notes/:noteId',
  [
    param('retrospectiveId').isMongoId().withMessage('Invalid retrospective ID'),
    param('noteId').isMongoId().withMessage('Invalid note ID'),
    body('content').optional().trim().notEmpty().isLength({ max: 1000 }),
    body('category').optional().isIn(['went_well', 'to_improve']),
  ],
  handleValidation,
  (req: Request, res: Response) => retrospectiveController.updateNote(req, res)
);

// Delete note
router.delete(
  '/retrospectives/:retrospectiveId/notes/:noteId',
  [
    param('retrospectiveId').isMongoId().withMessage('Invalid retrospective ID'),
    param('noteId').isMongoId().withMessage('Invalid note ID'),
  ],
  handleValidation,
  (req: Request, res: Response) => retrospectiveController.deleteNote(req, res)
);

// ==================== VOTING ====================

// Get voting status for current user
router.get(
  '/retrospectives/:retrospectiveId/voting-status',
  [param('retrospectiveId').isMongoId().withMessage('Invalid retrospective ID')],
  handleValidation,
  (req: Request, res: Response) => retrospectiveController.getVotingStatus(req, res)
);

// Vote on a note
router.post(
  '/retrospectives/:retrospectiveId/notes/:noteId/vote',
  [
    param('retrospectiveId').isMongoId().withMessage('Invalid retrospective ID'),
    param('noteId').isMongoId().withMessage('Invalid note ID'),
  ],
  handleValidation,
  (req: Request, res: Response) => retrospectiveController.voteOnNote(req, res)
);

// Remove vote from a note
router.delete(
  '/retrospectives/:retrospectiveId/notes/:noteId/vote',
  [
    param('retrospectiveId').isMongoId().withMessage('Invalid retrospective ID'),
    param('noteId').isMongoId().withMessage('Invalid note ID'),
  ],
  handleValidation,
  (req: Request, res: Response) => retrospectiveController.removeVote(req, res)
);

// ==================== ACTION ITEMS ====================

// Get action items
router.get(
  '/retrospectives/:retrospectiveId/action-items',
  [
    param('retrospectiveId').isMongoId().withMessage('Invalid retrospective ID'),
    query('status').optional().isIn(['pending', 'in_progress', 'completed']),
  ],
  handleValidation,
  (req: Request, res: Response) => retrospectiveController.getActionItems(req, res)
);

// Add action item
router.post(
  '/retrospectives/:retrospectiveId/action-items',
  [
    param('retrospectiveId').isMongoId().withMessage('Invalid retrospective ID'),
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('owner').optional().isMongoId().withMessage('Invalid owner ID'),
    body('dueDate').optional().isISO8601().withMessage('Invalid due date'),
    body('linkedNoteId').optional().isMongoId().withMessage('Invalid note ID'),
    body('linkedToNextSprint').optional().isMongoId().withMessage('Invalid sprint ID'),
  ],
  handleValidation,
  (req: Request, res: Response) => retrospectiveController.addActionItem(req, res)
);

// Update action item
router.put(
  '/retrospectives/:retrospectiveId/action-items/:actionItemId',
  [
    param('retrospectiveId').isMongoId().withMessage('Invalid retrospective ID'),
    param('actionItemId').isMongoId().withMessage('Invalid action item ID'),
    body('title').optional().trim().notEmpty().isLength({ max: 200 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('owner').optional({ nullable: true }).isMongoId().withMessage('Invalid owner ID'),
    body('dueDate').optional({ nullable: true }).isISO8601().withMessage('Invalid due date'),
    body('status').optional().isIn(['pending', 'in_progress', 'completed']),
    body('linkedToNextSprint').optional({ nullable: true }).isMongoId().withMessage('Invalid sprint ID'),
  ],
  handleValidation,
  (req: Request, res: Response) => retrospectiveController.updateActionItem(req, res)
);

// Delete action item
router.delete(
  '/retrospectives/:retrospectiveId/action-items/:actionItemId',
  [
    param('retrospectiveId').isMongoId().withMessage('Invalid retrospective ID'),
    param('actionItemId').isMongoId().withMessage('Invalid action item ID'),
  ],
  handleValidation,
  (req: Request, res: Response) => retrospectiveController.deleteActionItem(req, res)
);

export default router;
