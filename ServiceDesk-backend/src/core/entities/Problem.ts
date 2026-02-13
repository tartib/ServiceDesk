import mongoose, { Document, Schema } from 'mongoose';
import {
  ProblemStatus,
  Priority,
  Impact,
  ITimelineEvent,
  IAttachment,
  IKnownError,
} from '../types/itsm.types';

export interface IProblem extends Document {
  problem_id: string;
  title: string;
  description: string;
  status: ProblemStatus;
  priority: Priority;
  impact: Impact;
  category_id: string;
  subcategory_id?: string;
  root_cause?: string;
  workaround?: string;
  permanent_fix?: string;
  linked_incidents: string[];
  linked_changes?: string[];
  owner: {
    id: string;
    name: string;
    email: string;
  };
  assigned_group?: {
    group_id: string;
    group_name: string;
  };
  known_error?: IKnownError;
  timeline: ITimelineEvent[];
  attachments: IAttachment[];
  site_id: string;
  tags?: string[];
  affected_services?: string[];
  affected_users_count?: number;
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

const AssignedGroupSchema = new Schema(
  {
    group_id: { type: String, required: true },
    group_name: { type: String, required: true },
  },
  { _id: false }
);

const KnownErrorSchema = new Schema<IKnownError>(
  {
    ke_id: { type: String, required: true },
    title: { type: String, required: true },
    symptoms: { type: String, required: true },
    root_cause: { type: String, required: true },
    workaround: { type: String, required: true },
    documented_at: { type: Date, required: true },
    documented_by: { type: String, required: true },
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

const ProblemSchema = new Schema<IProblem>(
  {
    problem_id: {
      type: String,
      required: true,
      unique: true,
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
      enum: Object.values(ProblemStatus),
      default: ProblemStatus.LOGGED,
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
    category_id: {
      type: String,
      required: true,
      index: true,
    },
    subcategory_id: {
      type: String,
      index: true,
    },
    root_cause: {
      type: String,
      maxlength: 5000,
    },
    workaround: {
      type: String,
      maxlength: 5000,
    },
    permanent_fix: {
      type: String,
      maxlength: 5000,
    },
    linked_incidents: {
      type: [String],
      default: [],
      index: true,
    },
    linked_changes: {
      type: [String],
      default: [],
    },
    owner: {
      type: OwnerSchema,
      required: true,
    },
    assigned_group: {
      type: AssignedGroupSchema,
    },
    known_error: {
      type: KnownErrorSchema,
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
    affected_services: {
      type: [String],
      default: [],
    },
    affected_users_count: {
      type: Number,
      default: 0,
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
ProblemSchema.index({ status: 1, priority: 1, created_at: -1 });
ProblemSchema.index({ 'owner.id': 1, status: 1 });
ProblemSchema.index({ category_id: 1, status: 1 });
ProblemSchema.index({ site_id: 1, status: 1 });

// Virtual for linked incidents count
ProblemSchema.virtual('linked_incidents_count').get(function () {
  return this.linked_incidents.length;
});

// Virtual for is known error
ProblemSchema.virtual('is_known_error').get(function () {
  return this.status === ProblemStatus.KNOWN_ERROR && !!this.known_error;
});

// Pre-save middleware
ProblemSchema.pre('save', function (next) {
  if (this.isNew) {
    this.timeline.push({
      event: 'Problem Logged',
      by: this.owner.id,
      by_name: this.owner.name,
      time: new Date(),
    });
  }
  next();
});

// Include virtuals in JSON
ProblemSchema.set('toJSON', { virtuals: true });
ProblemSchema.set('toObject', { virtuals: true });

const Problem = mongoose.model<IProblem>('Problem', ProblemSchema);

export default Problem;
