/**
 * User Notification Preference Model
 */

import mongoose, { Document, Schema } from 'mongoose';
import { PreferenceCategory } from '../domain/enums';

export interface IUserPreferenceDocument extends Document {
  userId: mongoose.Types.ObjectId;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  marketingEnabled: boolean;
  transactionalEnabled: boolean;
  remindersEnabled: boolean;
  productUpdatesEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursFrom?: string;
  quietHoursTo?: string;
  unsubscribedCategories: PreferenceCategory[];
  organizationId: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const userPreferenceSchema = new Schema<IUserPreferenceDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    emailEnabled: { type: Boolean, default: true },
    smsEnabled: { type: Boolean, default: true },
    pushEnabled: { type: Boolean, default: true },
    marketingEnabled: { type: Boolean, default: true },
    transactionalEnabled: { type: Boolean, default: true },
    remindersEnabled: { type: Boolean, default: true },
    productUpdatesEnabled: { type: Boolean, default: true },
    quietHoursEnabled: { type: Boolean, default: false },
    quietHoursFrom: { type: String },
    quietHoursTo: { type: String },
    unsubscribedCategories: [{
      type: String,
      enum: Object.values(PreferenceCategory),
    }],
    organizationId: { type: Schema.Types.ObjectId, required: true, index: true },
  },
  { timestamps: { createdAt: false, updatedAt: true }, collection: 'notification_preferences' }
);

userPreferenceSchema.index({ userId: 1, organizationId: 1 }, { unique: true });

const UserPreference = mongoose.model<IUserPreferenceDocument>(
  'CampaignUserPreference',
  userPreferenceSchema
);
export default UserPreference;
