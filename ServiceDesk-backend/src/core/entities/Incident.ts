import mongoose, { Document, Schema } from 'mongoose';
import {
  IncidentStatus,
  Priority,
  Impact,
  Urgency,
  Channel,
  IRequester,
  IAssignee,
  ISLAConfig,
  IWorklog,
  IAttachment,
  ITimelineEvent,
  IResolution,
} from '../types/itsm.types';

export interface IIncident extends Document {
  incident_id: string;
  title: string;
  description: string;
  status: IncidentStatus;
  priority: Priority;
  impact: Impact;
  urgency: Urgency;
  category_id: string;
  subcategory_id?: string;
  requester: IRequester;
  channel: Channel;
  assigned_to?: IAssignee;
  sla: ISLAConfig;
  worklogs: IWorklog[];
  attachments: IAttachment[];
  timeline: ITimelineEvent[];
  linked_problem_id?: string;
  linked_change_id?: string;
  linked_incidents?: string[];
  resolution?: IResolution;
  site_id: string;
  tags?: string[];
  is_major: boolean;
  reopen_count: number;
  first_response_at?: Date;
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

const AssigneeSchema = new Schema<IAssignee>(
  {
    technician_id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    group_id: { type: String },
    group_name: { type: String },
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

const WorklogSchema = new Schema<IWorklog>(
  {
    log_id: { type: String, required: true },
    by: { type: String, required: true },
    by_name: { type: String, required: true },
    minutes_spent: { type: Number, required: true, min: 0 },
    note: { type: String, required: true },
    is_internal: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
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

const ResolutionSchema = new Schema<IResolution>(
  {
    code: { type: String, required: true },
    notes: { type: String, required: true },
    resolved_by: { type: String, required: true },
    resolved_by_name: { type: String, required: true },
    resolved_at: { type: Date, required: true },
  },
  { _id: false }
);

const IncidentSchema = new Schema<IIncident>(
  {
    incident_id: {
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
      enum: Object.values(IncidentStatus),
      default: IncidentStatus.OPEN,
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
    urgency: {
      type: String,
      enum: Object.values(Urgency),
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
    requester: {
      type: RequesterSchema,
      required: true,
    },
    channel: {
      type: String,
      enum: Object.values(Channel),
      required: true,
    },
    assigned_to: {
      type: AssigneeSchema,
    },
    sla: {
      type: SLAConfigSchema,
      required: true,
    },
    worklogs: {
      type: [WorklogSchema],
      default: [],
    },
    attachments: {
      type: [AttachmentSchema],
      default: [],
    },
    timeline: {
      type: [TimelineEventSchema],
      default: [],
    },
    linked_problem_id: {
      type: String,
      index: true,
    },
    linked_change_id: {
      type: String,
      index: true,
    },
    linked_incidents: {
      type: [String],
      default: [],
    },
    resolution: {
      type: ResolutionSchema,
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
    is_major: {
      type: Boolean,
      default: false,
      index: true,
    },
    reopen_count: {
      type: Number,
      default: 0,
    },
    first_response_at: {
      type: Date,
    },
    closed_at: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Compound indexes for efficient queries
IncidentSchema.index({ status: 1, priority: 1, created_at: -1 });
IncidentSchema.index({ 'assigned_to.technician_id': 1, status: 1 });
IncidentSchema.index({ 'requester.id': 1, created_at: -1 });
IncidentSchema.index({ 'sla.breach_flag': 1, status: 1 });
IncidentSchema.index({ 'sla.response_due': 1, status: 1 });
IncidentSchema.index({ 'sla.resolution_due': 1, status: 1 });
IncidentSchema.index({ category_id: 1, status: 1 });
IncidentSchema.index({ site_id: 1, status: 1, created_at: -1 });

// Virtual for checking if SLA is breached
IncidentSchema.virtual('is_sla_breached').get(function () {
  if (this.status === IncidentStatus.CLOSED || this.status === IncidentStatus.RESOLVED) {
    return this.sla.breach_flag;
  }
  const now = new Date();
  return now > this.sla.resolution_due;
});

// Virtual for time to breach
IncidentSchema.virtual('time_to_breach_minutes').get(function () {
  if (this.status === IncidentStatus.CLOSED || this.status === IncidentStatus.RESOLVED) {
    return null;
  }
  const now = new Date();
  const diff = this.sla.resolution_due.getTime() - now.getTime();
  return Math.floor(diff / (1000 * 60));
});

// Virtual for total worklog time
IncidentSchema.virtual('total_worklog_minutes').get(function () {
  return this.worklogs.reduce((sum, log) => sum + log.minutes_spent, 0);
});

// Pre-save middleware to add timeline event
IncidentSchema.pre('save', function (next) {
  if (this.isNew) {
    this.timeline.push({
      event: 'Incident Created',
      by: this.requester.id,
      by_name: this.requester.name,
      time: new Date(),
      details: { channel: this.channel },
    });
  }
  next();
});

// Include virtuals in JSON
IncidentSchema.set('toJSON', { virtuals: true });
IncidentSchema.set('toObject', { virtuals: true });

const Incident = mongoose.model<IIncident>('Incident', IncidentSchema);

export default Incident;
