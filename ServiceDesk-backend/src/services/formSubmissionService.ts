/**
 * Form Submission Service - خدمة تقديمات النماذج
 * Smart Forms System
 */

import { FormSubmission, IFormSubmissionDocument } from '../core/entities/FormSubmission';
import { FormTemplate, IFormTemplateDocument } from '../core/entities/FormTemplate';
import { WorkflowEngine } from '../core/engines/WorkflowEngine';
import { ApprovalEngine } from '../core/engines/ApprovalEngine';
import { AutoAssignmentEngine } from '../core/engines/AutoAssignmentEngine';
import { ValidationEngine } from '../core/engines/ValidationEngine';
import {
  IFormSubmission,
  IWorkflowState,
  ITimelineEvent,
  IComment,
  IAttachment,
  SubmissionStatus,
} from '../core/types/smart-forms.types';

// ============================================
// TYPES
// ============================================

export interface CreateSubmissionDTO {
  form_template_id: string;
  data: Record<string, any>;
  attachments?: IAttachment[];
  signature?: {
    data: string;
    ip_address: string;
  };
  geolocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  is_draft?: boolean;
  submitted_by: {
    user_id: string;
    name: string;
    email: string;
    department?: string;
    site_id?: string;
  };
  site_id?: string;
}

export interface UpdateSubmissionDTO {
  data?: Record<string, any>;
  attachments?: IAttachment[];
  updated_by: string;
}

