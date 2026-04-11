/**
 * Forms Module — Submission Routes
 */

import { Router } from 'express';
import * as submissionCtrl from '../controllers/formSubmission.controller';

const router = Router();

// User-specific
router.get('/pending-approval', submissionCtrl.getPendingApprovals);
router.get('/my', submissionCtrl.getMySubmissions);
router.get('/assigned', submissionCtrl.getAssignedSubmissions);
router.get('/stats', submissionCtrl.getSubmissionStats);

// CRUD
router.post('/', submissionCtrl.createSubmission);
router.get('/', submissionCtrl.listSubmissions);
router.get('/:id', submissionCtrl.getSubmission);
router.patch('/:id', submissionCtrl.updateSubmission);
router.delete('/:id', submissionCtrl.deleteSubmission);

// Actions
router.post('/:id/submit', submissionCtrl.submitDraft);
router.post('/:id/workflow/action', submissionCtrl.executeWorkflowAction);
router.post('/:id/approve', submissionCtrl.approveSubmission);
router.post('/:id/reject', submissionCtrl.rejectSubmission);
router.post('/:id/cancel', submissionCtrl.cancelSubmission);

// Comments
router.post('/:id/comments', submissionCtrl.addComment);

export default router;
