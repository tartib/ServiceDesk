/**
 * Form Submission Routes - مسارات تقديمات النماذج
 * Smart Forms System
 */

import { Router } from 'express';
import {
  createSubmission,
  listSubmissions,
  getSubmission,
  updateSubmission,
  submitDraft,
  executeWorkflowAction,
  approveSubmission,
  rejectSubmission,
  addComment,
  cancelSubmission,
  deleteSubmission,
  getPendingApprovals,
  getMySubmissions,
  getAssignedSubmissions,
  getSubmissionStats,
} from '../controllers/formSubmissionController';

const router = Router();

// ============================================
// USER-SPECIFIC ROUTES - مسارات خاصة بالمستخدم
// ============================================

/**
 * @route   GET /api/v2/forms/submissions/pending-approval
 * @desc    الحصول على التقديمات المعلقة للموافقة
 * @access  Authenticated
 */
router.get('/pending-approval', getPendingApprovals);

/**
 * @route   GET /api/v2/forms/submissions/my
 * @desc    الحصول على تقديماتي
 * @access  Authenticated
 */
router.get('/my', getMySubmissions);

/**
 * @route   GET /api/v2/forms/submissions/assigned
 * @desc    الحصول على التقديمات المعينة لي
 * @access  Authenticated
 */
router.get('/assigned', getAssignedSubmissions);

/**
 * @route   GET /api/v2/forms/submissions/stats
 * @desc    الحصول على إحصائيات التقديمات
 * @access  Admin/Manager
 */
router.get('/stats', getSubmissionStats);

// ============================================
// SUBMISSION CRUD ROUTES - مسارات CRUD للتقديمات
// ============================================

/**
 * @route   POST /api/v2/forms/submissions
 * @desc    إنشاء تقديم جديد
 * @access  Authenticated
 */
router.post('/', createSubmission);

/**
 * @route   GET /api/v2/forms/submissions
 * @desc    الحصول على قائمة التقديمات
 * @access  Admin/Manager
 */
router.get('/', listSubmissions);

/**
 * @route   GET /api/v2/forms/submissions/:id
 * @desc    الحصول على تقديم بواسطة المعرف
 * @access  Authenticated (owner or assigned)
 */
router.get('/:id', getSubmission);

/**
 * @route   PATCH /api/v2/forms/submissions/:id
 * @desc    تحديث تقديم
 * @access  Authenticated (owner)
 */
router.patch('/:id', updateSubmission);

/**
 * @route   DELETE /api/v2/forms/submissions/:id
 * @desc    حذف تقديم (للمسودات فقط)
 * @access  Authenticated (owner)
 */
router.delete('/:id', deleteSubmission);

// ============================================
// SUBMISSION ACTIONS - إجراءات التقديم
// ============================================

/**
 * @route   POST /api/v2/forms/submissions/:id/submit
 * @desc    تقديم المسودة
 * @access  Authenticated (owner)
 */
router.post('/:id/submit', submitDraft);

/**
 * @route   POST /api/v2/forms/submissions/:id/workflow/action
 * @desc    تنفيذ إجراء في سير العمل
 * @access  Authenticated (assigned)
 */
router.post('/:id/workflow/action', executeWorkflowAction);

/**
 * @route   POST /api/v2/forms/submissions/:id/approve
 * @desc    الموافقة على التقديم
 * @access  Authenticated (approver)
 */
router.post('/:id/approve', approveSubmission);

/**
 * @route   POST /api/v2/forms/submissions/:id/reject
 * @desc    رفض التقديم
 * @access  Authenticated (approver)
 */
router.post('/:id/reject', rejectSubmission);

/**
 * @route   POST /api/v2/forms/submissions/:id/cancel
 * @desc    إلغاء التقديم
 * @access  Authenticated (owner or admin)
 */
router.post('/:id/cancel', cancelSubmission);

// ============================================
// COMMENTS - التعليقات
// ============================================

/**
 * @route   POST /api/v2/forms/submissions/:id/comments
 * @desc    إضافة تعليق
 * @access  Authenticated
 */
router.post('/:id/comments', addComment);

export default router;
