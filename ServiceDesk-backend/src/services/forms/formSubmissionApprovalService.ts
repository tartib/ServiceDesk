/**
 * Form Submission Approval Service
 * Handles approval workflows and approver management
 */

import { FormSubmission, IFormSubmissionDocument } from '../../core/entities/FormSubmission';
import { FormTemplate, IFormTemplateDocument } from '../../core/entities/FormTemplate';
import { ApprovalEngine } from '../../core/engines/ApprovalEngine';
import { IFormSubmission, SubmissionStatus, IApprovalRecord } from '../../core/types/smart-forms.types';

export class FormSubmissionApprovalService {
  private approvalEngine: ApprovalEngine;

  constructor() {
    this.approvalEngine = new ApprovalEngine();
  }

  /**
   * Initialize approval workflow
   */
  async initializeApproval(
    submission: IFormSubmissionDocument,
    template: IFormTemplateDocument
  ): Promise<void> {
    if (!template.approval) return;

    const approvals = await this.approvalEngine.initializeApproval(
      submission.toObject() as IFormSubmission,
      template.approval
    );

    submission.workflow_state.approvals = approvals;

    if (approvals.length > 0) {
      submission.workflow_state.status = SubmissionStatus.PENDING_APPROVAL;
    }

    await submission.save();
  }

  /**
   * Approve a submission
   */
  async approveSubmission(
    submissionId: string,
    approverId: string,
    approverName: string,
    comments?: string
  ): Promise<IFormSubmissionDocument | null> {
    const submission = await FormSubmission.findBySubmissionId(submissionId);
    if (!submission) {
      throw new Error('Submission not found');
    }

    const template = await FormTemplate.findById(submission.form_template_id);
    if (!template || !template.approval) {
      throw new Error('Approval configuration not found');
    }

    // Process approval
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

    // Update submission
    if (result.approvals) {
      submission.workflow_state.approvals = result.approvals;
    }
    if (result.newStatus) {
      submission.workflow_state.status = result.newStatus as SubmissionStatus;
    }

    // Add timeline event
    submission.addTimelineEvent(
      'approved',
      'Submission approved',
      'تم الموافقة على التقديم',
      approverId,
      approverName,
      { comments }
    );

    if (result.newStatus === SubmissionStatus.COMPLETED) {
      submission.completed_at = new Date();
    }

    await submission.save();
    return submission;
  }

  /**
   * Reject a submission
   */
  async rejectSubmission(
    submissionId: string,
    approverId: string,
    approverName: string,
    reason: string,
    comments?: string
  ): Promise<IFormSubmissionDocument | null> {
    const submission = await FormSubmission.findBySubmissionId(submissionId);
    if (!submission) {
      throw new Error('Submission not found');
    }

    const template = await FormTemplate.findById(submission.form_template_id);
    if (!template || !template.approval) {
      throw new Error('Approval configuration not found');
    }

    // Process rejection
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

    // Update submission
    if (result.approvals) {
      submission.workflow_state.approvals = result.approvals;
    }
    submission.workflow_state.status = SubmissionStatus.REJECTED;

    // Add timeline event
    submission.addTimelineEvent(
      'rejected',
      'Submission rejected',
      'تم رفض التقديم',
      approverId,
      approverName,
      { reason, comments }
    );

    submission.rejected_at = new Date();
    submission.rejection_reason = reason;

    await submission.save();
    return submission;
  }

  /**
   * Get pending approvals for a submission
   */
  async getPendingApprovals(submissionId: string): Promise<IApprovalRecord[]> {
    const submission = await FormSubmission.findBySubmissionId(submissionId);
    if (!submission) {
      throw new Error('Submission not found');
    }

    return submission.workflow_state.approvals.filter((a: IApprovalRecord) => a.status === 'pending');
  }

  /**
   * Get approval history
   */
  async getApprovalHistory(submissionId: string): Promise<IApprovalRecord[]> {
    const submission = await FormSubmission.findBySubmissionId(submissionId);
    if (!submission) {
      throw new Error('Submission not found');
    }

    return submission.workflow_state.approvals;
  }

  /**
   * Check if submission needs approval
   */
  async needsApproval(submissionId: string): Promise<boolean> {
    const submission = await FormSubmission.findBySubmissionId(submissionId);
    if (!submission) {
      throw new Error('Submission not found');
    }

    return submission.workflow_state.status === SubmissionStatus.PENDING_APPROVAL;
  }
}

export default new FormSubmissionApprovalService();
