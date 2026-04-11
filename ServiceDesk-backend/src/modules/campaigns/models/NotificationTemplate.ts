/**
 * Notification Template Model
 */

import mongoose, { Document, Schema } from 'mongoose';
import { CampaignChannel } from '../domain/enums';

export interface INotificationTemplateDocument extends Document {
  name: string;
  nameAr?: string;
  channel: CampaignChannel;
  subject?: string;
  subjectAr?: string;
  body: string;
  bodyAr?: string;
  bodyHtml?: string;
  bodyHtmlAr?: string;
  variables: { key: string; description?: string; defaultValue?: string }[];
  ctaLabel?: string;
  ctaLabelAr?: string;
  ctaUrl?: string;
  imageUrl?: string;
  language?: string;
  tags: string[];
  isActive: boolean;
  organizationId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const templateVariableSchema = new Schema(
  {
    key: { type: String, required: true },
    description: { type: String },
    defaultValue: { type: String },
  },
  { _id: false }
);

const notificationTemplateSchema = new Schema<INotificationTemplateDocument>(
  {
    name: { type: String, required: true, maxlength: 200 },
    nameAr: { type: String, maxlength: 200 },
    channel: {
      type: String,
      enum: Object.values(CampaignChannel),
      required: true,
      index: true,
    },
    subject: { type: String, maxlength: 500 },
    subjectAr: { type: String, maxlength: 500 },
    body: { type: String, required: true },
    bodyAr: { type: String },
    bodyHtml: { type: String },
    bodyHtmlAr: { type: String },
    variables: [templateVariableSchema],
    ctaLabel: { type: String, maxlength: 100 },
    ctaLabelAr: { type: String, maxlength: 100 },
    ctaUrl: { type: String, maxlength: 2000 },
    imageUrl: { type: String, maxlength: 2000 },
    language: { type: String, default: 'en' },
    tags: [{ type: String }],
    isActive: { type: Boolean, default: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, collection: 'notification_templates' }
);

notificationTemplateSchema.index({ organizationId: 1, channel: 1, isActive: 1 });
notificationTemplateSchema.index({ organizationId: 1, name: 'text' });

const NotificationTemplate = mongoose.model<INotificationTemplateDocument>(
  'CampaignTemplate',
  notificationTemplateSchema
);
export default NotificationTemplate;
