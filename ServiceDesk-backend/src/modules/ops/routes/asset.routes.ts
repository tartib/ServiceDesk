/**
 * Ops Module — Asset Routes
 */

import { Router } from 'express';
import { assetController } from '../controllers/asset.controller';

const router = Router();

router.post('/', assetController.create);
router.get('/', assetController.getAll);
router.get('/stats', assetController.getStats);
router.get('/user/:userId', assetController.getByUser);
router.get('/:id', assetController.getById);
router.put('/:id', assetController.update);
router.delete('/:id', assetController.delete);
router.post('/:id/assign', assetController.assign);
router.post('/:id/unassign', assetController.unassign);
router.post('/:id/status', assetController.changeStatus);
router.post('/:id/link-incident', assetController.linkIncident);

export default router;
