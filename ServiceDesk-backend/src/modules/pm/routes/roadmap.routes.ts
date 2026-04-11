import { Router, Request, Response } from 'express';
import { param, body } from 'express-validator';
import * as roadmapController from '../controllers/roadmap.controller';
import { authenticate } from '../../../middleware/auth';
import { handleValidation } from '../../../shared/middleware/validate';

const router = Router();

router.use(authenticate);

// Generate roadmap for project
router.post(
  '/projects/:projectId/roadmap',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    body('type').optional().isIn(['sprint_timeline', 'release_plan', 'gantt', 'change_calendar', 'okr_progress', 'value_stream']),
  ],
  handleValidation,
  (req: Request, res: Response) => roadmapController.generateRoadmap(req, res)
);

// Get all roadmaps for project
router.get(
  '/projects/:projectId/roadmaps',
  [param('projectId').isMongoId().withMessage('Invalid project ID')],
  handleValidation,
  (req: Request, res: Response) => roadmapController.getRoadmaps(req, res)
);

// Get single roadmap
router.get(
  '/roadmaps/:roadmapId',
  [param('roadmapId').isMongoId().withMessage('Invalid roadmap ID')],
  handleValidation,
  (req: Request, res: Response) => roadmapController.getRoadmap(req, res)
);

// Delete roadmap
router.delete(
  '/roadmaps/:roadmapId',
  [param('roadmapId').isMongoId().withMessage('Invalid roadmap ID')],
  handleValidation,
  (req: Request, res: Response) => roadmapController.deleteRoadmap(req, res)
);

export default router;
