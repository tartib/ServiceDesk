import { EventListener } from '../EventListener';
import { DomainEvent } from '../DomainEvent';
import { FormSubmissionStatusChangedEvent, FormSubmissionApprovedEvent } from '../domain/FormEvents';
import logger from '../../../utils/logger';

/**
 * Listener for form submission status changes
 * Can trigger notifications, analytics updates, etc.
 */
export class FormSubmissionStatusChangeListener extends EventListener {
  getEventType(): string {
    return 'FormSubmissionStatusChanged';
  }

  async handle(event: DomainEvent): Promise<void> {
    const statusChangeEvent = event as FormSubmissionStatusChangedEvent;

    logger.info(`Form submission status changed: ${statusChangeEvent.aggregateId}`, {
      oldStatus: statusChangeEvent.oldStatus,
      newStatus: statusChangeEvent.newStatus,
      changedBy: statusChangeEvent.changedBy,
    });

    // Example: Trigger notification service
    // await notificationService.notifyStatusChange(statusChangeEvent);

    // Example: Update analytics
    // await analyticsService.recordStatusChange(statusChangeEvent);

    // Example: Check for escalation rules
    // await escalationService.checkEscalationRules(statusChangeEvent);
  }
}

/**
 * Listener for form submission approvals
 * Can trigger downstream workflows, notifications, etc.
 */
export class FormSubmissionApprovalListener extends EventListener {
  getEventType(): string {
    return 'FormSubmissionApproved';
  }

  async handle(event: DomainEvent): Promise<void> {
    const approvalEvent = event as FormSubmissionApprovedEvent;

    logger.info(`Form submission approved: ${approvalEvent.aggregateId}`, {
      approvedBy: approvalEvent.approvedBy,
      comments: approvalEvent.comments,
    });

    // Example: Trigger downstream processes
    // await workflowService.triggerNextStep(approvalEvent);

    // Example: Send notification to submitter
    // await notificationService.notifyApproval(approvalEvent);

    // Example: Update audit trail
    // await auditService.logApproval(approvalEvent);
  }
}
