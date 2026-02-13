import mongoose, { Document, Schema } from 'mongoose';
import {
  ChangeStatus,
  ChangeType,
  Priority,
  Impact,
  RiskLevel,
  ITimelineEvent,
  IAttachment,
  ICabApproval,
  ISchedule,
  ApprovalStatus,
} from '../types/itsm.types';

export interface IChange extends Document {
  change_id: string;
  type: ChangeType;
  title: string;
  description: string;
  status: ChangeStatus;
  priority: Priority;
  impact: Impact;
  risk: RiskLevel;
  risk_assessment: string;
  requested_by: {
    id: string;
    name: string;
    email: string;
    department: string;
  };
  owner?: {
    id: string;
    name: string;
    email: string;
  };
  implementation_plan: string;
  rollback_plan: string;
  test_plan?: string;
  communication_plan?: string;
  cab_required: boolean;
  approval: ICabApproval;
  schedule: ISchedule;
  linked_problems?: string[];
  linked_incidents?: string[];
  release_id?: string;
  affected_services: string[];
  affected_cis?: string[];
  timeline: ITimelineEvent[];
  attachments: IAttachment[];
  site_id: string;
  tags?: string[];
  reason_for_change: string;
  business_justification?: string;
  created_at: Date;
  updated_at: Date;
  closed_at?: Date;
}

const RequesterSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    department: { type: String, required: true },
  },
  { _id: false }
);

const OwnerSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
  },
  { _id: false }
);

const CabMemberSchema = new Schema(
  {
    member_id: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    decision: {
      type: String,
      enum: Object.values(ApprovalStatus),
      default: ApprovalStatus.PENDING,
    },
    decision_at: { type: Date },
    comments: { type: String },
  },
  { _id: false }
);

const CabApprovalSchema = new Schema<ICabApproval>(
  {
    cab_status: {
      type: String,
      enum: Object.values(ApprovalStatus),
      default: ApprovalStatus.PENDING,
    },
    required_approvers: { type: Number, default: 0 },
    current_approvers: { type: Number, default: 0 },
    members: { type: [CabMemberSchema], default: [] },
    approved_at: { type: Date },
    rejected_at: { type: Date },
    rejection_reason: { type: String },
  },
  { _id: false }
);

const ScheduleSchema = new Schema<ISchedule>(
  {
    planned_start: { type: Date, required: true },
    planned_end: { type: Date, required: true },
    actual_start: { type: Date },
    actual_end: { type: Date },
    maintenance_window: { type: String },
    downtime_minutes: { type: Number, default: 0 },
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

const ChangeSchema = new Schema<IChange>(
  {
    change_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(ChangeType),
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: 5000,
    },
    status: {
      type: String,
      enum: Object.values(ChangeStatus),
      default: ChangeStatus.DRAFT,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(Priority),
      required: true,
      index: true,
    },
    impact: {
      type: String,
      enum: Object.values(Impact),
      required: true,
    },
    risk: {
      type: String,
      enum: Object.values(RiskLevel),
      required: true,
      index: true,
    },
    risk_assessment: {
      type: String,
      required: [true, 'Risk assessment is required'],
      maxlength: 5000,
    },
    requested_by: {
      type: RequesterSchema,
      required: true,
    },
    owner: {
      type: OwnerSchema,
    },
    implementation_plan: {
      type: String,
      required: [true, 'Implementation plan is required'],
      maxlength: 10000,
    },
    rollback_plan: {
      type: String,
      required: [true, 'Rollback plan is required'],
      maxlength: 10000,
    },
    test_plan: {
      type: String,
      maxlength: 10000,
    },
    communication_plan: {
      type: String,
      maxlength: 5000,
    },
    cab_required: {
      type: Boolean,
      default: true,
    },
    approval: {
      type: CabApprovalSchema,
      default: () => ({
        cab_status: ApprovalStatus.PENDING,
        required_approvers: 0,
        current_approvers: 0,
        members: [],
      }),
    },
    schedule: {
      type: ScheduleSchema,
      required: true,
    },
    linked_problems: {
      type: [String],
      default: [],
    },
    linked_incidents: {
      type: [String],
      default: [],
    },
    release_id: {
      type: String,
      index: true,
    },
    affected_services: {
      type: [String],
      required: true,
    },
    affected_cis: {
      type: [String],
      default: [],
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
    tags: {
      type: [String],
      default: [],
    },
    reason_for_change: {
      type: String,
      required: [true, 'Reason for change is required'],
      maxlength: 2000,
    },
    business_justification: {
      type: String,
      maxlength: 5000,
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
ChangeSchema.index({ status: 1, type: 1, created_at: -1 });
ChangeSchema.index({ 'requested_by.id': 1, status: 1 });
ChangeSchema.index({ 'owner.id': 1, status: 1 });
ChangeSchema.index({ 'schedule.planned_start': 1, status: 1 });
ChangeSchema.index({ 'approval.cab_status': 1, status: 1 });
ChangeSchema.index({ site_id: 1, status: 1 });

// Virtual for is emergency
ChangeSchema.virtual('is_emergency').get(function () {
  return this.type === ChangeType.EMERGENCY;
});

// Virtual for is approved
ChangeSchema.virtual('is_approved').get(function () {
  return this.approval.cab_status === ApprovalStatus.APPROVED;
});

// Virtual for approval progress
ChangeSchema.virtual('approval_progress').get(function () {
  if (this.approval.required_approvers === 0) return 100;
  return Math.round((this.approval.current_approvers / this.approval.required_approvers) * 100);
});

// Pre-save middleware
ChangeSchema.pre('save', function (next) {
  if (this.isNew) {
    this.timeline.push({
      event: 'Change Request Created',
      by: this.requested_by.id,
      by_name: this.requested_by.name,
      time: new Date(),
      details: { type: this.type },
    });
  }
  
  // Auto-approve standard changes
  if (this.type === ChangeType.STANDARD && !this.cab_required) {
    this.approval.cab_status = ApprovalStatus.APPROVED;
    this.approval.approved_at = new Date();
  }
  
  next();
});

// Include virtuals in JSON
ChangeSchema.set('toJSON', { virtuals: true });
ChangeSchema.set('toObject', { virtuals: true });

const Change = mongoose.model<IChange>('Change', ChangeSchema);

export default Change;
