/**
 * Portal Record Routes — /api/v2/portal/records
 * Section 2, Batch 5
 *
 * Client-facing record routes behind portal token auth.
 */

import { Router } from 'express';
import { portalAuth } from '../../portal/portal.middleware';
import { portalRecordController } from '../controllers/portal-record.controller';

const router = Router();

// All routes require portal token auth
router.use(portalAuth);

router.get('/', portalRecordController.listMyRecords);
router.get('/:id', portalRecordController.getMyRecord);
router.post('/', portalRecordController.submitRequest);
router.patch('/:id/approve', portalRecordController.approveRecord);

export default router;
