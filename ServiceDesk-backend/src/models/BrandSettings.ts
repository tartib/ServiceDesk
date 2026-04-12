import mongoose, { Document, Schema } from 'mongoose';

export interface IBrandKit {
  brandName: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  accentColor: string;
}

export interface IBrandSettings extends Document {
  organizationId: mongoose.Types.ObjectId;
  brandKit: IBrandKit;
  themeOverrides: Record<string, string>;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const brandKitSchema = new Schema<IBrandKit>(
  {
    brandName: { type: String, default: '' },
    logoUrl: { type: String, default: '' },
    faviconUrl: { type: String, default: '' },
    primaryColor: { type: String, default: '#6161FF' },
    accentColor: { type: String, default: '#00CA72' },
  },
  { _id: false },
);

const brandSettingsSchema = new Schema<IBrandSettings>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'PMOrganization',
      required: true,
      unique: true,
      index: true,
    },
    brandKit: {
      type: brandKitSchema,
      default: () => ({}),
    },
    themeOverrides: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true },
);

const BrandSettings = mongoose.model<IBrandSettings>('BrandSettings', brandSettingsSchema);

export default BrandSettings;
