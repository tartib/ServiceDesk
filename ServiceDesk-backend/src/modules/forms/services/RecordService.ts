/**
 * RecordService — Platform Facade for Form Submissions + RecordItem
 *
 * Wraps formSubmissionService with the platform's record vocabulary.
 * All new code (solution modules, platform controllers) should use this
 * service instead of calling formSubmissionService directly.
 *
 * Architecture (ADR 001, Phase 2 + Section 1 Core):
 *   formSubmissionService (form data, unchanged)
 *   └── RecordService (platform facade — this file)
 *       ├── RecordItem (metadata model)
 *       └── solution modules / platform controllers
 *
 * The underlying storage model (FormSubmission) is not changed.
 * RecordItem provides the metadata layer (status, assignee, SLA, workflow ref).
 */

import { formSubmissionService } from './formSubmissionService';
import type { IFormSubmissionDocument, ITimelineEvent, IComment, IAttachment, ISignatureData } from '../core-re-exports';
import { SubmissionStatus } from '../core-re-exports';
import type {
  IRecordService,
  RecordDetail,
  CreateRecordDTO,
  UpdateRecordDTO,
  RecordListOptions,
  RecordListResult,
  RecordStatus,
} from '../domain/record-interfaces';
import RecordItem, {
  type IRecordItemDocument,
  RecordItemStatus,
  RecordSourceType,
  RecordPriority,
} from '../models/RecordItem';
import type { WorkspaceType } from '../../../shared/types/workspace.types';
import { autoAssignRecord } from './RecordAutoAssignService';
import { bindSLAToRecord } from './RecordSLAService';
import logger from '../../../utils/logger';

// ── DTOs for the full record flow ─────────────────────────────────────────

export interface CreateFullRecordDTO {
  title: string;
  description?: string;
  requestTypeId?: string;
  workspaceType?: WorkspaceType;
  priority?: RecordPriority;
  formTemplateId: string;
  formData: Record<string, unknown>;
  attachments?: IAttachment[];
  submittedBy: {
    userId: string;
    name: string;
    email: string;
    department?: string;
    siteId?: string;
  };
  organizationId: string;
  siteId?: string;
  isDraft?: boolean;
}

export interface FullRecordDetail extends RecordDetail {
  recordItem: IRecordItemDocument;
}

