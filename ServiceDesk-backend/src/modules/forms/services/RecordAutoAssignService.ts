/**
 * RecordAutoAssignService — Section 2, Batch 6
 *
 * On record creation, attempts to auto-assign an agent based on
 * the request type's assignment rules using AutoAssignmentEngine.
 */

import { AutoAssignmentEngine, type IUserService, type IAssignmentResult } from '../../../core/engines/AutoAssignmentEngine';
import { IRecordItemDocument } from '../models/RecordItem';

/**
 * Minimal user service adapter for auto-assignment.
 * In production, this queries the User model; here we provide the interface.
 */
let userServiceInstance: IUserService | null = null;

export function setAutoAssignUserService(svc: IUserService): void {
  userServiceInstance = svc;
}

const engine = new AutoAssignmentEngine();

export interface AutoAssignOptions {
  requestTypeId?: string;
  organizationId: string;
  siteId?: string;
}

/**
 * Attempt to auto-assign a record to an agent.
 * Returns the assignment result (may be null if no rules match).
 */
export async function autoAssignRecord(
  record: IRecordItemDocument,
  options: AutoAssignOptions,
): Promise<IAssignmentResult | null> {
  if (!userServiceInstance) {
    console.warn('[AutoAssign] No user service configured, skipping auto-assignment');
    return null;
  }

  if (!options.requestTypeId) {
    return null;
  }

  try {
    // Load request type to get assignment rules
    const RequestTypeModel = (await import('../models/RequestType')).default;
    const requestType = await RequestTypeModel.findById(options.requestTypeId).lean();

    if (!requestType) {
      return null;
    }

    // Use round-robin as default strategy when no specific rules exist
    const result = await engine.assignSubmission(
      {
        form_id: record._id?.toString() ?? '',
        submission_id: record._id?.toString() ?? '',
        organization_id: options.organizationId,
        site_id: options.siteId,
        data: {
          requestType: requestType.name,
          category: requestType.category,
          priority: record.priority,
        },
      } as any,
      [], // Assignment rules — empty triggers default round-robin
    );

    if (result.success && result.assignee) {
      record.assigneeId = result.assignee.user_id;
      record.assigneeName = result.assignee.name;
      await record.save();
    }

    return result;
  } catch (error) {
    console.error('[AutoAssign] Failed:', error);
    return null;
  }
}
