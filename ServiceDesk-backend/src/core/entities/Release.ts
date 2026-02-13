import mongoose, { Document, Schema } from 'mongoose';
import {
  ReleaseStatus,
  Priority,
  ITimelineEvent,
  IAttachment,
} from '../types/itsm.types';

export interface IRelease extends Document {
  release_id: string;
  name: string;
  version: string;
  description: string;
  status: ReleaseStatus;
  priority: Priority;
  type: 'major' | 'minor' | 'patch' | 'hotfix';
  owner: {
    id: string;
    name: string;
    email: string;
  };
  linked_changes: string[];
  deployment: {
    planned_date: Date;
    actual_date?: Date;
    environment: 'development' | 'staging' | 'production';
    deployment_window: string;
    rollback_validated: boolean;
  };
  testing: {
    test_plan?: string;
    test_results?: string;
    tested_by?: string;
    tested_at?: Date;
    passed: boolean;
  };
  approval: {
    status: 'pending' | 'approved' | 'rejected';
    approved_by?: string;
    approved_at?: Date;
    comments?: string;
  };
  affected_services: string[];
  release_notes?: string;
  timeline: ITimelineEvent[];
  attachments: IAttachment[];
  site_id: string;
  created_at: Date;
  updated_at: Date;
  closed_at?: Date;
}

const OwnerSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
  },
  { _id: false }
);

const DeploymentSchema = new Schema(
  {
    planned_date: { type: Date, required: true },
    actual_date: { type: Date },
    environment: {
      type: String,
      enum: ['development', 'staging', 'production'],
      required: true,
    },
    deployment_window: { type: String, required: true },
    rollback_validated: { type: Boolean, default: false },
  },
  { _id: false }
);

const TestingSchema = new Schema(
  {
    test_plan: { type: String },
    test_results: { type: String },
    tested_by: { type: String },
    tested_at: { type: Date },
    passed: { type: Boolean, default: false },
  },
  { _id: false }
);

const ApprovalSchema = new Schema(
  {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    approved_by: { type: String },
    approved_at: { type: Date },
    comments: { type: String },
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

const ReleaseSchema = new Schema<IRelease>(
  {
    release_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Release name is required'],
      trim: true,
      maxlength: 100,
    },
    version: {
      type: String,
      required: [true, 'Version is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: 5000,
    },
    status: {
      type: String,
      enum: Object.values(ReleaseStatus),
      default: ReleaseStatus.PLANNING,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(Priority),
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['major', 'minor', 'patch', 'hotfix'],
      required: true,
      index: true,
    },
    owner: {
      type: OwnerSchema,
      required: true,
    },
    linked_changes: {
      type: [String],
      default: [],
      index: true,
    },
    deployment: {
      type: DeploymentSchema,
      required: true,
    },
    testing: {
      type: TestingSchema,
      default: () => ({
        passed: false,
      }),
    },
    approval: {
      type: ApprovalSchema,
      default: () => ({
        status: 'pending',
      }),
    },
    affected_services: {
      type: [String],
      default: [],
    },
    release_notes: {
      type: String,
      maxlength: 10000,
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
ReleaseSchema.index({ status: 1, 'deployment.planned_date': 1 });
ReleaseSchema.index({ 'owner.id': 1, status: 1 });
ReleaseSchema.index({ type: 1, status: 1 });

// Virtual for is ready to deploy
ReleaseSchema.virtual('is_ready_to_deploy').get(function () {
  return (
    this.status === ReleaseStatus.APPROVED &&
    this.testing.passed &&
    this.approval.status === 'approved' &&
    this.deployment.rollback_validated
  );
});

// Virtual for linked changes count
ReleaseSchema.virtual('linked_changes_count').get(function () {
  return this.linked_changes.length;
});

// Pre-save middleware
ReleaseSchema.pre('save', function (next) {
  if (this.isNew) {
    this.timeline.push({
      event: 'Release Created',
      by: this.owner.id,
      by_name: this.owner.name,
      time: new Date(),
      details: { version: this.version, type: this.type },
    });
  }
  next();
});

// Include virtuals in JSON
ReleaseSchema.set('toJSON', { virtuals: true });
ReleaseSchema.set('toObject', { virtuals: true });

const Release = mongoose.model<IRelease>('Release', ReleaseSchema);

export default Release;
