/**
 * Message Model — individual message sent to a recipient
 */

import mongoose, { Document, Schema } from 'mongoose';
import { CampaignChannel, DeliveryStatus } from '../domain/enums';

export interface IMessageDocument extends Document {
  campaignId?: mongoose.Types.ObjectId;
  journeyId?: mongoose.Types.ObjectId;
  journeyStepId?: string;
  recipientId: mongoose.Types.ObjectId;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientDeviceToken?: string;
  templateId?: mongoose.Types.ObjectId;
  renderedSubject?: string;
  renderedBody?: string;
  renderedBodyHtml?: string;
  channel: CampaignChannel;
  provider?: string;
  providerMessageId?: string;
  status: DeliveryStatus;
  abVariant?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  failureReason?: string;
  attempts: number;
  lastAttemptAt?: Date;
  organizationId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessageDocument>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', index: true },
    journeyId: { type: Schema.Types.ObjectId, ref: 'CampaignJourney', index: true },
    journeyStepId: { type: String },
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipientEmail: { type: String },
    recipientPhone: { type: String },
    recipientDeviceToken: { type: String },
    templateId: { type: Schema.Types.ObjectId, ref: 'CampaignTemplate' },
    renderedSubject: { type: String },
    renderedBody: { type: String },
    renderedBodyHtml: { type: String },
    channel: {
      type: String,
      enum: Object.values(CampaignChannel),
      required: true,
      index: true,
    },
    provider: { type: String },
    providerMessageId: { type: String, index: true },
    status: {
      type: String,
      enum: Object.values(DeliveryStatus),
      default: DeliveryStatus.QUEUED,
      required: true,
      index: true,
    },
    abVariant: { type: String },
    sentAt: { type: Date },
    deliveredAt: { type: Date },
    openedAt: { type: Date },
    clickedAt: { type: Date },
    failureReason: { type: String },
    attempts: { type: Number, default: 0 },
    lastAttemptAt: { type: Date },
    organizationId: { type: Schema.Types.ObjectId, required: true, index: true },
  },
  { timestamps: true, collection: 'notification_messages' }
);

messageSchema.index({ campaignId: 1, status: 1 });
messageSchema.index({ organizationId: 1, campaignId: 1, createdAt: -1 });
messageSchema.index({ status: 1, lastAttemptAt: 1 }); // for retry job

const Message = mongoose.model<IMessageDocument>('CampaignMessage', messageSchema);
export default Message;
