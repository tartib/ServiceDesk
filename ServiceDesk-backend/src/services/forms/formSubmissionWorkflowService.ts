/**
 * Form Submission Workflow Service
 * Handles workflow transitions and state management
 */

import { FormSubmission, IFormSubmissionDocument } from '../../core/entities/FormSubmission';
import { FormTemplate, IFormTemplateDocument } from '../../core/entities/FormTemplate';
import { WorkflowEngine } from '../../core/engines/WorkflowEngine';
import { IFormSubmission, SubmissionStatus, IWorkflowAction, IWorkflowState } from '../../core/types/smart-forms.types';

export class FormSubmissionWorkflowService {
  private workflowEngine: WorkflowEngine;

  constructor() {
    this.workflowEngine = new WorkflowEngine();
  }

  /**
   * Start workflow for a submission
   */
  async startWorkflow(
    submission: IFormSubmissionDocument,
    template: IFormTemplateDocument
  ): Promise<void> {
    if (!template.workflow) return;

    // Start workflow
    const workflowState = await this.workflowEngine.startWorkflow(
      submission.toObject() as IFormSubmission,
      template.workflow
    );

    submission.workflow_state = workflowState;
    await submission.save();
  }

  /**
   * Execute a workflow action
   */
  async executeWorkflowAction(
    submissionId: string,
    actionId: string,
    userId: string,
    userName: string,
    comments?: string,
    signature?: string
  ): Promise<IFormSubmissionDocument | null> {
    const submission = await FormSubmission.findBySubmissionId(submissionId);
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

    // Execute action
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

    // Update submission
    submission.workflow_state.current_step_id = result.newStep.step_id;
    submission.workflow_state.status = result.newStatus;
    if (result.assignedTo) {
      submission.workflow_state.assigned_to = result.assignedTo;
    }

    // Add timeline event
    submission.addTimelineEvent(
      'workflow_action',
      `Action "${actionId}" executed`,
      `تم تنفيذ الإجراء "${actionId}"`,
      userId,
      userName,
      { action_id: actionId, comments }
    );

    // Update completion dates
    if (result.newStatus === SubmissionStatus.COMPLETED) {
      submission.completed_at = new Date();
    } else if (result.newStatus === SubmissionStatus.CANCELLED) {
      submission.cancelled_at = new Date();
    }

    await submission.save();
    return submission;
  }

  /**
   * Submit a draft
   */
  async submitDraft(
    submissionId: string,
    userId: string,
    userName: string
  ): Promise<IFormSubmissionDocument | null> {
    const submission = await FormSubmission.findBySubmissionId(submissionId);
    if (!submission) {
      throw new Error('Submission not found');
    }

    if (submission.workflow_state.status !== SubmissionStatus.DRAFT) {
      throw new Error('Only drafts can be submitted');
    }

    const template = await FormTemplate.findById(submission.form_template_id);
    if (!template) {
      throw new Error('Form template not found');
    }

    // Update status
    submission.workflow_state.status = SubmissionStatus.SUBMITTED;

    // Add timeline event
    submission.addTimelineEvent(
      'submitted',
      'Draft submitted',
      'تم تقديم المسودة',
      userId,
      userName
    );

    await submission.save();

    // Start workflow if configured
    if (template.workflow) {
      await this.startWorkflow(submission, template);
    }

    return submission;
  }

  /**
   * Get available actions for current workflow step
   */
  async getAvailableActions(submissionId: string): Promise<IWorkflowAction[]> {
    const submission = await FormSubmission.findBySubmissionId(submissionId);
    if (!submission) {
      throw new Error('Submission not found');
    }

    const template = await FormTemplate.findById(submission.form_template_id);
    if (!template || !template.workflow) {
      return [];
    }

    const currentStep = this.workflowEngine.getCurrentStep(
      template.workflow,
      submission.toObject() as IFormSubmission
    );

    return currentStep?.available_actions || [];
  }

  /**
   * Get workflow state
   */
  async getWorkflowState(submissionId: string): Promise<IWorkflowState> {
    const submission = await FormSubmission.findBySubmissionId(submissionId);
    if (!submission) {
      throw new Error('Submission not found');
    }

    return submission.workflow_state;
  }
}

export default new FormSubmissionWorkflowService();
