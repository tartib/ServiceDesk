import { Router, Request, Response } from 'express';
import { body, param } from 'express-validator';
import * as workflowController from '../../controllers/pm/workflow.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

// Get workflow for project
router.get(
  '/projects/:projectId/workflow',
  [param('projectId').isMongoId().withMessage('Invalid project ID')],
  (req: Request, res: Response) => workflowController.getWorkflowByProject(req as any, res)
);

// Reorder statuses (must come before :statusId routes to avoid conflict)
router.patch(
  '/projects/:projectId/workflow/statuses/reorder',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    body('statusOrder')
      .isArray()
      .withMessage('statusOrder must be an array of status IDs'),
  ],
  (req: Request, res: Response) => workflowController.reorderStatuses(req as any, res)
);

// Add new status to workflow
router.post(
  '/projects/:projectId/workflow/statuses',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    body('id')
      .trim()
      .notEmpty()
      .withMessage('Status ID is required')
      .matches(/^[a-z0-9-]+$/)
      .withMessage('Status ID must be lowercase alphanumeric with hyphens only'),
    body('name').trim().notEmpty().withMessage('Status name is required'),
    body('category')
      .optional()
      .isIn(['todo', 'in_progress', 'done', 'TODO', 'IN_PROGRESS', 'DONE'])
      .withMessage('Category must be todo, in_progress, done, TODO, IN_PROGRESS, or DONE'),
    body('color')
      .optional()
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage('Color must be a valid hex color code'),
    body('isInitial').optional().isBoolean(),
    body('isFinal').optional().isBoolean(),
  ],
  (req: Request, res: Response) => workflowController.addStatus(req as any, res)
);

// Update existing status
router.patch(
  '/projects/:projectId/workflow/statuses/:statusId',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    param('statusId').trim().notEmpty().withMessage('Status ID is required'),
    body('name').optional().trim().notEmpty().withMessage('Status name cannot be empty'),
    body('category')
      .optional()
      .isIn(['todo', 'in_progress', 'done', 'TODO', 'IN_PROGRESS', 'DONE'])
      .withMessage('Category must be todo, in_progress, done, TODO, IN_PROGRESS, or DONE'),
    body('color')
      .optional()
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage('Color must be a valid hex color code'),
    body('isInitial').optional().isBoolean(),
    body('isFinal').optional().isBoolean(),
  ],
  (req: Request, res: Response) => workflowController.updateStatus(req as any, res)
);

// Delete status
router.delete(
  '/projects/:projectId/workflow/statuses/:statusId',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    param('statusId').trim().notEmpty().withMessage('Status ID is required'),
  ],
  (req: Request, res: Response) => workflowController.deleteStatus(req as any, res)
);

export default router;
