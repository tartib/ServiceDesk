/**
 * SelfServiceFacade — Customer-visible record policy (ADR 001 Phase 6)
 *
 * Wraps IRecordService with a policy that filters records to only those
 * visible to the submitter. End-users see their own records; agents see all.
 *
 * Architecture:
 *   self-service portal → SelfServiceFacade → IRecordService
 */

import type { IRecordService, RecordListOptions, RecordListResult, RecordDetail } from '../../modules/forms/domain/record-interfaces';
import type { IFormSubmissionDocument } from '../../core/entities/FormSubmission';

/** Statuses that are visible in the customer-facing self-service portal */
const CUSTOMER_VISIBLE_STATUSES = new Set([
  'submitted',
  'pending_approval',
  'approved',
  'rejected',
  'in_progress',
  'completed',
  'cancelled',
]);

export class SelfServiceFacade {
  constructor(private readonly recordService: IRecordService) {}

  /**
   * List records for a specific user — applies customer-visibility policy.
   * Agents passing `bypassPolicy = true` receive all records regardless of status.
   */
  async listUserRecords(
    userId: string,
    options: Omit<RecordListOptions, 'submitted_by'> = {},
    bypassPolicy = false,
  ): Promise<RecordListResult> {
    const result = await this.recordService.listRecords({
      ...options,
      submitted_by: userId,
    });

    if (bypassPolicy) return result;

    const filtered = result.submissions.filter(
      (doc: IFormSubmissionDocument) => CUSTOMER_VISIBLE_STATUSES.has(doc.workflow_state?.status as string),
    );

    return {
      submissions: filtered,
      total: filtered.length,
      page: result.page,
      limit: result.limit,
      total_pages: Math.ceil(filtered.length / result.limit),
    } as RecordListResult;
  }

  /**
   * Get a single record — enforces ownership check for non-agents.
   */
  async getUserRecord(
    recordId: string,
    userId: string,
    bypassPolicy = false,
  ): Promise<RecordDetail | null> {
    const doc = await this.recordService.getRecord(recordId);
    if (!doc) return null;

    if (!bypassPolicy) {
      const submittedBy = (doc as any).submitted_by;
      const submitterId = submittedBy?.user_id ?? submittedBy;
      if (submitterId !== userId) {
        return null;
      }
    }

    return this.recordService.toRecordDetail(doc);
  }
}
