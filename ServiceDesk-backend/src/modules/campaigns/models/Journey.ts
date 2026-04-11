/**
 * Journey Model
 */

import mongoose, { Document, Schema } from 'mongoose';
import {
  JourneyStatus,
  JourneyStepType,
  CampaignChannel,
  SegmentOperator,
} from '../domain/enums';

export interface IJourneyStepDocument {
  stepId: string;
  stepOrder: number;
  type: JourneyStepType;
  name?: string;
  nameAr?: string;
  channel?: CampaignChannel;
  templateId?: mongoose.Types.ObjectId;
  delayMinutes?: number;
  condition?: {
    field: string;
    operator: SegmentOperator;
    value: unknown;
  };
  nextStepOnTrue?: string;
  nextStepOnFalse?: string;
  nextStepId?: string;
}

export interface IJourneyDocument extends Document {
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  status: JourneyStatus;
  triggerDefinitionId?: mongoose.Types.ObjectId;
  steps: IJourneyStepDocument[];
  frequencyCap?: {
    maxPerDay: number;
    maxPerWeek: number;
    quietHoursEnabled: boolean;
    quietHoursFrom?: string;
    quietHoursTo?: string;
  };
  activeUserCount: number;
  completedUserCount: number;
  organizationId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const journeyStepConditionSchema = new Schema(
  {
    field: { type: String, required: true },
    operator: { type: String, enum: Object.values(SegmentOperator), required: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const journeyStepSchema = new Schema(
  {
    stepId: { type: String, required: true },
    stepOrder: { type: Number, required: true },
    type: { type: String, enum: Object.values(JourneyStepType), required: true },
    name: { type: String, maxlength: 200 },
    nameAr: { type: String, maxlength: 200 },
    channel: { type: String, enum: Object.values(CampaignChannel) },
    templateId: { type: Schema.Types.ObjectId, ref: 'CampaignTemplate' },
    delayMinutes: { type: Number },
    condition: { type: journeyStepConditionSchema },
    nextStepOnTrue: { type: String },
    nextStepOnFalse: { type: String },
    nextStepId: { type: String },
  },
  { _id: false }
);

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

const journeySchema = new Schema<IJourneyDocument>(
  {
    name: { type: String, required: true, maxlength: 200 },
    nameAr: { type: String, maxlength: 200 },
    description: { type: String, maxlength: 2000 },
    descriptionAr: { type: String, maxlength: 2000 },
    status: {
      type: String,
      enum: Object.values(JourneyStatus),
      default: JourneyStatus.DRAFT,
      required: true,
      index: true,
    },
    triggerDefinitionId: { type: Schema.Types.ObjectId, ref: 'CampaignTrigger' },
    steps: [journeyStepSchema],
    frequencyCap: { type: frequencyCapSchema },
    activeUserCount: { type: Number, default: 0 },
    completedUserCount: { type: Number, default: 0 },
    organizationId: { type: Schema.Types.ObjectId, required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    publishedAt: { type: Date },
  },
  { timestamps: true, collection: 'notification_journeys' }
);

journeySchema.index({ organizationId: 1, status: 1, createdAt: -1 });

const Journey = mongoose.model<IJourneyDocument>('CampaignJourney', journeySchema);
export default Journey;
