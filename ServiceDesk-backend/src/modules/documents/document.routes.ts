/**
 * Document Routes — /api/v2/documents
 */

import { Router } from 'express';
import { documentController } from './document.controller';

const router = Router();

router.post('/templates', documentController.createTemplate);
router.get('/templates', documentController.listTemplates);
router.get('/templates/:templateId', documentController.getTemplate);
router.patch('/templates/:templateId', documentController.updateTemplate);
router.delete('/templates/:templateId', documentController.deleteTemplate);

router.post('/generate', documentController.generateDocument);
router.get('/', documentController.listDocuments);
router.get('/:documentId', documentController.getDocument);

export default router;
