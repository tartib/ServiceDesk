import mongoose, { Schema } from 'mongoose';
import {
  WFEntityType,
  WFStateType,
  WFStateCategory,
  WFGuardType,
  WFGuardOperator,
  WFActionType,
  WFTriggerType,
  WFDefinitionStatus,
  WFJoinStrategy,
  type IWFDefinition,
} from '../../core/types/workflow-engine.types';

// ============================================
// SUB-SCHEMAS
// ============================================

const WFGuardSchema = new Schema(
  {
    guardId: { type: String, required: true },
    type: { type: String, enum: Object.values(WFGuardType), required: true },
    config: {
      roles: [{ type: String }],
      fieldPath: { type: String },
      operator: { type: String, enum: Object.values(WFGuardOperator) },
      value: { type: Schema.Types.Mixed },
      expression: { type: String },
      afterHours: { type: Number },
      beforeHours: { type: Number },
      workingHoursOnly: { type: Boolean },
      functionName: { type: String },
      params: { type: Schema.Types.Mixed },
    },
    errorMessage: { type: String },
    errorMessageAr: { type: String },
  },
  { _id: false }
);

const WFValidatorSchema = new Schema(
  {
    validatorId: { type: String, required: true },
    type: { type: String, enum: ['required_field', 'field_value', 'expression', 'custom'], required: true },
    config: {
      fieldPath: { type: String },
      operator: { type: String, enum: Object.values(WFGuardOperator) },
      value: { type: Schema.Types.Mixed },
      expression: { type: String },
      functionName: { type: String },
    },
    errorMessage: { type: String, required: true },
    errorMessageAr: { type: String },
  },
  { _id: false }
);

const WFActionSchema = new Schema(
  {
    actionId: { type: String, required: true },
    type: { type: String, enum: Object.values(WFActionType), required: true },
    config: { type: Schema.Types.Mixed, default: {} },
    order: { type: Number, default: 0 },
    condition: { type: WFGuardSchema },
    retryOnFailure: { type: Boolean, default: false },
    maxRetries: { type: Number, default: 0 },
    continueOnError: { type: Boolean, default: false },
  },
  { _id: false }
);

const WFTransitionUISchema = new Schema(
  {
    buttonLabel: { type: String, required: true },
    buttonLabelAr: { type: String },
    buttonColor: { type: String },
    buttonIcon: { type: String },
    confirmationRequired: { type: Boolean, default: false },
    confirmationMessage: { type: String },
    confirmationMessageAr: { type: String },
    requireComment: { type: Boolean, default: false },
    requireSignature: { type: Boolean, default: false },
    formFields: [{ type: String }],
  },
  { _id: false }
);

const WFEscalationRuleSchema = new Schema(
  {
    ruleId: { type: String, required: true },
    trigger: {
      type: { type: String, enum: ['time', 'condition'], required: true },
      afterHours: { type: Number },
      afterPercent: { type: Number },
      condition: { type: WFGuardSchema },
    },
    action: {
      type: { type: String, enum: ['notify', 'reassign', 'escalate_to_manager', 'auto_transition'], required: true },
      targetUserId: { type: String },
      targetRole: { type: String },
      transitionId: { type: String },
      notificationTemplate: { type: String },
    },
    repeat: { type: Boolean, default: false },
    repeatIntervalHours: { type: Number },
    maxEscalations: { type: Number },
  },
  { _id: false }
);

const WFStateSLASchema = new Schema(
  {
    responseHours: { type: Number },
    resolutionHours: { type: Number },
    warningPercent: { type: Number, default: 80 },
    workingHoursOnly: { type: Boolean, default: false },
    escalationRules: { type: [WFEscalationRuleSchema], default: [] },
  },
  { _id: false }
);

// ============================================
// STATE DEFINITION SUB-SCHEMA
// ============================================

const WFStateDefinitionSchema = new Schema(
  {
    code: { type: String, required: true },
    name: { type: String, required: true },
    nameAr: { type: String },
    description: { type: String },
    type: { type: String, enum: Object.values(WFStateType), default: WFStateType.NORMAL },
    category: { type: String, enum: Object.values(WFStateCategory), required: true },
    color: { type: String, default: '#6B7280' },
    order: { type: Number, required: true },
    onEnter: { type: [WFActionSchema], default: [] },
    onExit: { type: [WFActionSchema], default: [] },
    sla: { type: WFStateSLASchema },
    requiredFields: [{ type: String }],
    metadata: { type: Schema.Types.Mixed },
    parallelBranches: [{ type: String }],
    joinStrategy: { type: String, enum: Object.values(WFJoinStrategy) },
    joinCount: { type: Number },
    position: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
    },
  },
  { _id: false }
);

