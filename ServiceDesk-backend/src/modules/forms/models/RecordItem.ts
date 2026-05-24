/**
 * RecordItem Model — Platform Core (Hybrid Architecture)
 *
 * Thin metadata model that sits alongside FormSubmission.
 * RecordItem stores orchestration data (status, assignee, SLA, workflow ref)
 * while the actual form data lives in FormSubmission.
 *
 * Architecture (ADR 001, Section 1):
 *   RequestType → FormSubmission (form data) + RecordItem (metadata) → WorkflowInstance
 */

import mongoose, { Schema, Document } from 'mongoose';
import { WorkspaceType } from '../../../shared/types/workspace.types';

export enum RecordItemStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  IN_PROGRESS = 'in_progress',
  WAITING_CLIENT = 'waiting_client',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum RecordSourceType {
  RECORD = 'record',
  TICKET = 'ticket',
  TASK = 'task',
  FORM_SUBMISSION = 'form_submission',
  SERVICE_CATALOG = 'service_catalog',
}

export enum RecordPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface IRecordItem {
  recordNumber: string;
  title: string;
  description?: string;
  requestTypeId?: string;
  workspaceType?: WorkspaceType;
  status: RecordItemStatus;
  priority: RecordPriority;
  requesterId: string;
  requesterName?: string;
  requesterEmail?: string;
  assigneeId?: string;
  assigneeName?: string;
  formSubmissionId?: string;
  workflowInstanceId?: string;
  sla?: {
    dueAt?: Date;
    status?: 'on_track' | 'at_risk' | 'breached';
  };
  sourceType: RecordSourceType;
  sourceId?: string;
  tags?: string[];
  organizationId: string;
  siteId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRecordItemDocument extends IRecordItem, Document {
  generateRecordNumber(): Promise<string>;
}

const RecordSLASchema = new Schema(
  {
    dueAt: { type: Date },
    status: {
      type: String,
      enum: ['on_track', 'at_risk', 'breached'],
      default: 'on_track',
    },
  },
  { _id: false },
);

const RecordItemSchema = new Schema<IRecordItemDocument>(
  {
    recordNumber: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    description: {
      type: String,
      maxlength: 5000,
    },
    requestTypeId: {
      type: String,
      ref: 'RequestType',
      index: true,
    },
    workspaceType: {
      type: String,
      enum: Object.values(WorkspaceType),
    },
    status: {
      type: String,
      enum: Object.values(RecordItemStatus),
      default: RecordItemStatus.DRAFT,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(RecordPriority),
      default: RecordPriority.MEDIUM,
    },
    requesterId: {
      type: String,
      required: true,
      index: true,
    },
    requesterName: { type: String },
    requesterEmail: { type: String },
    assigneeId: {
      type: String,
      index: true,
    },
    assigneeName: { type: String },
    formSubmissionId: {
      type: String,
      ref: 'FormSubmission',
    },
    workflowInstanceId: {
      type: String,
      ref: 'WorkflowInstance',
    },
    sla: { type: RecordSLASchema },
    sourceType: {
      type: String,
      enum: Object.values(RecordSourceType),
      default: RecordSourceType.RECORD,
    },
    sourceId: { type: String },
    tags: [{ type: String }],
    organizationId: {
      type: String,
      required: true,
      index: true,
    },
    siteId: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.__v = undefined;
        return ret;
      },
    },
  },
);

// Compound indexes
RecordItemSchema.index({ organizationId: 1, status: 1 });
RecordItemSchema.index({ organizationId: 1, requestTypeId: 1, status: 1 });
RecordItemSchema.index({ organizationId: 1, assigneeId: 1, status: 1 });
RecordItemSchema.index({ organizationId: 1, requesterId: 1 });
RecordItemSchema.index({ organizationId: 1, workspaceType: 1, status: 1 });

// Auto-generate record number
RecordItemSchema.pre('save', async function (next) {
  if (!this.recordNumber) {
    const count = await RecordItem.countDocuments({ organizationId: this.organizationId });
    this.recordNumber = `REC-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

const RecordItem = mongoose.model<IRecordItemDocument>('RecordItem', RecordItemSchema);

export default RecordItem;
