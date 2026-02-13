import { Query } from '../Query';

/**
 * Query to get a form submission by ID
 * Example of Query Object Pattern
 */
export class GetFormSubmissionQuery extends Query {
  constructor(
    public readonly submissionId: string,
    public readonly includeTimeline: boolean = false,
    public readonly includeComments: boolean = false,
  ) {
    super();
  }

  async execute(): Promise<unknown> {
    throw new Error('Use QueryBus.execute() instead');
  }
}

/**
 * Query to get all form submissions for a template
 */
export class GetFormSubmissionsQuery extends Query {
  constructor(
    public readonly formTemplateId: string,
    public readonly status?: string,
    public readonly page: number = 1,
    public readonly limit: number = 10,
  ) {
    super();
  }

  async execute(): Promise<unknown> {
    throw new Error('Use QueryBus.execute() instead');
  }
}

/**
 * Query to get form submission statistics
 */
export class GetFormSubmissionStatsQuery extends Query {
  constructor(
    public readonly formTemplateId: string,
    public readonly dateFrom?: Date,
    public readonly dateTo?: Date,
  ) {
    super();
  }

  async execute(): Promise<unknown> {
    throw new Error('Use QueryBus.execute() instead');
  }
}
