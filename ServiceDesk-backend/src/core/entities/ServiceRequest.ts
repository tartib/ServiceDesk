import mongoose, { Document, Schema } from 'mongoose';
import {
  ServiceRequestStatus,
  Priority,
  ApprovalStatus,
  IRequester,
  ISLAConfig,
  ITimelineEvent,
  IAttachment,
} from '../types/itsm.types';

export interface IServiceRequest extends Document {
  request_id: string;
  service_id: string;
  service_name: string;
  status: ServiceRequestStatus;
  priority: Priority;
  requester: IRequester;
  form_data: Record<string, any>;
  approval_status: {
    current_step: number;
    total_steps: number;
    approvals: Array<{
      step: number;
      approver_id: string;
      approver_name: string;
      status: ApprovalStatus;
      decision_at?: Date;
      comments?: string;
    }>;
  };
  assigned_to?: {
    technician_id: string;
    name: string;
    email: string;
    group_id?: string;
  };
  sla: ISLAConfig;
  fulfillment?: {
    fulfilled_by?: string;
    fulfilled_by_name?: string;
    fulfilled_at?: Date;
    notes?: string;
  };
  timeline: ITimelineEvent[];
  attachments: IAttachment[];
  site_id: string;
  created_at: Date;
  updated_at: Date;
  closed_at?: Date;
}

const RequesterSchema = new Schema<IRequester>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    department: { type: String, required: true },
    phone: { type: String },
    site_id: { type: String },
  },
  { _id: false }
);

const SLAConfigSchema = new Schema<ISLAConfig>(
  {
    sla_id: { type: String, required: true },
    response_due: { type: Date, required: true },
    resolution_due: { type: Date, required: true },
    response_met: { type: Boolean },
    resolution_met: { type: Boolean },
    response_at: { type: Date },
    resolved_at: { type: Date },
    breach_flag: { type: Boolean, default: false },
    escalation_level: { type: Number, default: 0 },
    paused_at: { type: Date },
    paused_duration_minutes: { type: Number, default: 0 },
  },
  { _id: false }
);

const ApprovalSchema = new Schema(
  {
    step: { type: Number, required: true },
    approver_id: { type: String, required: true },
    approver_name: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(ApprovalStatus),
      default: ApprovalStatus.PENDING,
    },
    decision_at: { type: Date },
    comments: { type: String },
  },
  { _id: false }
);

const ApprovalStatusSchema = new Schema(
  {
    current_step: { type: Number, default: 0 },
    total_steps: { type: Number, default: 0 },
    approvals: { type: [ApprovalSchema], default: [] },
  },
  { _id: false }
);

const AssigneeSchema = new Schema(
  {
    technician_id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    group_id: { type: String },
  },
  { _id: false }
);

const FulfillmentSchema = new Schema(
  {
    fulfilled_by: { type: String },
    fulfilled_by_name: { type: String },
    fulfilled_at: { type: Date },
    notes: { type: String },
  },
  { _id: false }
);

const TimelineEventSchema = new Schema<ITimelineEvent>(
  {
    event: { type: String, required: true },
    by: { type: String, required: true },
    by_name: { type: String },
    time: { type: Date, default: Date.now },
    details: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const AttachmentSchema = new Schema<IAttachment>(
  {
    file_id: { type: String, required: true },
    name: { type: String, required: true },
    size: { type: Number, required: true },
    mime_type: { type: String, required: true },
    url: { type: String, required: true },
    uploaded_by: { type: String, required: true },
    uploaded_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ServiceRequestSchema = new Schema<IServiceRequest>(
  {
    request_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    service_id: {
      type: String,
      required: true,
      index: true,
    },
    service_name: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ServiceRequestStatus),
      default: ServiceRequestStatus.SUBMITTED,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(Priority),
      default: Priority.MEDIUM,
      index: true,
    },
    requester: {
      type: RequesterSchema,
      required: true,
    },
    form_data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    approval_status: {
      type: ApprovalStatusSchema,
      default: () => ({
        current_step: 0,
        total_steps: 0,
        approvals: [],
      }),
    },
    assigned_to: {
      type: AssigneeSchema,
    },
    sla: {
      type: SLAConfigSchema,
      required: true,
    },
    fulfillment: {
      type: FulfillmentSchema,
    },
    timeline: {
      type: [TimelineEventSchema],
      default: [],
    },
    attachments: {
      type: [AttachmentSchema],
      default: [],
    },
    site_id: {
      type: String,
      required: true,
      index: true,
    },
    closed_at: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Compound indexes
ServiceRequestSchema.index({ status: 1, priority: 1, created_at: -1 });
ServiceRequestSchema.index({ 'requester.id': 1, status: 1, created_at: -1 });
ServiceRequestSchema.index({ service_id: 1, status: 1 });
ServiceRequestSchema.index({ 'assigned_to.technician_id': 1, status: 1 });
ServiceRequestSchema.index({ 'sla.breach_flag': 1, status: 1 });

// Virtual for is pending approval
ServiceRequestSchema.virtual('is_pending_approval').get(function () {
  return this.status === ServiceRequestStatus.PENDING_APPROVAL;
});

// Virtual for approval progress percentage
ServiceRequestSchema.virtual('approval_progress').get(function () {
  if (this.approval_status.total_steps === 0) return 100;
  const approved = this.approval_status.approvals.filter(
    (a) => a.status === ApprovalStatus.APPROVED
  ).length;
  return Math.round((approved / this.approval_status.total_steps) * 100);
});

// Pre-save middleware
ServiceRequestSchema.pre('save', function (next) {
  if (this.isNew) {
    this.timeline.push({
      event: 'Service Request Submitted',
      by: this.requester.id,
      by_name: this.requester.name,
      time: new Date(),
    });
  }
  next();
});

// Include virtuals in JSON
ServiceRequestSchema.set('toJSON', { virtuals: true });
ServiceRequestSchema.set('toObject', { virtuals: true });

const ServiceRequest = mongoose.model<IServiceRequest>('ServiceRequest', ServiceRequestSchema);

export default ServiceRequest;
