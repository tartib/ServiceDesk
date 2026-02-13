import mongoose, { Schema } from 'mongoose';

export enum PMTaskType {
  EPIC = 'epic',
  STORY = 'story',
  TASK = 'task',
  BUG = 'bug',
  SUBTASK = 'subtask',
  CHANGE_REQUEST = 'change_request'
}

export enum PMTaskPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum PMStatusCategory {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done'
}

export interface IPMTask {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  key: string;
  number: number;
  type: PMTaskType;
  title: string;
  description?: string;
  status: {
    id: string;
    name: string;
    category: PMStatusCategory;
  };
  priority: PMTaskPriority;
  assignee?: mongoose.Types.ObjectId;
  reporter: mongoose.Types.ObjectId;
  labels: string[];
  components: string[];
  storyPoints?: number;
  originalEstimate?: number;
  remainingEstimate?: number;
  timeSpent?: number;
  parentId?: mongoose.Types.ObjectId;
  epicId?: mongoose.Types.ObjectId;
  subtasks: mongoose.Types.ObjectId[];
  watchers: mongoose.Types.ObjectId[];
  sprintId?: mongoose.Types.ObjectId;
  swimlane?: string;
  boardColumn?: string;
  columnOrder?: number;
  itil?: {
    changeType?: 'standard' | 'normal' | 'emergency';
    riskLevel?: 'low' | 'medium' | 'high' | 'critical';
    impactLevel?: 'low' | 'medium' | 'high' | 'critical';
    cabApproval?: boolean;
    cabApprovalDate?: Date;
    implementationPlan?: string;
    rollbackPlan?: string;
    scheduledStart?: Date;
    scheduledEnd?: Date;
  };
  waterfall?: {
    phase?: string;
    milestone?: mongoose.Types.ObjectId;
    deliverable?: boolean;
    gateReview?: boolean;
  };
  okr?: {
    objectiveId?: mongoose.Types.ObjectId;
    keyResultId?: mongoose.Types.ObjectId;
    contribution?: number;
  };
  dueDate?: Date;
  startDate?: Date;
  completedAt?: Date;
  attachments: {
    name: string;
    url: string;
    size: number;
    mimeType: string;
    uploadedBy: mongoose.Types.ObjectId;
    uploadedAt: Date;
  }[];
  workflowHistory: {
    fromStatus: string;
    toStatus: string;
    changedBy: mongoose.Types.ObjectId;
    changedAt: Date;
    comment?: string;
  }[];
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<IPMTask>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'PMProject',
      required: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'PMOrganization',
      required: true,
    },
    key: {
      type: String,
      required: true,
    },
    number: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(PMTaskType),
      required: true,
      default: PMTaskType.TASK,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    description: {
      type: String,
      maxlength: 50000,
    },
    status: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      category: {
        type: String,
        enum: Object.values(PMStatusCategory),
        required: true,
      },
    },
    priority: {
      type: String,
      enum: Object.values(PMTaskPriority),
      default: PMTaskPriority.MEDIUM,
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reporter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    labels: [{ type: String }],
    components: [{ type: String }],
    storyPoints: { type: Number },
    originalEstimate: { type: Number },
    remainingEstimate: { type: Number },
    timeSpent: { type: Number, default: 0 },
    parentId: { type: Schema.Types.ObjectId, ref: 'PMTask' },
    epicId: { type: Schema.Types.ObjectId, ref: 'PMTask' },
    subtasks: [{ type: Schema.Types.ObjectId, ref: 'PMTask' }],
    watchers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    sprintId: { type: Schema.Types.ObjectId, ref: 'PMSprint' },
    swimlane: { type: String },
    boardColumn: { type: String },
    columnOrder: { type: Number, default: 0 },
    itil: {
      changeType: { type: String, enum: ['standard', 'normal', 'emergency'] },
      riskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
      impactLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
      cabApproval: { type: Boolean },
      cabApprovalDate: { type: Date },
      implementationPlan: { type: String },
      rollbackPlan: { type: String },
      scheduledStart: { type: Date },
      scheduledEnd: { type: Date },
    },
    waterfall: {
      phase: { type: String },
      milestone: { type: Schema.Types.ObjectId, ref: 'Milestone' },
      deliverable: { type: Boolean },
      gateReview: { type: Boolean },
    },
    okr: {
      objectiveId: { type: Schema.Types.ObjectId },
      keyResultId: { type: Schema.Types.ObjectId },
      contribution: { type: Number },
    },
    dueDate: { type: Date },
    startDate: { type: Date },
    completedAt: { type: Date },
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        size: { type: Number },
        mimeType: { type: String },
        uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    workflowHistory: [
      {
        fromStatus: { type: String },
        toStatus: { type: String, required: true },
        changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        changedAt: { type: Date, default: Date.now },
        comment: { type: String },
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.__v = undefined;
        return ret;
      },
    },
  }
);

TaskSchema.index({ projectId: 1, number: 1 }, { unique: true });
TaskSchema.index({ projectId: 1, key: 1 }, { unique: true });
TaskSchema.index({ organizationId: 1 });
TaskSchema.index({ assignee: 1 });
TaskSchema.index({ sprintId: 1 });
TaskSchema.index({ 'status.category': 1 });
TaskSchema.index({ type: 1 });
TaskSchema.index({ parentId: 1 });
TaskSchema.index({ epicId: 1 });
TaskSchema.index({ labels: 1 });
TaskSchema.index({ projectId: 1, 'status.id': 1 });

const PMTask = mongoose.model<IPMTask>('PMTask', TaskSchema);

export default PMTask;
