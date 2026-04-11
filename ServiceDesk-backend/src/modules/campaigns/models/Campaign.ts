/**
 * Campaign Model
 */

import mongoose, { Document, Schema } from 'mongoose';
import {
  CampaignStatus,
  CampaignMode,
  CampaignChannel,
} from '../domain/enums';

export interface ICampaignDocument extends Document {
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  channel: CampaignChannel;
  mode: CampaignMode;
  status: CampaignStatus;
  templateId?: mongoose.Types.ObjectId;
  segmentId?: mongoose.Types.ObjectId;
  triggerDefinitionId?: mongoose.Types.ObjectId;
  abTestId?: mongoose.Types.ObjectId;
  subject?: string;
  body?: string;
  bodyHtml?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  imageUrl?: string;
  sendAt?: Date;
  sentAt?: Date;
  completedAt?: Date;
  frequencyCap?: {
    maxPerDay: number;
    maxPerWeek: number;
    quietHoursEnabled: boolean;
    quietHoursFrom?: string;
    quietHoursTo?: string;
  };
  recipientCount?: number;
  stats: {
    queued: number;
    sent: number;
    delivered: number;
    failed: number;
    opened: number;
    clicked: number;
    unsubscribed: number;
    openRate: number;
    clickRate: number;
  };
  tags: string[];
  createdBy: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const frequencyCapSchema = new Schema(
  {
    maxPerDay: { type: Number, default: 5 },
    maxPerWeek: { type: Number, default: 15 },
    quietHoursEnabled: { type: Boolean, default: false },
    quietHoursFrom: { type: String },
    quietHoursTo: { type: String },
  },
  { _id: false }
);

const campaignStatsSchema = new Schema(
  {
    queued: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    unsubscribed: { type: Number, default: 0 },
    openRate: { type: Number, default: 0 },
    clickRate: { type: Number, default: 0 },
  },
  { _id: false }
);

const campaignSchema = new Schema<ICampaignDocument>(
  {
    name: { type: String, required: true, maxlength: 200 },
    nameAr: { type: String, maxlength: 200 },
    description: { type: String, maxlength: 2000 },
    descriptionAr: { type: String, maxlength: 2000 },
    channel: {
      type: String,
      enum: Object.values(CampaignChannel),
      required: true,
      index: true,
    },
    mode: {
      type: String,
      enum: Object.values(CampaignMode),
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(CampaignStatus),
      default: CampaignStatus.DRAFT,
      required: true,
      index: true,
    },
    templateId: { type: Schema.Types.ObjectId, ref: 'CampaignTemplate', index: true },
    segmentId: { type: Schema.Types.ObjectId, ref: 'CampaignSegment', index: true },
    triggerDefinitionId: { type: Schema.Types.ObjectId, ref: 'CampaignTrigger' },
    abTestId: { type: Schema.Types.ObjectId, ref: 'CampaignABTest' },
    subject: { type: String, maxlength: 500 },
    body: { type: String },
    bodyHtml: { type: String },
    ctaLabel: { type: String, maxlength: 100 },
    ctaUrl: { type: String, maxlength: 2000 },
    imageUrl: { type: String, maxlength: 2000 },
    sendAt: { type: Date, index: true },
    sentAt: { type: Date },
    completedAt: { type: Date },
    frequencyCap: { type: frequencyCapSchema },
    recipientCount: { type: Number, default: 0 },
    stats: { type: campaignStatsSchema, default: () => ({}) },
    tags: [{ type: String }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, required: true, index: true },
  },
  { timestamps: true, collection: 'campaigns' }
);

campaignSchema.index({ organizationId: 1, status: 1, createdAt: -1 });
campaignSchema.index({ organizationId: 1, channel: 1, status: 1 });
campaignSchema.index({ status: 1, sendAt: 1 }); // for scheduler

const Campaign = mongoose.model<ICampaignDocument>('Campaign', campaignSchema);
export default Campaign;
