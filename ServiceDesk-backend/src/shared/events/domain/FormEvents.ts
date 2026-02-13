import { DomainEvent } from '../DomainEvent';

export class FormTemplateCreatedEvent extends DomainEvent {
  constructor(
    formId: string,
    public readonly formName: string,
    public readonly createdBy: string,
  ) {
    super(formId, 'FormTemplate');
  }

  getEventType(): string {
    return 'FormTemplateCreated';
  }

  getEventData(): Record<string, unknown> {
    return {
      formName: this.formName,
      createdBy: this.createdBy,
    };
  }
}

export class FormTemplatePublishedEvent extends DomainEvent {
  constructor(
    formId: string,
    public readonly version: number,
    public readonly publishedBy: string,
  ) {
    super(formId, 'FormTemplate');
  }

  getEventType(): string {
    return 'FormTemplatePublished';
  }

  getEventData(): Record<string, unknown> {
    return {
      version: this.version,
      publishedBy: this.publishedBy,
    };
  }
}

export class FormSubmissionCreatedEvent extends DomainEvent {
  constructor(
    submissionId: string,
    public readonly formId: string,
    public readonly submittedBy: string,
  ) {
    super(submissionId, 'FormSubmission');
  }

  getEventType(): string {
    return 'FormSubmissionCreated';
  }

  getEventData(): Record<string, unknown> {
    return {
      formId: this.formId,
      submittedBy: this.submittedBy,
    };
  }
}

export class FormSubmissionStatusChangedEvent extends DomainEvent {
  constructor(
    submissionId: string,
    public readonly oldStatus: string,
    public readonly newStatus: string,
    public readonly changedBy: string,
  ) {
    super(submissionId, 'FormSubmission');
  }

  getEventType(): string {
    return 'FormSubmissionStatusChanged';
  }

  getEventData(): Record<string, unknown> {
    return {
      oldStatus: this.oldStatus,
      newStatus: this.newStatus,
      changedBy: this.changedBy,
    };
  }
}

export class FormSubmissionApprovedEvent extends DomainEvent {
  constructor(
    submissionId: string,
    public readonly approvedBy: string,
    public readonly comments?: string,
  ) {
    super(submissionId, 'FormSubmission');
  }

  getEventType(): string {
    return 'FormSubmissionApproved';
  }

  getEventData(): Record<string, unknown> {
    return {
      approvedBy: this.approvedBy,
      comments: this.comments,
    };
  }
}

export class FormSubmissionRejectedEvent extends DomainEvent {
  constructor(
    submissionId: string,
    public readonly rejectedBy: string,
    public readonly reason: string,
  ) {
    super(submissionId, 'FormSubmission');
  }

  getEventType(): string {
    return 'FormSubmissionRejected';
  }

  getEventData(): Record<string, unknown> {
    return {
      rejectedBy: this.rejectedBy,
      reason: this.reason,
    };
  }
}
