import { Router } from 'express';
import * as ctrl from '../controllers/template.controller';

const router = Router();

router.get('/', ctrl.listTemplates);
router.get('/:id', ctrl.getTemplate);
router.post('/', ctrl.createTemplate);
router.patch('/:id', ctrl.updateTemplate);
router.delete('/:id', ctrl.deleteTemplate);
router.post('/:id/preview', ctrl.previewTemplateEndpoint);

export default router;
