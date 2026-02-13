import { Command } from '../Command';

/**
 * Command to create a form submission
 * Example of CQRS Command Pattern
 */
export class CreateFormSubmissionCommand extends Command {
  constructor(
    public readonly formTemplateId: string,
    public readonly submittedBy: string,
    public readonly data: Record<string, unknown>,
    public readonly attachments?: string[],
  ) {
    super();
  }

  async execute(): Promise<unknown> {
    throw new Error('Use CommandBus.execute() instead');
  }
}

/**
 * Command to update form submission status
 */
export class UpdateFormSubmissionStatusCommand extends Command {
  constructor(
    public readonly submissionId: string,
    public readonly newStatus: string,
    public readonly changedBy: string,
    public readonly comments?: string,
  ) {
    super();
  }

  async execute(): Promise<unknown> {
    throw new Error('Use CommandBus.execute() instead');
  }
}

/**
 * Command to approve a form submission
 */
export class ApproveFormSubmissionCommand extends Command {
  constructor(
    public readonly submissionId: string,
    public readonly approvedBy: string,
    public readonly comments?: string,
  ) {
    super();
  }

  async execute(): Promise<unknown> {
    throw new Error('Use CommandBus.execute() instead');
  }
}

/**
 * Command to reject a form submission
 */
export class RejectFormSubmissionCommand extends Command {
  constructor(
    public readonly submissionId: string,
    public readonly rejectedBy: string,
    public readonly reason: string,
  ) {
    super();
  }

  async execute(): Promise<unknown> {
    throw new Error('Use CommandBus.execute() instead');
  }
}
