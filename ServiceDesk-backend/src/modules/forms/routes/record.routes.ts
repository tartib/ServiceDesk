/**
 * Record Routes — /api/v2/forms/records
 *
 * Unified record endpoints for the new request flow.
 */

import { Router } from 'express';
import {
  createRecord,
  getRecord,
  listRecords,
  updateRecordStatus,
  assignRecord,
  listDrafts,
  updateDraft,
  deleteDraft,
} from '../controllers/record.controller';

const router = Router();

router.get('/drafts/mine', listDrafts);
router.patch('/drafts/:id', updateDraft);
router.delete('/drafts/:id', deleteDraft);
router.get('/', listRecords);
router.post('/', createRecord);
router.get('/:id', getRecord);
router.patch('/:id/status', updateRecordStatus);
router.patch('/:id/assignee', assignRecord);

export default router;