export interface RecordItemListOptions {
  organizationId: string;
  status?: RecordItemStatus;
  assigneeId?: string;
  requesterId?: string;
  requestTypeId?: string;
  workspaceType?: WorkspaceType;
  sourceType?: RecordSourceType;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface RecordItemListResult {
  items: IRecordItemDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

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

  // ══════════════════════════════════════════════════════════════════════════
  // FULL RECORD FLOW (Section 1 Core — RecordItem + FormSubmission)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Create a full record: FormSubmission (form data) + RecordItem (metadata).
   * This is the primary creation method for the new request flow.
   */
  async createFullRecord(dto: CreateFullRecordDTO): Promise<{
    recordItem: IRecordItemDocument;
    submission: IFormSubmissionDocument;
  }> {
    // 1. Create FormSubmission (form data)
    const submission = await formSubmissionService.createSubmission({
      form_template_id: dto.formTemplateId,
      data: dto.formData as Record<string, any>,
      attachments: dto.attachments,
      is_draft: dto.isDraft,
      submitted_by: {
        user_id: dto.submittedBy.userId,
        name: dto.submittedBy.name,
        email: dto.submittedBy.email,
        department: dto.submittedBy.department,
        site_id: dto.submittedBy.siteId,
      },
      site_id: dto.siteId,
    });

    // 2. Create RecordItem (metadata)
    const recordItem = new RecordItem({
      title: dto.title,
      description: dto.description,
      requestTypeId: dto.requestTypeId,
      workspaceType: dto.workspaceType,
      status: dto.isDraft ? RecordItemStatus.DRAFT : RecordItemStatus.SUBMITTED,
      priority: dto.priority ?? RecordPriority.MEDIUM,
      requesterId: dto.submittedBy.userId,
      requesterName: dto.submittedBy.name,
      requesterEmail: dto.submittedBy.email,
      formSubmissionId: (submission._id as unknown as { toString(): string }).toString(),
      sourceType: RecordSourceType.RECORD,
      organizationId: dto.organizationId,
      siteId: dto.siteId,
    });

    await recordItem.save();

    // 3. Auto-assign (non-blocking — best effort)
    if (!dto.isDraft) {
      autoAssignRecord(recordItem, {
        requestTypeId: dto.requestTypeId,
        organizationId: dto.organizationId,
        siteId: dto.siteId,
      }).catch((err) => logger.warn('[RecordService] Auto-assign failed', { error: err }));
    }

    // 4. Bind SLA (non-blocking — best effort)
    if (!dto.isDraft) {
      bindSLAToRecord(recordItem, {
        requestTypeId: dto.requestTypeId,
        organizationId: dto.organizationId,
        priority: dto.priority ?? RecordPriority.MEDIUM,
      }).catch((err) => logger.warn('[RecordService] SLA bind failed', { error: err }));
    }

    logger.info('[RecordService] Full record created', {
      recordId: recordItem._id,
      recordNumber: recordItem.recordNumber,
      submissionId: submission.submission_id,
    });

    return { recordItem, submission };
  }

  /**
   * Get a full record: RecordItem + joined FormSubmission.
   */
  async getFullRecord(recordItemId: string): Promise<{
    recordItem: IRecordItemDocument;
    submission: IFormSubmissionDocument | null;
  } | null> {
    const recordItem = await RecordItem.findById(recordItemId);
    if (!recordItem) return null;

    let submission: IFormSubmissionDocument | null = null;
    if (recordItem.formSubmissionId) {
      submission = await formSubmissionService.getSubmissionById(recordItem.formSubmissionId);
    }

    return { recordItem, submission };
  }

  /**
   * Get a full record by record number (e.g. REC-000001).
   */
  async getFullRecordByNumber(recordNumber: string): Promise<{
    recordItem: IRecordItemDocument;
    submission: IFormSubmissionDocument | null;
  } | null> {
    const recordItem = await RecordItem.findOne({ recordNumber });
    if (!recordItem) return null;

    let submission: IFormSubmissionDocument | null = null;
    if (recordItem.formSubmissionId) {
      submission = await formSubmissionService.getSubmissionById(recordItem.formSubmissionId);
    }

    return { recordItem, submission };
  }

  /**
   * Update RecordItem status.
   */
  async updateRecordItemStatus(
    recordItemId: string,
    status: RecordItemStatus,
    _actorId: string,
  ): Promise<IRecordItemDocument | null> {
    return RecordItem.findByIdAndUpdate(
      recordItemId,
      { $set: { status } },
      { new: true },
    );
  }

  /**
   * Assign a record to a user.
   */
  async assignRecordItem(
    recordItemId: string,
    assigneeId: string,
    assigneeName: string,
  ): Promise<IRecordItemDocument | null> {
    return RecordItem.findByIdAndUpdate(
      recordItemId,
      { $set: { assigneeId, assigneeName } },
      { new: true },
    );
  }

  /**
   * List RecordItems with filtering and pagination.
   */
  async listRecordItems(options: RecordItemListOptions): Promise<RecordItemListResult> {
    const page = Math.max(options.page ?? 1, 1);
    const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {
      organizationId: options.organizationId,
    };

    if (options.status) filter.status = options.status;
    if (options.assigneeId) filter.assigneeId = options.assigneeId;
    if (options.requesterId) filter.requesterId = options.requesterId;
    if (options.requestTypeId) filter.requestTypeId = options.requestTypeId;
    if (options.workspaceType) filter.workspaceType = options.workspaceType;
    if (options.sourceType) filter.sourceType = options.sourceType;
    if (options.search) {
      filter.$or = [
        { title: { $regex: options.search, $options: 'i' } },
        { recordNumber: { $regex: options.search, $options: 'i' } },
        { requesterName: { $regex: options.search, $options: 'i' } },
      ];
    }

    const sortField = options.sortBy ?? 'createdAt';
    const sortDir = options.sortOrder === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      RecordItem.find(filter)
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limit),
      RecordItem.countDocuments(filter),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * List drafts for a specific user.
   */
  async listDrafts(
    organizationId: string,
    requesterId: string,
  ): Promise<IRecordItemDocument[]> {
    return RecordItem.find({
      organizationId,
      requesterId,
      status: RecordItemStatus.DRAFT,
    }).sort({ updatedAt: -1 });
  }

  /**
   * Delete a draft record (RecordItem + FormSubmission).
   */
  async deleteDraft(recordItemId: string, requesterId: string): Promise<boolean> {
    const recordItem = await RecordItem.findOne({
      _id: recordItemId,
      requesterId,
      status: RecordItemStatus.DRAFT,
    });

    if (!recordItem) return false;

    if (recordItem.formSubmissionId) {
      await formSubmissionService.deleteSubmission(recordItem.formSubmissionId);
    }

    await RecordItem.findByIdAndDelete(recordItemId);
    return true;
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