// ============================================
// TRANSITION DEFINITION SUB-SCHEMA
// ============================================

const WFTransitionDefinitionSchema = new Schema(
  {
    transitionId: { type: String, required: true },
    name: { type: String, required: true },
    nameAr: { type: String },
    description: { type: String },
    fromState: { type: String, required: true },
    toState: { type: String, required: true },
    trigger: { type: String, enum: Object.values(WFTriggerType), default: WFTriggerType.MANUAL },
    guards: { type: [WFGuardSchema], default: [] },
    validators: { type: [WFValidatorSchema], default: [] },
    actions: { type: [WFActionSchema], default: [] },
    onTransition: { type: [WFActionSchema], default: [] },
    ui: { type: WFTransitionUISchema, required: true },
    priority: { type: Number, default: 0 },
  },
  { _id: false }
);

// ============================================
// MAIN SCHEMA
// ============================================

const WorkflowDefinitionSchema = new Schema<IWFDefinition>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'PMOrganization',
      required: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'PMProject',
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    nameAr: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 2000,
    },
    descriptionAr: {
      type: String,
      maxlength: 2000,
    },
    entityType: {
      type: String,
      enum: Object.values(WFEntityType),
      required: true,
    },
    version: {
      type: Number,
      default: 1,
      min: 1,
    },
    isLatest: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: Object.values(WFDefinitionStatus),
      default: WFDefinitionStatus.DRAFT,
    },
    publishedAt: {
      type: Date,
    },
    states: {
      type: [WFStateDefinitionSchema],
      default: [],
      validate: {
        validator: function (states: any[]) {
          return states && states.length >= 2;
        },
        message: 'Workflow must have at least 2 states',
      },
    },
    transitions: {
      type: [WFTransitionDefinitionSchema],
      default: [],
    },
    initialState: {
      type: String,
      required: true,
    },
    finalStates: {
      type: [String],
      validate: {
        validator: function (finals: string[]) {
          return finals && finals.length >= 1;
        },
        message: 'Workflow must have at least 1 final state',
      },
    },
    settings: {
      allowParallelSteps: { type: Boolean, default: false },
      requireCommentsOnReject: { type: Boolean, default: true },
      enableDelegation: { type: Boolean, default: false },
      maxDelegationDepth: { type: Number, default: 2 },
      autoCloseAfterDays: { type: Number },
      trackSLA: { type: Boolean, default: false },
      enableTimers: { type: Boolean, default: false },
      enableWebhooks: { type: Boolean, default: false },
    },
    tags: [{ type: String }],
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

// ============================================
// INDEXES
// ============================================

WorkflowDefinitionSchema.index({ organizationId: 1, entityType: 1, status: 1 });
WorkflowDefinitionSchema.index({ organizationId: 1, name: 1, version: 1 }, { unique: true });
WorkflowDefinitionSchema.index({ organizationId: 1, isLatest: 1 });
WorkflowDefinitionSchema.index({ projectId: 1, entityType: 1 });
WorkflowDefinitionSchema.index({ status: 1 });
WorkflowDefinitionSchema.index({ tags: 1 });

// ============================================
// METHODS
// ============================================

WorkflowDefinitionSchema.methods.getState = function (code: string) {
  return this.states.find((s: any) => s.code === code) || null;
};

WorkflowDefinitionSchema.methods.getTransitionsFrom = function (stateCode: string) {
  return this.transitions.filter((t: any) => t.fromState === stateCode);
};

WorkflowDefinitionSchema.methods.getTransitionsTo = function (stateCode: string) {
  return this.transitions.filter((t: any) => t.toState === stateCode);
};

// ============================================
// EXPORT
// ============================================

const WorkflowDefinition = mongoose.model<IWFDefinition>('WorkflowDefinition', WorkflowDefinitionSchema);

export default WorkflowDefinition;
