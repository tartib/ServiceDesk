import { Router } from 'express';
import deflectionController from '../controllers/knowledgeDeflection.controller';
import { authorize } from '../../../middleware/auth';

const router = Router();

// Stats requires manager/supervisor
router.get('/stats', authorize('supervisor', 'manager'), deflectionController.getStats);

// Suggestion is open to all authenticated users
router.post('/', deflectionController.suggest);
router.post('/:articleId/helpful', deflectionController.markHelpful);
router.post('/:articleId/not-helpful', deflectionController.markNotHelpful);

export default router;
