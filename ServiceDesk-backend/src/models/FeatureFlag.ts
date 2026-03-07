import mongoose, { Schema, Document } from 'mongoose';
import { FeatureFlag, FeatureFlagCategory } from '../shared/feature-flags/types';

export interface IFeatureFlagDocument extends Omit<FeatureFlag, 'updatedAt'>, Document {
  createdAt: Date;
  updatedAt: Date;
}

const featureFlagSchema = new Schema<IFeatureFlagDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[a-z][a-z0-9_]*$/,
    },
    enabled: {
      type: Boolean,
      required: true,
      default: false,
    },
    description: {
      type: String,
      required: true,
    },
    descriptionAr: {
      type: String,
    },
    rolloutPercentage: {
      type: Number,
      required: true,
      default: 100,
      min: 0,
      max: 100,
    },
    allowedRoles: {
      type: [String],
      default: undefined,
    },
    allowedOrgs: {
      type: [String],
      default: undefined,
    },
    category: {
      type: String,
      required: true,
      enum: Object.values(FeatureFlagCategory),
      default: FeatureFlagCategory.CORE,
    },
    updatedBy: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

featureFlagSchema.index({ category: 1 });
featureFlagSchema.index({ enabled: 1 });

export default mongoose.model<IFeatureFlagDocument>('FeatureFlag', featureFlagSchema);
