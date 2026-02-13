/**
 * Form Submission Controller - متحكم تقديمات النماذج
 * Smart Forms System
 */

import { Request, Response } from 'express';
import formSubmissionService from '../services/formSubmissionService';
import { SubmissionStatus } from '../core/types/smart-forms.types';

type AuthUser = {
  id?: string;
  name?: string;
  email?: string;
  department?: string;
  site_id?: string;
};

/**
 * إنشاء تقديم جديد
 * POST /api/v2/forms/submissions
 */
export const createSubmission = async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUser | undefined;
    const { form_template_id, data, attachments, signature, geolocation, is_draft } = req.body;

    const submission = await formSubmissionService.createSubmission({
      form_template_id,
      data,
      attachments,
      signature,
      geolocation,
      is_draft,
      submitted_by: {
        user_id: user?.id || 'anonymous',
        name: user?.name || 'Anonymous',
        email: user?.email || '',
        department: user?.department,
        site_id: user?.site_id,
      },
      site_id: user?.site_id,
    });

    res.status(201).json({
      success: true,
      data: submission,
      message: is_draft ? 'Draft saved successfully' : 'Submission created successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * الحصول على قائمة التقديمات
 * GET /api/v2/forms/submissions
 */
export const listSubmissions = async (req: Request, res: Response) => {
  try {
    const {
      page,
      limit,
      status,
      form_template_id,
      submitted_by,
      assigned_to,
      from_date,
      to_date,
      search,
      sort_by,
      sort_order,
    } = req.query;

    const user = req.user as AuthUser | undefined;

    const result = await formSubmissionService.listSubmissions({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      status: status as SubmissionStatus,
      form_template_id: form_template_id as string,
      submitted_by: submitted_by as string,
      assigned_to: assigned_to as string,
      site_id: user?.site_id,
      from_date: from_date ? new Date(from_date as string) : undefined,
      to_date: to_date ? new Date(to_date as string) : undefined,
      search: search as string,
      sort_by: sort_by as string,
      sort_order: sort_order as 'asc' | 'desc',
    });

    res.json({
      success: true,
      data: result.submissions,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.total_pages,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * الحصول على تقديم بواسطة المعرف
 * GET /api/v2/forms/submissions/:id
 */
export const getSubmission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const submission = await formSubmissionService.getSubmissionById(id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found',
      });
    }

    res.json({
      success: true,
      data: submission,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * تحديث تقديم
 * PATCH /api/v2/forms/submissions/:id
 */
export const updateSubmission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as AuthUser | undefined;
    const { data, attachments } = req.body;

    const submission = await formSubmissionService.updateSubmission(id, {
      data,
      attachments,
      updated_by: user?.id || 'system',
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found',
      });
    }

    res.json({
      success: true,
      data: submission,
      message: 'Submission updated successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * تقديم المسودة
 * POST /api/v2/forms/submissions/:id/submit
 */
export const submitDraft = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as AuthUser | undefined;

    const submission = await formSubmissionService.submitDraft(
      id,
      user?.id || 'system',
      user?.name || 'System'
    );

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found',
      });
    }

    res.json({
      success: true,
      data: submission,
      message: 'Draft submitted successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * تنفيذ إجراء في سير العمل
 * POST /api/v2/forms/submissions/:id/workflow/action
 */
export const executeWorkflowAction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action_id, comments, signature } = req.body;
    const user = req.user as AuthUser | undefined;

    if (!action_id) {
      return res.status(400).json({
        success: false,
        error: 'action_id is required',
      });
    }

    const submission = await formSubmissionService.executeWorkflowAction(
      id,
      action_id,
      user?.id || 'system',
      user?.name || 'System',
      comments,
      signature
    );

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found',
      });
    }

    res.json({
      success: true,
      data: submission,
      message: 'Action executed successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * الموافقة على التقديم
 * POST /api/v2/forms/submissions/:id/approve
 */
export const approveSubmission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const user = req.user as AuthUser | undefined;

    const submission = await formSubmissionService.approveSubmission(
      id,
      user?.id || 'system',
      user?.name || 'System',
      comments
    );

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found',
      });
    }

    res.json({
      success: true,
      data: submission,
      message: 'Submission approved successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * رفض التقديم
 * POST /api/v2/forms/submissions/:id/reject
 */
export const rejectSubmission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const user = req.user as AuthUser | undefined;

    if (!comments) {
      return res.status(400).json({
        success: false,
        error: 'Comments are required for rejection',
      });
    }

    const submission = await formSubmissionService.rejectSubmission(
      id,
      user?.id || 'system',
      user?.name || 'System',
      comments
    );

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found',
      });
    }

    res.json({
      success: true,
      data: submission,
      message: 'Submission rejected',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * إضافة تعليق
 * POST /api/v2/forms/submissions/:id/comments
 */
export const addComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content, is_internal, attachments } = req.body;
    const user = req.user as AuthUser | undefined;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Comment content is required',
      });
    }

    const submission = await formSubmissionService.addComment(
      id,
      content,
      user?.id || 'system',
      user?.name || 'System',
      is_internal || false,
      attachments
    );

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found',
      });
    }

    res.json({
      success: true,
      data: submission,
      message: 'Comment added successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * إلغاء التقديم
 * POST /api/v2/forms/submissions/:id/cancel
 */
export const cancelSubmission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const user = req.user as AuthUser | undefined;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Cancellation reason is required',
      });
    }

    const submission = await formSubmissionService.cancelSubmission(
      id,
      user?.id || 'system',
      user?.name || 'System',
      reason
    );

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found',
      });
    }

    res.json({
      success: true,
      data: submission,
      message: 'Submission cancelled',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * حذف تقديم (للمسودات فقط)
 * DELETE /api/v2/forms/submissions/:id
 */
export const deleteSubmission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await formSubmissionService.deleteSubmission(id);

    res.json({
      success: true,
      message: 'Submission deleted successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * الحصول على التقديمات المعلقة للموافقة
 * GET /api/v2/forms/submissions/pending-approval
 */
export const getPendingApprovals = async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUser | undefined;

    const submissions = await formSubmissionService.getPendingApprovals(user?.id || 'system');

    res.json({
      success: true,
      data: submissions,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * الحصول على تقديماتي
 * GET /api/v2/forms/submissions/my
 */
export const getMySubmissions = async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUser | undefined;

    const submissions = await formSubmissionService.getMySubmissions(user?.id || 'system');

    res.json({
      success: true,
      data: submissions,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * الحصول على التقديمات المعينة لي
 * GET /api/v2/forms/submissions/assigned
 */
export const getAssignedSubmissions = async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUser | undefined;

    const submissions = await formSubmissionService.getAssignedSubmissions(user?.id || 'system');

    res.json({
      success: true,
      data: submissions,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * الحصول على إحصائيات التقديمات
 * GET /api/v2/forms/submissions/stats
 */
export const getSubmissionStats = async (req: Request, res: Response) => {
  try {
    const { form_template_id, from_date, to_date } = req.query;
    const user = req.user as AuthUser | undefined;

    const stats = await formSubmissionService.getSubmissionStats(
      form_template_id as string,
      user?.site_id,
      from_date ? new Date(from_date as string) : undefined,
      to_date ? new Date(to_date as string) : undefined
    );

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export default {
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
};
