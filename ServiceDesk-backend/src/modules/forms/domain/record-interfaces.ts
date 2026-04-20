/**
 * Forms Platform — Record Domain Interfaces
 *
 * Defines the platform vocabulary for records (form submissions as lifecycle objects).
 * The underlying storage is still FormSubmission — these interfaces provide the
 * platform-facing abstraction used by solution modules and the frontend domain layer.
 *
 * Architecture (ADR 001, Phase 2):
 *   FormSubmission (implementation) → RecordService (facade) → solution modules
 */

import type { IFormSubmissionDocument } from '../../../core/entities/FormSubmission';
import type { SubmissionStatus } from '../../../core/types/smart-forms.types';
import type {
  CreateSubmissionDTO,
  UpdateSubmissionDTO,
  SubmissionListOptions,
  SubmissionListResult,
} from '../services/formSubmissionService';

// ── Status alias ───────────────────────────────────────────────────────────

/** Platform name for submission/record status */
export type RecordStatus = SubmissionStatus;

// ── Core read model ────────────────────────────────────────────────────────

/**
 * RecordDetail — the canonical read model for a single record.
 * Produced by RecordService and consumed by frontend via /api/v2/forms/submissions/:id.
 */
export interface RecordDetail {
  id: string;
  submissionId: string;
  formDefinitionId: string;
  formVersion: number;
  status: RecordStatus;
  data: Record<string, unknown>;
  assignee?: string;
  submittedBy: {
    userId: string;
    name: string;
    email: string;
    department?: string;
  };
  timeline: IRecordTimelineEvent[];
  comments: IRecordComment[];
  attachments: IRecordAttachment[];
  signature?: {
    data: string;
    ipAddress: string;
    signedAt: string;
  };
  workflowState?: {
    currentStepId: string;
    status: string;
  };
  siteId?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Supporting types ───────────────────────────────────────────────────────

export interface IRecordTimelineEvent {
  eventId: string;
  type: string;
  description: string;
  description_ar?: string;
  actor?: string;
  actorName?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface IRecordComment {
  commentId: string;
  text: string;
  author: string;
  authorName?: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface IRecordAttachment {
  attachmentId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface IRecordAssignment {
  recordId: string;
  assigneeId: string;
  assignedBy: string;
  assignedAt: string;
  note?: string;
}

// ── DTO aliases ────────────────────────────────────────────────────────────

/** DTO for creating a new record (same as CreateSubmissionDTO) */
export type CreateRecordDTO = CreateSubmissionDTO;

/** DTO for updating record data */
export type UpdateRecordDTO = UpdateSubmissionDTO;

/** Options for listing records */
export type RecordListOptions = SubmissionListOptions;

/** Result shape for paginated record lists */
export type RecordListResult = SubmissionListResult;

// ── Service interface ──────────────────────────────────────────────────────

/**
 * IRecordService — the platform contract for managing records (submissions).
 *
 * Backed by FormSubmissionService; solution modules and controllers
 * should depend on this interface going forward.
 */
export interface IRecordService {
  createRecord(dto: CreateRecordDTO): Promise<IFormSubmissionDocument>;
  getRecord(recordId: string): Promise<IFormSubmissionDocument | null>;
  listRecords(options?: RecordListOptions): Promise<RecordListResult>;
  updateRecordData(recordId: string, dto: UpdateRecordDTO): Promise<IFormSubmissionDocument | null>;
  updateRecordStatus(recordId: string, status: RecordStatus, actorId: string, note?: string): Promise<IFormSubmissionDocument | null>;
  approveRecord(recordId: string, stepId: string, actorId: string, comment?: string): Promise<IFormSubmissionDocument | null>;
  rejectRecord(recordId: string, stepId: string, actorId: string, reason: string): Promise<IFormSubmissionDocument | null>;
  deleteRecord(recordId: string): Promise<boolean>;
  toRecordDetail(doc: IFormSubmissionDocument): RecordDetail;
}
