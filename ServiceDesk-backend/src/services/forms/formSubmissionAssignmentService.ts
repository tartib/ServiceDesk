/**
 * Form Submission Assignment Service
 * Handles automatic and manual assignment of submissions
 */

import { FormSubmission, IFormSubmissionDocument } from '../../core/entities/FormSubmission';
import { IFormTemplateDocument } from '../../core/entities/FormTemplate';
import { AutoAssignmentEngine } from '../../core/engines/AutoAssignmentEngine';
import { IFormSubmission, ITimelineEvent } from '../../core/types/smart-forms.types';

export class FormSubmissionAssignmentService {
  private assignmentEngine: AutoAssignmentEngine;

  constructor() {
    this.assignmentEngine = new AutoAssignmentEngine();
  }

  /**
   * Auto-assign a submission based on rules
   */
  async autoAssignSubmission(
    submission: IFormSubmissionDocument,
    template: IFormTemplateDocument
  ): Promise<void> {
    if (!template.assignment_rules || template.assignment_rules.length === 0) {
      return;
    }

    const assignmentResult = await this.assignmentEngine.assignSubmission(
      submission.toObject() as IFormSubmission,
      template.assignment_rules
    );

    if (assignmentResult.success && assignmentResult.assignee) {
      submission.workflow_state.assigned_to = assignmentResult.assignee;
      await submission.save();
    }
  }

  /**
   * Manually assign a submission to a user
   */
  async assignToUser(
    submissionId: string,
    assigneeId: string,
    assigneeName: string,
    assignedBy: string,
    assignedByName: string,
    notes?: string
  ): Promise<IFormSubmissionDocument | null> {
    const submission = await FormSubmission.findBySubmissionId(submissionId);
    if (!submission) {
      throw new Error('Submission not found');
    }

    const previousAssignee = submission.workflow_state.assigned_to;

    // Update assignment
    submission.workflow_state.assigned_to = {
      user_id: assigneeId,
      name: assigneeName,
      assigned_at: new Date(),
      assigned_by: assignedBy,
    };

    // Add timeline event
    submission.addTimelineEvent(
      'assigned',
      `Assigned to ${assigneeName}`,
      `تم التعيين إلى ${assigneeName}`,
      assignedBy,
      assignedByName,
      {
        previous_assignee: previousAssignee,
        new_assignee: assigneeId,
        notes,
      }
    );

    await submission.save();
    return submission;
  }

  /**
   * Unassign a submission
   */
  async unassign(
    submissionId: string,
    unassignedBy: string,
    unassignedByName: string,
    reason?: string
  ): Promise<IFormSubmissionDocument | null> {
    const submission = await FormSubmission.findBySubmissionId(submissionId);
    if (!submission) {
      throw new Error('Submission not found');
    }

    const previousAssignee = submission.workflow_state.assigned_to;

    // Clear assignment
    submission.workflow_state.assigned_to = undefined;

    // Add timeline event
    submission.addTimelineEvent(
      'unassigned',
      'Unassigned',
      'تم إلغاء التعيين',
      unassignedBy,
      unassignedByName,
      {
        previous_assignee: previousAssignee,
        reason,
      }
    );

    await submission.save();
    return submission;
  }

  /**
   * Reassign to another user
   */
  async reassign(
    submissionId: string,
    newAssigneeId: string,
    newAssigneeName: string,
    reassignedBy: string,
    reassignedByName: string,
    reason?: string
  ): Promise<IFormSubmissionDocument | null> {
    const submission = await FormSubmission.findBySubmissionId(submissionId);
    if (!submission) {
      throw new Error('Submission not found');
    }

    const previousAssignee = submission.workflow_state.assigned_to;

    // Update assignment
    submission.workflow_state.assigned_to = {
      user_id: newAssigneeId,
      name: newAssigneeName,
      assigned_at: new Date(),
      assigned_by: reassignedBy,
    };

    // Add timeline event
    submission.addTimelineEvent(
      'reassigned',
      `Reassigned to ${newAssigneeName}`,
      `تم إعادة التعيين إلى ${newAssigneeName}`,
      reassignedBy,
      reassignedByName,
      {
        previous_assignee: previousAssignee,
        new_assignee: newAssigneeId,
        reason,
      }
    );

    await submission.save();
    return submission;
  }

  /**
   * Get current assignee
   */
  async getCurrentAssignee(submissionId: string): Promise<string | undefined> {
    const submission = await FormSubmission.findBySubmissionId(submissionId);
    if (!submission) {
      throw new Error('Submission not found');
    }

    return submission.workflow_state.assigned_to?.user_id;
  }

  /**
   * Get assignment history
   */
  async getAssignmentHistory(submissionId: string): Promise<ITimelineEvent[]> {
    const submission = await FormSubmission.findBySubmissionId(submissionId);
    if (!submission) {
      throw new Error('Submission not found');
    }

    return submission.timeline.filter((event: ITimelineEvent) =>
      ['assigned', 'unassigned', 'reassigned'].includes(event.type)
    );
  }
}

export default new FormSubmissionAssignmentService();
