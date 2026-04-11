/**
 * Trigger Definition Model
 */

import mongoose, { Document, Schema } from 'mongoose';
import { TriggerEvent, SegmentOperator } from '../domain/enums';

export interface ITriggerDefinitionDocument extends Document {
  name: string;
  nameAr?: string;
  event: TriggerEvent;
  customEventName?: string;
  conditions: {
    field: string;
    operator: SegmentOperator;
    value: unknown;
  }[];
  cooldownMinutes: number;
  linkedCampaignId?: mongoose.Types.ObjectId;
  linkedJourneyId?: mongoose.Types.ObjectId;
  isEnabled: boolean;
  lastFiredAt?: Date;
  fireCount: number;
  organizationId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const triggerConditionSchema = new Schema(
  {
    field: { type: String, required: true },
    operator: { type: String, enum: Object.values(SegmentOperator), required: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const triggerDefinitionSchema = new Schema<ITriggerDefinitionDocument>(
  {
    name: { type: String, required: true, maxlength: 200 },
    nameAr: { type: String, maxlength: 200 },
    event: {
      type: String,
      enum: Object.values(TriggerEvent),
      required: true,
      index: true,
    },
    customEventName: { type: String, maxlength: 200 },
    conditions: [triggerConditionSchema],
    cooldownMinutes: { type: Number, default: 0 },
    linkedCampaignId: { type: Schema.Types.ObjectId, ref: 'Campaign' },
    linkedJourneyId: { type: Schema.Types.ObjectId, ref: 'CampaignJourney' },
    isEnabled: { type: Boolean, default: true, index: true },
    lastFiredAt: { type: Date },
    fireCount: { type: Number, default: 0 },
    organizationId: { type: Schema.Types.ObjectId, required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, collection: 'notification_triggers' }
);

triggerDefinitionSchema.index({ organizationId: 1, event: 1, isEnabled: 1 });

const TriggerDefinition = mongoose.model<ITriggerDefinitionDocument>(
  'CampaignTrigger',
  triggerDefinitionSchema
);
export default TriggerDefinition;
