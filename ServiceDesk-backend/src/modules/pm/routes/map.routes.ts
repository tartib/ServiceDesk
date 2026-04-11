import { Router, Request, Response } from 'express';
import { param } from 'express-validator';
import * as mapController from '../controllers/map.controller';
import { authenticate } from '../../../middleware/auth';
import { handleValidation } from '../../../shared/middleware/validate';

const router = Router();

router.use(authenticate);

// Get graph-ready map view for a project
router.get(
  '/projects/:projectId/map-view',
  [param('projectId').isMongoId().withMessage('Invalid project ID')],
  handleValidation,
  (req: Request, res: Response) => mapController.getMapView(req, res)
);

export default router;
