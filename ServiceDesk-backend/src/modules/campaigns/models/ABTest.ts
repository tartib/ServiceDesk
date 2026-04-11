/**
 * A/B Test Model
 */

import mongoose, { Document, Schema } from 'mongoose';
import { ABTestStatus, ABTestMetric } from '../domain/enums';

export interface IABVariantDocument {
  variantId: string;
  name: string;
  subject?: string;
  body?: string;
  bodyHtml?: string;
  templateId?: mongoose.Types.ObjectId;
  splitPercentage: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
}

export interface IABTestDocument extends Document {
  campaignId: mongoose.Types.ObjectId;
  status: ABTestStatus;
  metric: ABTestMetric;
  variants: IABVariantDocument[];
  winnerVariantId?: string;
  autoDecideAfterHours?: number;
  startedAt?: Date;
  completedAt?: Date;
  organizationId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const abVariantSchema = new Schema(
  {
    variantId: { type: String, required: true },
    name: { type: String, required: true },
    subject: { type: String },
    body: { type: String },
    bodyHtml: { type: String },
    templateId: { type: Schema.Types.ObjectId, ref: 'CampaignTemplate' },
    splitPercentage: { type: Number, required: true, min: 0, max: 100 },
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
  },
  { _id: false }
);

const abTestSchema = new Schema<IABTestDocument>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    status: {
      type: String,
      enum: Object.values(ABTestStatus),
      default: ABTestStatus.DRAFT,
      required: true,
      index: true,
    },
    metric: {
      type: String,
      enum: Object.values(ABTestMetric),
      default: ABTestMetric.OPEN_RATE,
      required: true,
    },
    variants: [abVariantSchema],
    winnerVariantId: { type: String },
    autoDecideAfterHours: { type: Number },
    startedAt: { type: Date },
    completedAt: { type: Date },
    organizationId: { type: Schema.Types.ObjectId, required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, collection: 'notification_ab_tests' }
);

const ABTest = mongoose.model<IABTestDocument>('CampaignABTest', abTestSchema);
export default ABTest;
