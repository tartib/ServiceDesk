import { Router } from 'express';
import { authenticate } from '../../../middleware/auth';
import * as knowledgeCtrl from '../controllers/knowledge.controller';

const router = Router();

router.use(authenticate);

router.get('/search', knowledgeCtrl.searchArticles);
router.get('/featured', knowledgeCtrl.getFeaturedArticles);
router.get('/popular', knowledgeCtrl.getPopularArticles);
router.get('/stats', knowledgeCtrl.getKnowledgeStats);
router.get('/', knowledgeCtrl.getArticles);
router.get('/:id', knowledgeCtrl.getArticleById);
router.post('/', knowledgeCtrl.createArticle);
router.put('/:id', knowledgeCtrl.updateArticle);
router.delete('/:id', knowledgeCtrl.deleteArticle);
router.post('/:id/publish', knowledgeCtrl.publishArticle);
router.post('/:id/archive', knowledgeCtrl.archiveArticle);
router.post('/:id/feedback', knowledgeCtrl.submitFeedback);
router.post('/:id/link-incident', knowledgeCtrl.linkIncident);

export default router;
