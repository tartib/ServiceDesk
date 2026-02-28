import { Router, Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import * as intakeController from '../../controllers/pm/intake.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

// Create intake request
router.post(
  '/intake',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category')
      .isIn(['new_product', 'improvement', 'maintenance', 'research', 'infrastructure'])
      .withMessage('Valid category is required'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('businessJustification').optional().trim(),
    body('expectedBenefits').optional().trim(),
    body('estimatedBudget').optional().isNumeric(),
    body('estimatedTimeline').optional().trim(),
    body('riskLevel').optional().isIn(['low', 'medium', 'high']),
    body('strategicAlignment').optional().trim(),
    body('preferredMethodology').optional().isIn(['scrum', 'kanban', 'waterfall', 'itil', 'lean', 'okr']),
    body('suggestedTeam').optional().trim(),
  ],
  (req: Request, res: Response) => intakeController.createIntakeRequest(req as any, res)
);

// Get intake stats (must be before /:intakeId to avoid conflict)
router.get(
  '/intake/stats',
  (req: Request, res: Response) => intakeController.getIntakeStats(req as any, res)
);

// Get all intake requests
router.get(
  '/intake',
  [
    query('stage').optional().isIn(['draft', 'screening', 'business_case', 'prioritization', 'approved', 'rejected', 'cancelled']),
    query('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    query('category').optional().isIn(['new_product', 'improvement', 'maintenance', 'research', 'infrastructure']),
    query('requestedBy').optional().isMongoId(),
    query('page').optional().isNumeric(),
    query('limit').optional().isNumeric(),
  ],
  (req: Request, res: Response) => intakeController.getIntakeRequests(req as any, res)
);

// Get single intake request
router.get(
  '/intake/:intakeId',
  [param('intakeId').isMongoId().withMessage('Invalid intake ID')],
  (req: Request, res: Response) => intakeController.getIntakeRequest(req as any, res)
);

// Update intake request
router.put(
  '/intake/:intakeId',
  [
    param('intakeId').isMongoId().withMessage('Invalid intake ID'),
    body('title').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('category').optional().isIn(['new_product', 'improvement', 'maintenance', 'research', 'infrastructure']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('businessJustification').optional().trim(),
    body('expectedBenefits').optional().trim(),
    body('estimatedBudget').optional().isNumeric(),
    body('estimatedTimeline').optional().trim(),
    body('riskLevel').optional().isIn(['low', 'medium', 'high']),
    body('strategicAlignment').optional().trim(),
    body('preferredMethodology').optional().isIn(['scrum', 'kanban', 'waterfall', 'itil', 'lean', 'okr']),
    body('suggestedTeam').optional().trim(),
  ],
  (req: Request, res: Response) => intakeController.updateIntakeRequest(req as any, res)
);

// Advance to next stage
router.post(
  '/intake/:intakeId/advance',
  [
    param('intakeId').isMongoId().withMessage('Invalid intake ID'),
    body('comment').optional().trim(),
  ],
  (req: Request, res: Response) => intakeController.advanceStage(req as any, res)
);

// Reject request
router.post(
  '/intake/:intakeId/reject',
  [
    param('intakeId').isMongoId().withMessage('Invalid intake ID'),
    body('comment').trim().notEmpty().withMessage('Comment is required when rejecting'),
  ],
  (req: Request, res: Response) => intakeController.rejectRequest(req as any, res)
);

// Cancel request
router.post(
  '/intake/:intakeId/cancel',
  [param('intakeId').isMongoId().withMessage('Invalid intake ID')],
  (req: Request, res: Response) => intakeController.cancelRequest(req as any, res)
);

// Approve request (creates project)
router.post(
  '/intake/:intakeId/approve',
  [
    param('intakeId').isMongoId().withMessage('Invalid intake ID'),
    body('comment').optional().trim(),
    body('projectKey').optional().trim().isLength({ min: 2, max: 10 }),
  ],
  (req: Request, res: Response) => intakeController.approveRequest(req as any, res)
);

// Add comment
router.post(
  '/intake/:intakeId/comments',
  [
    param('intakeId').isMongoId().withMessage('Invalid intake ID'),
    body('content').trim().notEmpty().withMessage('Comment content is required'),
  ],
  (req: Request, res: Response) => intakeController.addComment(req as any, res)
);

// Add/update score
router.post(
  '/intake/:intakeId/scores',
  [
    param('intakeId').isMongoId().withMessage('Invalid intake ID'),
    body('criterion').trim().notEmpty().withMessage('Criterion is required'),
    body('score').isInt({ min: 1, max: 5 }).withMessage('Score must be 1-5'),
  ],
  (req: Request, res: Response) => intakeController.addScore(req as any, res)
);

export default router;
