import mongoose, { Schema } from 'mongoose';
import {
  WFEntityType,
  WFInstanceStatus,
  WFTimerStatus,
  WFJoinStrategy,
  type IWFInstance,
} from '../../core/types/workflow-engine.types';

// ============================================
// SUB-SCHEMAS
// ============================================

const WFParallelBranchSchema = new Schema(
  {
    branchId: { type: String, required: true },
    stateCode: { type: String, required: true },
    enteredAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    isCompleted: { type: Boolean, default: false },
  },
  { _id: false }
);

const WFActiveTimerSchema = new Schema(
  {
    timerId: { type: String, required: true },
    type: {
      type: String,
      enum: ['sla_warning', 'sla_breach', 'auto_transition', 'escalation', 'scheduled'],
      required: true,
    },
    dueAt: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(WFTimerStatus),
      default: WFTimerStatus.PENDING,
    },
    escalationLevel: { type: Number },
    config: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const WFAssignmentSchema = new Schema(
  {
    userId: { type: String, required: true },
    userName: { type: String },
    assignedAt: { type: Date, default: Date.now },
    assignedBy: { type: String },
    assignmentType: {
      type: String,
      enum: ['user', 'role', 'group', 'auto'],
      default: 'user',
    },
  },
  { _id: false }
);

const WFInstanceSLASchema = new Schema(
  {
    startedAt: { type: Date, required: true },
    responseDue: { type: Date },
    resolutionDue: { type: Date },
    respondedAt: { type: Date },
    resolvedAt: { type: Date },
    breached: { type: Boolean, default: false },
    warningNotified: { type: Boolean, default: false },
    pausedDurationMinutes: { type: Number, default: 0 },
    isPaused: { type: Boolean, default: false },
    pausedAt: { type: Date },
  },
  { _id: false }
);

// ============================================
// MAIN SCHEMA
// ============================================

const WorkflowInstanceSchema = new Schema<IWFInstance>(
  {
    definitionId: {
      type: Schema.Types.ObjectId,
      ref: 'WorkflowDefinition',
      required: true,
    },
    definitionVersion: {
      type: Number,
      required: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'PMOrganization',
      required: true,
    },
    entityType: {
      type: String,
      enum: Object.values(WFEntityType),
      required: true,
    },
    entityId: {
      type: String,
      required: true,
    },
    currentState: {
      type: String,
      required: true,
    },
    previousState: {
      type: String,
    },
    status: {
      type: String,
      enum: Object.values(WFInstanceStatus),
      default: WFInstanceStatus.ACTIVE,
    },
    parallelBranches: {
      type: [WFParallelBranchSchema],
      default: [],
    },
    variables: {
      type: Schema.Types.Mixed,
      default: {},
    },
    assignment: {
      type: WFAssignmentSchema,
    },
    sla: {
      type: WFInstanceSLASchema,
    },
    timers: {
      type: [WFActiveTimerSchema],
      default: [],
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    startedBy: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
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

// ============================================
// INDEXES
// ============================================

WorkflowInstanceSchema.index({ definitionId: 1, status: 1 });
WorkflowInstanceSchema.index({ organizationId: 1, status: 1 });
WorkflowInstanceSchema.index({ entityType: 1, entityId: 1 });
WorkflowInstanceSchema.index({ currentState: 1, status: 1 });
WorkflowInstanceSchema.index({ 'assignment.userId': 1, status: 1 });
WorkflowInstanceSchema.index({ 'timers.dueAt': 1, 'timers.status': 1 });
WorkflowInstanceSchema.index({ startedAt: -1 });
WorkflowInstanceSchema.index({ organizationId: 1, entityType: 1, status: 1 });

// ============================================
// EXPORT
// ============================================

const WorkflowInstance = mongoose.model<IWFInstance>('WorkflowInstance', WorkflowInstanceSchema);

export default WorkflowInstance;
