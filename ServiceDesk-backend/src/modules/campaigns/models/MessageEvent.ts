/**
 * Message Event Model — delivery tracking events
 */

import mongoose, { Document, Schema } from 'mongoose';
import { MessageEventType } from '../domain/enums';

export interface IMessageEventDocument extends Document {
  messageId: mongoose.Types.ObjectId;
  campaignId?: mongoose.Types.ObjectId;
  eventType: MessageEventType;
  eventAt: Date;
  provider?: string;
  rawPayload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  organizationId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const messageEventSchema = new Schema<IMessageEventDocument>(
  {
    messageId: { type: Schema.Types.ObjectId, ref: 'CampaignMessage', required: true, index: true },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', index: true },
    eventType: {
      type: String,
      enum: Object.values(MessageEventType),
      required: true,
      index: true,
    },
    eventAt: { type: Date, required: true, default: Date.now },
    provider: { type: String },
    rawPayload: { type: Schema.Types.Mixed },
    metadata: { type: Schema.Types.Mixed },
    organizationId: { type: Schema.Types.ObjectId, required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'notification_events' }
);

messageEventSchema.index({ messageId: 1, eventType: 1 });
messageEventSchema.index({ campaignId: 1, eventType: 1, eventAt: -1 });
messageEventSchema.index({ organizationId: 1, eventAt: -1 });
// TTL: auto-delete events older than 365 days
messageEventSchema.index({ eventAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

const MessageEvent = mongoose.model<IMessageEventDocument>(
  'CampaignMessageEvent',
  messageEventSchema
);
export default MessageEvent;
