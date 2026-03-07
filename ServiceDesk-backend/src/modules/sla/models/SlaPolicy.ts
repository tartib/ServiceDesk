import mongoose, { Document, Schema } from 'mongoose';
import { SlaEntityType, SlaConditionOperator, SlaBreachSeverity, SlaEscalationTrigger, SlaEscalationAction } from '../domain';

export interface ISlaGoalSubdoc {
  metricKey: string;
  targetMinutes: number;
  calendarId?: string;
  startEvent: string;
  stopEvent: string;
  pauseOnStatuses: string[];
  resumeOnStatuses: string[];
  breachSeverity: string;
  escalationRules: {
    triggerType: string;
    offsetMinutes: number;
    actionType: string;
    actionConfig: Record<string, unknown>;
    isActive: boolean;
    sortOrder: number;
  }[];
}

export interface ISlaPolicyDoc extends Document {
  tenantId: string;
  code: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  entityType: string;
  priority: number;
  matchConditions: { field: string; operator: string; value: unknown }[];
  goals: ISlaGoalSubdoc[];
  isActive: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MatchConditionSchema = new Schema(
  {
    field: { type: String, required: true },
    operator: { type: String, enum: Object.values(SlaConditionOperator), required: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const EscalationRuleSchema = new Schema(
  {
    triggerType: { type: String, enum: Object.values(SlaEscalationTrigger), required: true },
    offsetMinutes: { type: Number, default: 0 },
    actionType: { type: String, enum: Object.values(SlaEscalationAction), required: true },
    actionConfig: { type: Schema.Types.Mixed, default: {} },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

const GoalSchema = new Schema(
  {
    metricKey: { type: String, required: true },
    targetMinutes: { type: Number, required: true },
    calendarId: { type: String },
    startEvent: { type: String, required: true },
    stopEvent: { type: String, required: true },
    pauseOnStatuses: { type: [String], default: [] },
    resumeOnStatuses: { type: [String], default: [] },
    breachSeverity: { type: String, enum: Object.values(SlaBreachSeverity), default: SlaBreachSeverity.WARNING },
    escalationRules: { type: [EscalationRuleSchema], default: [] },
  },
  { _id: false }
);

const SlaPolicySchema = new Schema<ISlaPolicyDoc>(
  {
    tenantId: { type: String, required: true, index: true },
    code: { type: String, required: true },
    name: { type: String, required: true },
    nameAr: { type: String },
    description: { type: String },
    descriptionAr: { type: String },
    entityType: { type: String, enum: Object.values(SlaEntityType), required: true },
    priority: { type: Number, default: 100 },
    matchConditions: { type: [MatchConditionSchema], default: [] },
    goals: { type: [GoalSchema], default: [] },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String },
  },
  {
    timestamps: true,
    collection: 'sla_policies',
  }
);

SlaPolicySchema.index({ tenantId: 1, code: 1 }, { unique: true });
SlaPolicySchema.index({ tenantId: 1, entityType: 1, isActive: 1, priority: 1 });

const SlaPolicy = mongoose.model<ISlaPolicyDoc>('SlaPolicy', SlaPolicySchema);
export default SlaPolicy;
