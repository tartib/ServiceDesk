/**
 * Provider Configuration Model
 */

import mongoose, { Document, Schema } from 'mongoose';
import { ProviderType } from '../domain/enums';

export interface IProviderConfigDocument extends Document {
  name: string;
  type: ProviderType;
  provider: string;
  credentials: Record<string, string>;
  settings?: Record<string, unknown>;
  isDefault: boolean;
  priority: number;
  isActive: boolean;
  organizationId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  lastTestedAt?: Date;
  lastTestSuccess?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const providerConfigSchema = new Schema<IProviderConfigDocument>(
  {
    name: { type: String, required: true, maxlength: 200 },
    type: {
      type: String,
      enum: Object.values(ProviderType),
      required: true,
      index: true,
    },
    provider: { type: String, required: true }, // 'ses', 'sendgrid', 'twilio', etc.
    credentials: { type: Schema.Types.Mixed, required: true, default: {} },
    settings: { type: Schema.Types.Mixed },
    isDefault: { type: Boolean, default: false, index: true },
    priority: { type: Number, default: 0 }, // lower = preferred
    isActive: { type: Boolean, default: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lastTestedAt: { type: Date },
    lastTestSuccess: { type: Boolean },
  },
  { timestamps: true, collection: 'notification_provider_configs' }
);

providerConfigSchema.index({ organizationId: 1, type: 1, isActive: 1, priority: 1 });

const ProviderConfig = mongoose.model<IProviderConfigDocument>(
  'CampaignProviderConfig',
  providerConfigSchema
);
export default ProviderConfig;
