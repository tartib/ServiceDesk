/**
 * Personalization Rule Model
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IPersonalizationRuleDocument extends Document {
  name: string;
  nameAr?: string;
  segmentId?: mongoose.Types.ObjectId;
  language?: string;
  region?: string;
  targetField: string;
  dynamicContent: Record<string, string>;
  fallbackValue: string;
  isActive: boolean;
  organizationId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const personalizationRuleSchema = new Schema<IPersonalizationRuleDocument>(
  {
    name: { type: String, required: true, maxlength: 200 },
    nameAr: { type: String, maxlength: 200 },
    segmentId: { type: Schema.Types.ObjectId, ref: 'CampaignSegment' },
    language: { type: String, maxlength: 10 },
    region: { type: String, maxlength: 50 },
    targetField: { type: String, required: true }, // 'subject', 'body', 'ctaLabel'
    dynamicContent: { type: Schema.Types.Mixed, required: true, default: {} },
    fallbackValue: { type: String, required: true },
    isActive: { type: Boolean, default: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, collection: 'notification_personalization_rules' }
);

personalizationRuleSchema.index({ organizationId: 1, isActive: 1 });

const PersonalizationRule = mongoose.model<IPersonalizationRuleDocument>(
  'CampaignPersonalizationRule',
  personalizationRuleSchema
);
export default PersonalizationRule;
