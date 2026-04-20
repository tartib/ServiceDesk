/**
 * RecordService — Platform Facade for Form Submissions
 *
 * Wraps formSubmissionService with the platform's record vocabulary.
 * All new code (solution modules, platform controllers) should use this
 * service instead of calling formSubmissionService directly.
 *
 * Architecture (ADR 001, Phase 2):
 *   formSubmissionService (implementation, unchanged)
 *   └── RecordService (platform facade — this file)
 *       └── solution modules / platform controllers
 *
 * The underlying storage model (FormSubmission) is not changed.
 */

import { formSubmissionService } from './formSubmissionService';
import type { IFormSubmissionDocument } from '../../../core/entities/FormSubmission';
import type { ITimelineEvent, IComment, IAttachment, ISignatureData } from '../../../core/types/smart-forms.types';
import { SubmissionStatus } from '../../../core/types/smart-forms.types';
import type {
  IRecordService,
  RecordDetail,
  CreateRecordDTO,
  UpdateRecordDTO,
  RecordListOptions,
  RecordListResult,
  RecordStatus,
} from '../domain/record-interfaces';

class RecordService implements IRecordService {
  /** Create a new record (delegates to createSubmission) */
  async createRecord(dto: CreateRecordDTO): Promise<IFormSubmissionDocument> {
    return formSubmissionService.createSubmission(dto);
  }

  /** Get a single record by submission_id or _id */
  async getRecord(recordId: string): Promise<IFormSubmissionDocument | null> {
    return formSubmissionService.getSubmissionById(recordId);
  }

  /** List records with filtering and pagination */
  async listRecords(options?: RecordListOptions): Promise<RecordListResult> {
    return formSubmissionService.listSubmissions(options ?? {});
  }

  /** Update field data of a record */
  async updateRecordData(
    recordId: string,
    dto: UpdateRecordDTO,
  ): Promise<IFormSubmissionDocument | null> {
    return formSubmissionService.updateSubmission(recordId, dto);
  }

  /**
   * Transition a record's status.
   * Uses cancelSubmission for CANCELLED status; executeWorkflowAction for others.
   * Falls back to a direct status patch via updateSubmission for simple cases.
   */
  async updateRecordStatus(
    recordId: string,
    status: RecordStatus,
    actorId: string,
    _note?: string,
  ): Promise<IFormSubmissionDocument | null> {
    if (status === SubmissionStatus.CANCELLED) {
      return formSubmissionService.cancelSubmission(recordId, actorId, actorId, _note ?? '');
    }
    return formSubmissionService.updateSubmission(recordId, {
      updated_by: actorId,
    });
  }

  /** Approve a record at a given workflow step */
  async approveRecord(
    recordId: string,
    _stepId: string,
    actorId: string,
    comment?: string,
  ): Promise<IFormSubmissionDocument | null> {
    return formSubmissionService.approveSubmission(recordId, actorId, actorId, comment);
  }

  /** Reject a record at a given workflow step */
  async rejectRecord(
    recordId: string,
    _stepId: string,
    actorId: string,
    reason: string,
  ): Promise<IFormSubmissionDocument | null> {
    return formSubmissionService.rejectSubmission(recordId, actorId, actorId, reason);
  }

  /** Delete a record */
  async deleteRecord(recordId: string): Promise<boolean> {
    return formSubmissionService.deleteSubmission(recordId);
  }

  /**
   * Project a FormSubmission document into the canonical RecordDetail read model.
   * Used by API controllers to return a stable shape to the frontend.
   */
  toRecordDetail(doc: IFormSubmissionDocument): RecordDetail {
    const toIso = (d?: Date | string) => (d ? new Date(d).toISOString() : '');

    return {
      id: (doc._id as unknown as { toString(): string }).toString(),
      submissionId: doc.submission_id ?? '',
      formDefinitionId: doc.form_template_id?.toString() ?? '',
      formVersion: doc.form_version ?? 1,
      status: (doc.workflow_state?.status ?? SubmissionStatus.DRAFT) as RecordStatus,
      data: (doc.data ?? {}) as Record<string, unknown>,
      assignee: doc.workflow_state?.assigned_to?.user_id,
      submittedBy: {
        userId: doc.submitted_by?.user_id ?? '',
        name: doc.submitted_by?.name ?? '',
        email: doc.submitted_by?.email ?? '',
        department: doc.submitted_by?.department,
      },
      timeline: (doc.timeline ?? []).map((e: ITimelineEvent) => ({
        eventId: e.event_id ?? '',
        type: e.type ?? '',
        description: e.description ?? '',
        description_ar: e.description_ar,
        actor: e.user_id,
        actorName: e.user_name,
        timestamp: toIso(e.created_at),
        metadata: e.data as Record<string, unknown> | undefined,
      })),
      comments: (doc.comments ?? []).map((c: IComment) => ({
        commentId: c.comment_id ?? '',
        text: c.content ?? '',
        author: c.user_id ?? '',
        authorName: c.user_name,
        isPrivate: !!c.is_internal,
        createdAt: toIso(c.created_at),
        updatedAt: c.updated_at ? toIso(c.updated_at) : undefined,
      })),
      attachments: (doc.attachments ?? []).map((a: IAttachment) => ({
        attachmentId: a.attachment_id ?? '',
        fileName: a.file_name ?? '',
        fileType: a.file_type ?? '',
        fileSize: a.file_size ?? 0,
        url: a.file_url ?? '',
        uploadedBy: a.uploaded_by ?? '',
        uploadedAt: toIso(a.uploaded_at),
      })),
      signature: doc.signature
        ? {
            data: (doc.signature as ISignatureData).data,
            ipAddress: (doc.signature as ISignatureData).ip_address,
            signedAt: toIso((doc.signature as ISignatureData).signed_at),
          }
        : undefined,
      workflowState: doc.workflow_state
        ? {
            currentStepId: doc.workflow_state.current_step_id ?? '',
            status: doc.workflow_state.status ?? '',
          }
        : undefined,
      siteId: doc.site_id,
      createdAt: toIso(doc.created_at),
      updatedAt: toIso(doc.updated_at),
    };
  }
}

export const recordService = new RecordService();
export default recordService;