export interface SubmissionListOptions {
  page?: number;
  limit?: number;
  status?: SubmissionStatus;
  form_template_id?: string;
  submitted_by?: string;
  assigned_to?: string;
  site_id?: string;
  from_date?: Date;
  to_date?: Date;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface SubmissionListResult {
  submissions: IFormSubmissionDocument[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// ============================================
// SERVICE
// ============================================

class FormSubmissionService {
  private workflowEngine: WorkflowEngine;
  private approvalEngine: ApprovalEngine;
  private assignmentEngine: AutoAssignmentEngine;
  private validationEngine: ValidationEngine;

  constructor() {
    this.workflowEngine = new WorkflowEngine();
    this.approvalEngine = new ApprovalEngine();
    this.assignmentEngine = new AutoAssignmentEngine();
    this.validationEngine = new ValidationEngine();
  }

  /**
   * البحث عن تقديم بواسطة submission_id أو _id
   */
  private async findSubmission(id: string): Promise<IFormSubmissionDocument | null> {
    let submission = await FormSubmission.findBySubmissionId(id);
    if (!submission) {
      try {
        submission = await FormSubmission.findById(id);
      } catch {
        // Invalid ObjectId format, ignore
      }
    }
    return submission;
  }

  /**
   * إنشاء تقديم جديد
   */
  async createSubmission(dto: CreateSubmissionDTO): Promise<IFormSubmissionDocument> {
    // 1. الحصول على قالب النموذج
    const template = await FormTemplate.findById(dto.form_template_id);
    if (!template) {
      throw new Error('Form template not found');
    }

    // 2. التحقق من صحة البيانات (إذا لم يكن مسودة)
    if (!dto.is_draft) {
      const validationResult = this.validationEngine.validateForm(
        template.fields,
        dto.data,
        { formData: dto.data, user: dto.submitted_by, locale: 'en' }
      );

      if (!validationResult.valid) {
        throw new Error(`Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
      }
    }

    // 3. إنشاء التقديم
    const submission = new FormSubmission({
      form_template_id: template._id,
      form_version: template.version,
      submitted_by: dto.submitted_by,
      data: dto.data,
      attachments: dto.attachments || [],
      signature: dto.signature ? {
        ...dto.signature,
        signed_at: new Date(),
      } : undefined,
      geolocation: dto.geolocation ? {
        ...dto.geolocation,
        captured_at: new Date(),
      } : undefined,
      workflow_state: {
        current_step_id: '',
        status: dto.is_draft ? SubmissionStatus.DRAFT : SubmissionStatus.SUBMITTED,
        approvals: [],
      },
      timeline: [],
      comments: [],
      site_id: dto.site_id || dto.submitted_by.site_id,
    });

    // 4. إضافة حدث الإنشاء للجدول الزمني
    submission.addTimelineEvent(
      dto.is_draft ? 'draft_created' : 'submitted',
      dto.is_draft ? 'Draft created' : 'Form submitted',
      dto.is_draft ? 'تم إنشاء المسودة' : 'تم تقديم النموذج',
      dto.submitted_by.user_id,
      dto.submitted_by.name
    );

    await submission.save();

    // 5. بدء سير العمل (إذا لم يكن مسودة)
    if (!dto.is_draft && template.workflow) {
      await this.startWorkflow(submission, template);
    }

    return submission;
  }

  /**
   * تحديث تقديم
   */
  async updateSubmission(
    submissionId: string,
    dto: UpdateSubmissionDTO
  ): Promise<IFormSubmissionDocument | null> {
    const submission = await this.findSubmission(submissionId);
    if (!submission) {
      throw new Error('Submission not found');
    }

    // التحقق من إمكانية التعديل
    if (![SubmissionStatus.DRAFT, SubmissionStatus.SUBMITTED].includes(submission.workflow_state.status)) {
      throw new Error('Submission cannot be modified in current status');
    }

    // تحديث البيانات
    if (dto.data) {
      submission.data = { ...submission.data, ...dto.data };
    }

    if (dto.attachments) {
      submission.attachments = [...submission.attachments, ...dto.attachments];
    }

    // إضافة حدث للجدول الزمني
    submission.addTimelineEvent(
      'updated',
      'Submission updated',
      'تم تحديث التقديم',
      dto.updated_by
    );

    await submission.save();
    return submission;
  }

  /**
   * تقديم المسودة
   */
  async submitDraft(
    submissionId: string,
    userId: string,
    userName: string
  ): Promise<IFormSubmissionDocument | null> {
    const submission = await this.findSubmission(submissionId);
    if (!submission) {
      throw new Error('Submission not found');
    }

    if (submission.workflow_state.status !== SubmissionStatus.DRAFT) {
      throw new Error('Only drafts can be submitted');
    }

    // الحصول على القالب
    const template = await FormTemplate.findById(submission.form_template_id);
    if (!template) {
      throw new Error('Form template not found');
    }

    // التحقق من صحة البيانات
    const validationResult = this.validationEngine.validateForm(
      template.fields,
      submission.data,
      { formData: submission.data, user: submission.submitted_by, locale: 'en' }
    );

    if (!validationResult.valid) {
      throw new Error(`Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
    }

    // تحديث الحالة
    submission.workflow_state.status = SubmissionStatus.SUBMITTED;

    // إضافة حدث للجدول الزمني
    submission.addTimelineEvent(
      'submitted',
      'Draft submitted',
      'تم تقديم المسودة',
      userId,
      userName
    );

    await submission.save();

    // بدء سير العمل
    if (template.workflow) {
      await this.startWorkflow(submission, template);
    }

    return submission;
  }

  /**
   * بدء سير العمل
   */
  private async startWorkflow(
    submission: IFormSubmissionDocument,
    template: IFormTemplateDocument
  ): Promise<void> {
    if (!template.workflow) return;

    // بدء سير العمل
    const workflowState = await this.workflowEngine.startWorkflow(
      submission.toObject() as IFormSubmission,
      template.workflow
    );

    submission.workflow_state = workflowState;

    // بدء الموافقات إذا كانت مطلوبة
    if (template.approval) {
      const approvals = await this.approvalEngine.initializeApproval(
        submission.toObject() as IFormSubmission,
        template.approval
      );
      submission.workflow_state.approvals = approvals;

      if (approvals.length > 0) {
        submission.workflow_state.status = SubmissionStatus.PENDING_APPROVAL;
      }
    }

    // التعيين التلقائي
    if (template.assignment_rules && template.assignment_rules.length > 0) {
      const assignmentResult = await this.assignmentEngine.assignSubmission(
        submission.toObject() as IFormSubmission,
        template.assignment_rules
      );

      if (assignmentResult.success && assignmentResult.assignee) {
        submission.workflow_state.assigned_to = assignmentResult.assignee;
      }
    }

    await submission.save();
  }

  /**
   * تنفيذ إجراء في سير العمل
   */
  async executeWorkflowAction(
    submissionId: string,
    actionId: string,
    userId: string,
    userName: string,
    comments?: string,
    signature?: string
  ): Promise<IFormSubmissionDocument | null> {
    const submission = await this.findSubmission(submissionId);
    if (!submission) {
      throw new Error('Submission not found');
    }

    const template = await FormTemplate.findById(submission.form_template_id);
    if (!template || !template.workflow) {
      throw new Error('Workflow not found');
    }

    const currentStep = this.workflowEngine.getCurrentStep(
      template.workflow,
      submission.toObject() as IFormSubmission
    );

    if (!currentStep) {
      throw new Error('Current workflow step not found');
    }

    // تنفيذ الإجراء
    const result = await this.workflowEngine.executeAction(
      {
        submission: submission.toObject() as IFormSubmission,
        workflow: template.workflow,
        currentStep,
        userId,
        userName,
        comments,
        signature,
      },
      actionId
    );

    if (!result.success) {
      throw new Error(result.error || 'Action execution failed');
    }

    // تحديث التقديم
    submission.workflow_state.current_step_id = result.newStep.step_id;
    submission.workflow_state.status = result.newStatus;
    if (result.assignedTo) {
      submission.workflow_state.assigned_to = result.assignedTo;
    }

    // إضافة حدث للجدول الزمني
    submission.addTimelineEvent(
      'workflow_action',
      `Action "${actionId}" executed`,
      `تم تنفيذ الإجراء "${actionId}"`,
      userId,
      userName,
      { action_id: actionId, comments }
    );

    // تحديث تاريخ الإكمال إذا اكتمل
    if (result.newStatus === SubmissionStatus.COMPLETED) {
      submission.completed_at = new Date();
    } else if (result.newStatus === SubmissionStatus.CANCELLED) {
      submission.cancelled_at = new Date();
    }

    await submission.save();
    return submission;
  }

  /**
   * الموافقة على التقديم
   */
  async approveSubmission(
    submissionId: string,
    approverId: string,
    approverName: string,
    comments?: string
  ): Promise<IFormSubmissionDocument | null> {
    const submission = await this.findSubmission(submissionId);
    if (!submission) {
      throw new Error('Submission not found');
    }

    const template = await FormTemplate.findById(submission.form_template_id);

    if (template?.approval) {
      // معالجة الموافقة عبر محرك الموافقات
      const result = await this.approvalEngine.processApproval({
        submission: submission.toObject() as IFormSubmission,
        approvalConfig: template.approval,
        approverId,
        approverName,
        decision: 'approve',
        comments,
      });

      if (!result.success) {
        throw new Error(result.error || 'Approval failed');
      }

      submission.workflow_state.approvals = (submission.toObject() as IFormSubmission).workflow_state.approvals;

      if (result.isFullyApproved) {
        submission.workflow_state.status = SubmissionStatus.APPROVED;
      }
    } else {
      // موافقة بسيطة بدون محرك موافقات
      submission.workflow_state.status = SubmissionStatus.APPROVED;
    }

    submission.addTimelineEvent(
      'approved',
      `Approved by ${approverName}`,
      `تمت الموافقة بواسطة ${approverName}`,
      approverId,
      approverName,
      { comments }
    );

    await submission.save();
    return submission;
  }

  /**
   * رفض التقديم
   */
  async rejectSubmission(
    submissionId: string,
    approverId: string,
    approverName: string,
    comments: string
  ): Promise<IFormSubmissionDocument | null> {
    const submission = await this.findSubmission(submissionId);
    if (!submission) {
      throw new Error('Submission not found');
    }

    const template = await FormTemplate.findById(submission.form_template_id);

    if (template?.approval) {
      // معالجة الرفض عبر محرك الموافقات
      const result = await this.approvalEngine.processApproval({
        submission: submission.toObject() as IFormSubmission,
        approvalConfig: template.approval,
        approverId,
        approverName,
        decision: 'reject',
        comments,
      });

      if (!result.success) {
        throw new Error(result.error || 'Rejection failed');
      }

      submission.workflow_state.approvals = (submission.toObject() as IFormSubmission).workflow_state.approvals;
    }

    // تحديث الحالة
    submission.workflow_state.status = SubmissionStatus.REJECTED;

    // إضافة حدث للجدول الزمني
    submission.addTimelineEvent(
      'rejected',
      `Rejected by ${approverName}`,
      `تم الرفض بواسطة ${approverName}`,
      approverId,
      approverName,
      { comments }
    );

    await submission.save();
    return submission;
  }

  /**
   * إضافة تعليق
   */
  async addComment(
    submissionId: string,
    content: string,
    userId: string,
    userName: string,
    isInternal: boolean = false,
    attachments?: IAttachment[]
  ): Promise<IFormSubmissionDocument | null> {
    const submission = await this.findSubmission(submissionId);
    if (!submission) {
      throw new Error('Submission not found');
    }

    submission.addComment(content, userId, userName, isInternal, attachments);
    await submission.save();
    return submission;
  }

  /**
   * الحصول على تقديم بواسطة المعرف
   */
  async getSubmissionById(submissionId: string): Promise<IFormSubmissionDocument | null> {
    return this.findSubmission(submissionId);
  }

  /**
   * قائمة التقديمات
   */
  async listSubmissions(options: SubmissionListOptions = {}): Promise<SubmissionListResult> {
    const {
      page = 1,
      limit = 20,
      status,
      form_template_id,
      submitted_by,
      assigned_to,
      site_id,
      from_date,
      to_date,
      search,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = options;

    const query: any = {};

    if (status) {
      query['workflow_state.status'] = status;
    }

    if (form_template_id) {
      query.form_template_id = form_template_id;
    }

    if (submitted_by) {
      query['submitted_by.user_id'] = submitted_by;
    }

    if (assigned_to) {
      query['workflow_state.assigned_to.user_id'] = assigned_to;
    }

    if (site_id) {
      query.site_id = site_id;
    }

    if (from_date || to_date) {
      query.created_at = {};
      if (from_date) query.created_at.$gte = from_date;
      if (to_date) query.created_at.$lte = to_date;
    }

    if (search) {
      query.$or = [
        { submission_id: { $regex: search, $options: 'i' } },
        { 'submitted_by.name': { $regex: search, $options: 'i' } },
        { 'submitted_by.email': { $regex: search, $options: 'i' } },
      ];
    }

    const total = await FormSubmission.countDocuments(query);
    const total_pages = Math.ceil(total / limit);

    const submissions = await FormSubmission.find(query)
      .sort({ [sort_by]: sort_order === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('form_template_id', 'name name_ar category');

    return {
      submissions,
      total,
      page,
      limit,
      total_pages,
    };
  }

  /**
   * الحصول على التقديمات المعلقة للموافقة
   */
  async getPendingApprovals(userId: string): Promise<IFormSubmissionDocument[]> {
    return FormSubmission.find({
      'workflow_state.status': SubmissionStatus.PENDING_APPROVAL,
      'workflow_state.approvals': {
        $elemMatch: {
          approver_id: userId,
          status: 'pending',
        },
      },
    }).populate('form_template_id', 'name name_ar category');
  }

  /**
   * الحصول على تقديمات المستخدم
   */
  async getMySubmissions(userId: string): Promise<IFormSubmissionDocument[]> {
    return FormSubmission.find({
      'submitted_by.user_id': userId,
    })
      .sort({ created_at: -1 })
      .populate('form_template_id', 'name name_ar category');
  }

  /**
   * الحصول على التقديمات المعينة للمستخدم
   */
  async getAssignedSubmissions(userId: string): Promise<IFormSubmissionDocument[]> {
    return FormSubmission.find({
      'workflow_state.assigned_to.user_id': userId,
      'workflow_state.status': { $nin: [SubmissionStatus.COMPLETED, SubmissionStatus.CANCELLED, SubmissionStatus.REJECTED] },
    })
      .sort({ created_at: -1 })
      .populate('form_template_id', 'name name_ar category');
  }

  /**
   * إلغاء التقديم
   */
  async cancelSubmission(
    submissionId: string,
    userId: string,
    userName: string,
    reason: string
  ): Promise<IFormSubmissionDocument | null> {
    const submission = await this.findSubmission(submissionId);
    if (!submission) {
      throw new Error('Submission not found');
    }

    // التحقق من إمكانية الإلغاء
    const cancelableStatuses = [SubmissionStatus.DRAFT, SubmissionStatus.SUBMITTED, SubmissionStatus.PENDING_APPROVAL];
    if (!cancelableStatuses.includes(submission.workflow_state.status)) {
      throw new Error('Submission cannot be cancelled in current status');
    }

    submission.workflow_state.status = SubmissionStatus.CANCELLED;
    submission.cancelled_at = new Date();

    submission.addTimelineEvent(
      'cancelled',
      `Cancelled: ${reason}`,
      `تم الإلغاء: ${reason}`,
      userId,
      userName,
      { reason }
    );

    await submission.save();
    return submission;
  }

  /**
   * حذف تقديم (للمسودات فقط)
   */
  async deleteSubmission(submissionId: string): Promise<boolean> {
    const submission = await this.findSubmission(submissionId);
    if (!submission) {
      throw new Error('Submission not found');
    }

    if (submission.workflow_state.status !== SubmissionStatus.DRAFT) {
      throw new Error('Only drafts can be deleted');
    }

    await FormSubmission.deleteOne({ _id: submission._id });
    return true;
  }

  /**
   * الحصول على إحصائيات التقديمات
   */
  async getSubmissionStats(
    formTemplateId?: string,
    siteId?: string,
    fromDate?: Date,
    toDate?: Date
  ): Promise<{
    total: number;
    by_status: Record<string, number>;
    avg_completion_time_hours: number;
  }> {
    const match: any = {};

    if (formTemplateId) match.form_template_id = formTemplateId;
    if (siteId) match.site_id = siteId;
    if (fromDate || toDate) {
      match.created_at = {};
      if (fromDate) match.created_at.$gte = fromDate;
      if (toDate) match.created_at.$lte = toDate;
    }

    const stats = await FormSubmission.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$workflow_state.status',
          count: { $sum: 1 },
        },
      },
    ]);

    const by_status: Record<string, number> = {};
    let total = 0;
    stats.forEach(s => {
      by_status[s._id] = s.count;
      total += s.count;
    });

    // حساب متوسط وقت الإكمال
    const completedSubmissions = await FormSubmission.find({
      ...match,
      'workflow_state.status': SubmissionStatus.COMPLETED,
      completed_at: { $exists: true },
    }).select('created_at completed_at');

    let avgCompletionTime = 0;
    if (completedSubmissions.length > 0) {
      const totalTime = completedSubmissions.reduce((sum, s) => {
        const completionTime = new Date(s.completed_at!).getTime() - new Date(s.created_at).getTime();
        return sum + completionTime;
      }, 0);
      avgCompletionTime = totalTime / completedSubmissions.length / (1000 * 60 * 60); // hours
    }

    return {
      total,
      by_status,
      avg_completion_time_hours: Math.round(avgCompletionTime * 100) / 100,
    };
  }
}

export const formSubmissionService = new FormSubmissionService();
export default formSubmissionService;
