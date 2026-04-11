import { Router } from 'express';
import problemController from '../controllers/problem.controller';
import { authorize } from '../../../middleware/auth';
import { validate } from '../../../shared/middleware/validate';
import { createProblemSchema } from '../../../shared/validation/schemas';

const router = Router();

router.use(authorize('prep', 'supervisor', 'manager'));

// Static routes before parameterized
router.get('/stats', problemController.getStats);
router.get('/open', problemController.getOpenProblems);
router.get('/known-errors', problemController.getKnownErrors);
router.get('/recurring-incidents', problemController.detectRecurring);
router.post('/from-incident/:incidentId', problemController.createFromIncident);
router.post('/', validate(createProblemSchema), problemController.createProblem);
router.get('/', problemController.getProblems);

// Parameterized routes
router.get('/:id', problemController.getProblem);
router.patch('/:id', problemController.updateProblem);
router.patch('/:id/rca', problemController.updateRootCause);
router.patch('/:id/status', problemController.updateStatus);
router.post('/:id/known-error', problemController.markAsKnownError);
router.post('/:id/known-error/publish', problemController.publishKnownError);
router.post('/:id/rca/start', problemController.startRCA);
router.patch('/:id/rca/complete', problemController.completeRCA);
router.post('/:id/link-incident', problemController.linkIncident);
router.post('/:id/resolve', problemController.resolveProblem);

export default router;
