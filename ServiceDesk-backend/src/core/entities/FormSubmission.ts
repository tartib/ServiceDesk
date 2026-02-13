/**
 * Form Submission Model - نموذج تقديم النموذج
 * Smart Forms System
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  IFormSubmission,
  IAttachment,
  SubmissionStatus,
} from '../types/smart-forms.types';

// ============================================
// SUB-SCHEMAS - المخططات الفرعية
// ============================================

const SubmitterSchema = new Schema({
  user_id: { type: String, required: true },
  name: { type: String, required: true },
  email: String,
  department: String,
  site_id: String,
}, { _id: false });

const AttachmentSchema = new Schema({
  attachment_id: { type: String, required: true },
  file_name: { type: String, required: true },
  file_type: { type: String, required: true },
  file_size: { type: Number, required: true },
  file_url: { type: String, required: true },
  uploaded_by: { type: String, required: true },
  uploaded_at: { type: Date, default: Date.now },
}, { _id: false });

const SignatureDataSchema = new Schema({
  data: { type: String, required: true },
  signed_at: { type: Date, required: true },
  ip_address: { type: String, required: true },
}, { _id: false });

const GeolocationDataSchema = new Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  accuracy: { type: Number, required: true },
  captured_at: { type: Date, required: true },
}, { _id: false });

const AssigneeSchema = new Schema({
  user_id: { type: String, required: true },
  name: { type: String, required: true },
  email: String,
  assigned_at: { type: Date, default: Date.now },
  assigned_by: String,
}, { _id: false });

const ApprovalRecordSchema = new Schema({
  step: { type: Number, required: true },
  approver_id: { type: String, required: true },
  approver_name: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'delegated', 'skipped'],
    default: 'pending',
  },
  decision_at: Date,
  comments: String,
  delegated_to: String,
  delegated_by: String,
  delegated_from: String,
}, { _id: false });

const SLAStateSchema = new Schema({
  sla_id: { type: String, required: true },
  started_at: { type: Date, required: true },
  response_due: { type: Date, required: true },
  resolution_due: { type: Date, required: true },
  response_at: Date,
  resolved_at: Date,
  breach_flag: { type: Boolean, default: false },
  paused_duration_minutes: { type: Number, default: 0 },
  is_paused: { type: Boolean, default: false },
  paused_at: Date,
}, { _id: false });

const WorkflowStateSchema = new Schema({
  current_step_id: { type: String, default: '' },
  status: {
    type: String,
    enum: Object.values(SubmissionStatus),
    default: SubmissionStatus.DRAFT,
  },
  assigned_to: AssigneeSchema,
  approvals: [ApprovalRecordSchema],
  sla: SLAStateSchema,
}, { _id: false });

const TimelineEventSchema = new Schema({
  event_id: { type: String, required: true },
  type: { type: String, required: true },
  description: { type: String, required: true },
  description_ar: String,
  user_id: String,
  user_name: String,
  data: Schema.Types.Mixed,
  created_at: { type: Date, default: Date.now },
}, { _id: false });

const CommentSchema = new Schema({
  comment_id: { type: String, required: true },
  content: { type: String, required: true },
  user_id: { type: String, required: true },
  user_name: { type: String, required: true },
  is_internal: { type: Boolean, default: false },
  attachments: [AttachmentSchema],
  created_at: { type: Date, default: Date.now },
  updated_at: Date,
}, { _id: false });

const ActivityStateSchema = new Schema({
  activity_id: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'skipped'],
    default: 'pending',
  },
  completed_at: Date,
  completed_by: String,
  data: Schema.Types.Mixed,
}, { _id: false });

// ============================================
// MAIN SCHEMA - المخطط الرئيسي
// ============================================

export interface IFormSubmissionDocument extends Omit<IFormSubmission, '_id'>, Document {
  generateSubmissionId(): Promise<string>;
  addTimelineEvent(
    type: string,
    description: string,
    descriptionAr?: string,
    userId?: string,
    userName?: string,
    data?: Record<string, any>
  ): void;
  addComment(
    content: string,
    userId: string,
    userName: string,
    isInternal?: boolean,
    attachments?: IAttachment[]
  ): void;
}

interface IFormSubmissionModel extends Model<IFormSubmissionDocument> {
  findBySubmissionId(submissionId: string): Promise<IFormSubmissionDocument | null>;
  findByFormTemplate(formTemplateId: string): Promise<IFormSubmissionDocument[]>;
  findBySubmitter(userId: string): Promise<IFormSubmissionDocument[]>;
  findByAssignee(userId: string): Promise<IFormSubmissionDocument[]>;
  findByStatus(status: SubmissionStatus): Promise<IFormSubmissionDocument[]>;
  findPendingApproval(userId: string): Promise<IFormSubmissionDocument[]>;
}

const FormSubmissionSchema = new Schema<IFormSubmissionDocument>(
  {
    submission_id: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    form_template_id: {
      type: String,
      required: true,
      index: true,
    },
    form_version: {
      type: Number,
      required: true,
    },
    submitted_by: {
      type: SubmitterSchema,
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    attachments: {
      type: [AttachmentSchema],
      default: [],
    },
    signature: SignatureDataSchema,
    geolocation: GeolocationDataSchema,
    workflow_state: {
      type: WorkflowStateSchema,
      required: true,
    },
    timeline: {
      type: [TimelineEventSchema],
      default: [],
    },
    comments: {
      type: [CommentSchema],
      default: [],
    },
    activities: {
      type: [ActivityStateSchema],
      default: [],
    },
    linked_submissions: [String],
    parent_submission_id: String,
    site_id: {
      type: String,
      index: true,
    },
    completed_at: Date,
    cancelled_at: Date,
    rejected_at: Date,
    rejection_reason: String,
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================
// INDEXES - الفهارس
// ============================================

FormSubmissionSchema.index({ form_template_id: 1, 'workflow_state.status': 1 });
FormSubmissionSchema.index({ 'submitted_by.user_id': 1, created_at: -1 });
FormSubmissionSchema.index({ 'workflow_state.assigned_to.user_id': 1, 'workflow_state.status': 1 });
FormSubmissionSchema.index({ 'workflow_state.status': 1, created_at: -1 });
FormSubmissionSchema.index({ 'workflow_state.approvals.approver_id': 1, 'workflow_state.approvals.status': 1 });
FormSubmissionSchema.index({ site_id: 1, 'workflow_state.status': 1 });
FormSubmissionSchema.index({ 'workflow_state.sla.resolution_due': 1, 'workflow_state.sla.breach_flag': 1 });

// ============================================
// METHODS - الدوال
// ============================================

FormSubmissionSchema.methods.generateSubmissionId = async function(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await FormSubmission.countDocuments({
    submission_id: { $regex: `^SUB-${year}-` }
  });
  return `SUB-${year}-${String(count + 1).padStart(6, '0')}`;
};

FormSubmissionSchema.methods.addTimelineEvent = function(
  type: string,
  description: string,
  descriptionAr?: string,
  userId?: string,
  userName?: string,
  data?: Record<string, any>
): void {
  const eventId = `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  this.timeline.push({
    event_id: eventId,
    type,
    description,
    description_ar: descriptionAr,
    user_id: userId,
    user_name: userName,
    data,
    created_at: new Date(),
  });
};

FormSubmissionSchema.methods.addComment = function(
  content: string,
  userId: string,
  userName: string,
  isInternal: boolean = false,
  attachments?: IAttachment[]
): void {
  const commentId = `CMT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  this.comments.push({
    comment_id: commentId,
    content,
    user_id: userId,
    user_name: userName,
    is_internal: isInternal,
    attachments: attachments || [],
    created_at: new Date(),
  });
};

// ============================================
// STATICS - الدوال الثابتة
// ============================================

FormSubmissionSchema.statics.findBySubmissionId = function(submissionId: string) {
  return this.findOne({ submission_id: submissionId });
};

FormSubmissionSchema.statics.findByFormTemplate = function(formTemplateId: string) {
  return this.find({ form_template_id: formTemplateId }).sort({ created_at: -1 });
};

FormSubmissionSchema.statics.findBySubmitter = function(userId: string) {
  return this.find({ 'submitted_by.user_id': userId }).sort({ created_at: -1 });
};

FormSubmissionSchema.statics.findByAssignee = function(userId: string) {
  return this.find({
    'workflow_state.assigned_to.user_id': userId,
    'workflow_state.status': { $nin: [SubmissionStatus.COMPLETED, SubmissionStatus.CANCELLED] }
  }).sort({ created_at: -1 });
};

FormSubmissionSchema.statics.findByStatus = function(status: SubmissionStatus) {
  return this.find({ 'workflow_state.status': status }).sort({ created_at: -1 });
};

FormSubmissionSchema.statics.findPendingApproval = function(userId: string) {
  return this.find({
    'workflow_state.approvals': {
      $elemMatch: {
        approver_id: userId,
        status: 'pending'
      }
    }
  }).sort({ created_at: -1 });
};

// ============================================
// HOOKS - الخطافات
// ============================================

FormSubmissionSchema.pre('save', async function(next) {
  if (this.isNew && !this.submission_id) {
    this.submission_id = await this.generateSubmissionId();
  }
  
  // Add timeline event for status changes
  if (this.isModified('workflow_state.status') && !this.isNew) {
    this.addTimelineEvent(
      'status_change',
      `Status changed to ${this.workflow_state.status}`,
      `تم تغيير الحالة إلى ${this.workflow_state.status}`
    );
  }
  
  next();
});

// ============================================
// VIRTUALS - الحقول الافتراضية
// ============================================

FormSubmissionSchema.virtual('status').get(function() {
  return this.workflow_state?.status;
});

FormSubmissionSchema.virtual('is_draft').get(function() {
  return this.workflow_state?.status === SubmissionStatus.DRAFT;
});

FormSubmissionSchema.virtual('is_completed').get(function() {
  return this.workflow_state?.status === SubmissionStatus.COMPLETED;
});

FormSubmissionSchema.virtual('is_cancelled').get(function() {
  return this.workflow_state?.status === SubmissionStatus.CANCELLED;
});

FormSubmissionSchema.virtual('is_pending_approval').get(function() {
  return this.workflow_state?.status === SubmissionStatus.PENDING_APPROVAL;
});

FormSubmissionSchema.virtual('sla_breached').get(function() {
  return this.workflow_state?.sla?.breach_flag || false;
});

FormSubmissionSchema.virtual('time_to_resolution').get(function() {
  if (!this.workflow_state?.sla?.resolution_due) return null;
  
  const now = new Date();
  const due = new Date(this.workflow_state.sla.resolution_due);
  const diffMs = due.getTime() - now.getTime();
  
  return {
    hours: Math.floor(diffMs / (1000 * 60 * 60)),
    minutes: Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)),
    is_overdue: diffMs < 0,
  };
});

FormSubmissionSchema.virtual('attachment_count').get(function() {
  return this.attachments?.length || 0;
});

FormSubmissionSchema.virtual('comment_count').get(function() {
  return this.comments?.length || 0;
});

FormSubmissionSchema.virtual('pending_approvals').get(function() {
  return this.workflow_state?.approvals?.filter(a => a.status === 'pending') || [];
});

FormSubmissionSchema.virtual('completed_approvals').get(function() {
  return this.workflow_state?.approvals?.filter(a => 
    a.status === 'approved' || a.status === 'rejected'
  ) || [];
});

// ============================================
// EXPORT - التصدير
// ============================================

export const FormSubmission = mongoose.model<IFormSubmissionDocument, IFormSubmissionModel>(
  'FormSubmission',
  FormSubmissionSchema
);

export default FormSubmission;
