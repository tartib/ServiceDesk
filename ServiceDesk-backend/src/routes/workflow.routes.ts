import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  publishWorkflow,
  archiveWorkflow,
} from '../controllers/workflow.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getWorkflows);
router.get('/:id', getWorkflow);
router.post('/', createWorkflow);
router.put('/:id', updateWorkflow);
router.delete('/:id', deleteWorkflow);
router.patch('/:id/publish', publishWorkflow);
router.patch('/:id/archive', archiveWorkflow);

export default router;
