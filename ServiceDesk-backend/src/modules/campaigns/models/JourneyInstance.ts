/**
 * Journey Instance Model — per-user execution state
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IJourneyInstanceDocument extends Document {
  journeyId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  currentStepId: string;
  status: 'active' | 'completed' | 'exited' | 'paused';
  waitUntil?: Date;
  enteredAt: Date;
  completedAt?: Date;
  organizationId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const journeyInstanceSchema = new Schema<IJourneyInstanceDocument>(
  {
    journeyId: { type: Schema.Types.ObjectId, ref: 'CampaignJourney', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    currentStepId: { type: String, required: true },
    status: {
      type: String,
      enum: ['active', 'completed', 'exited', 'paused'],
      default: 'active',
      required: true,
      index: true,
    },
    waitUntil: { type: Date, index: true },
    enteredAt: { type: Date, default: Date.now, required: true },
    completedAt: { type: Date },
    organizationId: { type: Schema.Types.ObjectId, required: true, index: true },
  },
  { timestamps: true, collection: 'notification_journey_instances' }
);

journeyInstanceSchema.index({ journeyId: 1, userId: 1 }, { unique: true });
journeyInstanceSchema.index({ status: 1, waitUntil: 1 }); // for step processor

const JourneyInstance = mongoose.model<IJourneyInstanceDocument>(
  'CampaignJourneyInstance',
  journeyInstanceSchema
);
export default JourneyInstance;
