import { Router } from 'express';
import * as ctrl from '../controllers/segment.controller';

const router = Router();

router.get('/', ctrl.listSegments);
router.get('/:id', ctrl.getSegment);
router.post('/', ctrl.createSegment);
router.patch('/:id', ctrl.updateSegment);
router.delete('/:id', ctrl.deleteSegment);
router.get('/:id/preview', ctrl.previewSegment);
router.post('/preview-rules', ctrl.previewRules);

export default router;
