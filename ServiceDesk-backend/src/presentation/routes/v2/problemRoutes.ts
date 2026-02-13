import { Router } from 'express';
import problemController from '../../controllers/ProblemController';
import { authenticate, authorize } from '../../../middleware/auth';
import { validate } from '../../../shared/middleware/validate';
import { createProblemSchema } from '../../../shared/validation/schemas';

const router = Router();

// All routes require authentication
router.use(authenticate);

// All authenticated users can access problem routes
router.use(authorize('prep', 'supervisor', 'manager'));

// Problem routes
router.post('/', validate(createProblemSchema), problemController.createProblem);
router.post('/from-incident/:incidentId', problemController.createFromIncident);
router.get('/', problemController.getProblems);
router.get('/stats', problemController.getStats);
router.get('/open', problemController.getOpenProblems);
router.get('/known-errors', problemController.getKnownErrors);
router.get('/:id', problemController.getProblem);
router.patch('/:id', problemController.updateProblem);
router.patch('/:id/rca', problemController.updateRootCause);
router.patch('/:id/status', problemController.updateStatus);
router.post('/:id/known-error', problemController.markAsKnownError);
router.post('/:id/link-incident', problemController.linkIncident);
router.post('/:id/resolve', problemController.resolveProblem);

export default router;
