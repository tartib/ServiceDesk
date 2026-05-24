/**
 * RecordActivityService — Activity Timeline for RecordItems
 *
 * Appends timeline events to the underlying FormSubmission and
 * emits notifications via the internal API registry.
 */

import { formSubmissionService } from './formSubmissionService';
import type { IFormSubmissionDocument } from '../../../core/entities/FormSubmission';
import InternalApiRegistry from '../../../shared/internal-api/InternalApiRegistry';
import logger from '../../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export enum RecordActivityType {
  RECORD_CREATED = 'record.created',
  STATUS_CHANGED = 'record.status_changed',
  ASSIGNED = 'record.assigned',
  COMMENT_ADDED = 'record.comment_added',
  DOCUMENT_ADDED = 'record.document_added',
  WORKFLOW_STARTED = 'record.workflow_started',
  SLA_UPDATED = 'record.sla_updated',
  DRAFT_SAVED = 'record.draft_saved',
}

interface ActivityEventDTO {
  formSubmissionId: string;
  type: RecordActivityType;
  description: string;
  descriptionAr?: string;
  actorId: string;
  actorName: string;
  metadata?: Record<string, unknown>;
}

class RecordActivityService {
  /**
   * Append an activity event to the FormSubmission timeline.
   */
  async addActivity(dto: ActivityEventDTO): Promise<void> {
    try {
      const submission = await formSubmissionService.getSubmissionById(dto.formSubmissionId);
      if (!submission) {
        logger.warn('[RecordActivity] Submission not found', { id: dto.formSubmissionId });
        return;
      }

      submission.addTimelineEvent(
        dto.type,
        dto.description,
        dto.descriptionAr,
        dto.actorId,
        dto.actorName,
        dto.metadata as Record<string, any>,
      );

      await (submission as IFormSubmissionDocument).save();
    } catch (err) {
      logger.error('[RecordActivity] Failed to add activity', { error: err, dto });
    }
  }

  /**
   * Convenience: record created event.
   */
  async onRecordCreated(
    formSubmissionId: string,
    actorId: string,
    actorName: string,
    recordNumber: string,
  ): Promise<void> {
    await this.addActivity({
      formSubmissionId,
      type: RecordActivityType.RECORD_CREATED,
      description: `Record ${recordNumber} created`,
      descriptionAr: `تم إنشاء السجل ${recordNumber}`,
      actorId,
      actorName,
      metadata: { recordNumber },
    });
  }

  /**
   * Convenience: status changed event.
   */
  async onStatusChanged(
    formSubmissionId: string,
    actorId: string,
    actorName: string,
    fromStatus: string,
    toStatus: string,
  ): Promise<void> {
    await this.addActivity({
      formSubmissionId,
      type: RecordActivityType.STATUS_CHANGED,
      description: `Status changed from ${fromStatus} to ${toStatus}`,
      descriptionAr: `تم تغيير الحالة من ${fromStatus} إلى ${toStatus}`,
      actorId,
      actorName,
      metadata: { fromStatus, toStatus },
    });
  }

  /**
   * Convenience: record assigned event.
   */
  async onAssigned(
    formSubmissionId: string,
    actorId: string,
    actorName: string,
    assigneeId: string,
    assigneeName: string,
  ): Promise<void> {
    await this.addActivity({
      formSubmissionId,
      type: RecordActivityType.ASSIGNED,
      description: `Assigned to ${assigneeName}`,
      descriptionAr: `تم التعيين إلى ${assigneeName}`,
      actorId,
      actorName,
      metadata: { assigneeId, assigneeName },
    });
  }

  /**
   * Convenience: workflow started event.
   */
  async onWorkflowStarted(
    formSubmissionId: string,
    actorId: string,
    actorName: string,
    workflowInstanceId: string,
  ): Promise<void> {
    await this.addActivity({
      formSubmissionId,
      type: RecordActivityType.WORKFLOW_STARTED,
      description: 'Workflow started automatically',
      descriptionAr: 'تم بدء سير العمل تلقائياً',
      actorId,
      actorName,
      metadata: { workflowInstanceId },
    });
  }
}

export const recordActivityService = new RecordActivityService();
export default recordActivityService;
