import { Router, Request, Response } from 'express';
import { param, body } from 'express-validator';
import * as roadmapController from '../../controllers/pm/roadmap.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

// Generate roadmap for project
router.post(
  '/projects/:projectId/roadmap',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    body('type').optional().isIn(['sprint_timeline', 'release_plan', 'gantt', 'change_calendar', 'okr_progress', 'value_stream']),
  ],
  (req: Request, res: Response) => roadmapController.generateRoadmap(req as any, res)
);

// Get all roadmaps for project
router.get(
  '/projects/:projectId/roadmaps',
  [param('projectId').isMongoId().withMessage('Invalid project ID')],
  (req: Request, res: Response) => roadmapController.getRoadmaps(req as any, res)
);

// Get single roadmap
router.get(
  '/roadmaps/:roadmapId',
  [param('roadmapId').isMongoId().withMessage('Invalid roadmap ID')],
  (req: Request, res: Response) => roadmapController.getRoadmap(req as any, res)
);

// Delete roadmap
router.delete(
  '/roadmaps/:roadmapId',
  [param('roadmapId').isMongoId().withMessage('Invalid roadmap ID')],
  (req: Request, res: Response) => roadmapController.deleteRoadmap(req as any, res)
);

export default router;
