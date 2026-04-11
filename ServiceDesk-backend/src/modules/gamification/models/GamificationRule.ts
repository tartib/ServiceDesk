import { Schema, model, Document, Types } from 'mongoose';
import { RuleEffect } from '../domain';

export interface IRuleConditionDoc {
  field: string;
  operator: string;
  value: unknown;
}

export interface IGamificationRuleDoc extends Document {
  code: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  trigger: string;
  conditions: IRuleConditionDoc[];
  effect: RuleEffect;
  pointsDelta: number;
  enabled: boolean;
  priority: number;
  validFrom?: Date;
  validTo?: Date;
  dailyCap?: number;
  reopenAbuseWindowMs?: number;
  organizationId?: Types.ObjectId;
}

const ruleConditionSchema = new Schema<IRuleConditionDoc>(
  {
    field: { type: String, required: true },
    operator: { type: String, required: true, enum: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'exists'] },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const gamificationRuleSchema = new Schema<IGamificationRuleDoc>(
  {
    code: { type: String, required: true },
    name: { type: String, required: true },
    nameAr: { type: String },
    description: { type: String },
    descriptionAr: { type: String },
    trigger: { type: String, required: true },
    conditions: [ruleConditionSchema],
    effect: { type: String, enum: Object.values(RuleEffect), required: true },
    pointsDelta: { type: Number, required: true },
    enabled: { type: Boolean, default: true },
    priority: { type: Number, default: 0 },
    validFrom: { type: Date },
    validTo: { type: Date },
    dailyCap: { type: Number },
    reopenAbuseWindowMs: { type: Number },
    organizationId: { type: Schema.Types.ObjectId },
  },
  { timestamps: true }
);

gamificationRuleSchema.index({ code: 1, organizationId: 1 }, { unique: true });
gamificationRuleSchema.index({ trigger: 1, enabled: 1 });

export default model<IGamificationRuleDoc>('GamificationRule', gamificationRuleSchema);
