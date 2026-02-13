import mongoose, { Document, Schema } from 'mongoose';

export interface ISite extends Document {
  site_id: string;
  name: string;
  name_ar?: string;
  code: string;
  address?: {
    street?: string;
    city: string;
    region?: string;
    country: string;
    postal_code?: string;
  };
  timezone: string;
  contact: {
    email?: string;
    phone?: string;
    manager_id?: string;
    manager_name?: string;
  };
  technician_groups: string[];
  service_catalog_enabled: string[];
  sla_overrides?: Array<{
    category_id: string;
    sla_id: string;
  }>;
  business_hours?: {
    schedule: Array<{
      day: number;
      start_time: string;
      end_time: string;
      is_working: boolean;
    }>;
    holidays: Date[];
  };
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const AddressSchema = new Schema(
  {
    street: { type: String },
    city: { type: String, required: true },
    region: { type: String },
    country: { type: String, required: true },
    postal_code: { type: String },
  },
  { _id: false }
);

const ContactSchema = new Schema(
  {
    email: { type: String },
    phone: { type: String },
    manager_id: { type: String },
    manager_name: { type: String },
  },
  { _id: false }
);

const SLAOverrideSchema = new Schema(
  {
    category_id: { type: String, required: true },
    sla_id: { type: String, required: true },
  },
  { _id: false }
);

const BusinessScheduleSchema = new Schema(
  {
    day: { type: Number, required: true, min: 0, max: 6 },
    start_time: { type: String, required: true },
    end_time: { type: String, required: true },
    is_working: { type: Boolean, default: true },
  },
  { _id: false }
);

const BusinessHoursSchema = new Schema(
  {
    schedule: { type: [BusinessScheduleSchema], default: [] },
    holidays: { type: [Date], default: [] },
  },
  { _id: false }
);

const SiteSchema = new Schema<ISite>(
  {
    site_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Site name is required'],
      trim: true,
      maxlength: 100,
    },
    name_ar: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 10,
    },
    address: {
      type: AddressSchema,
    },
    timezone: {
      type: String,
      default: 'Asia/Riyadh',
    },
    contact: {
      type: ContactSchema,
      default: () => ({}),
    },
    technician_groups: {
      type: [String],
      default: [],
    },
    service_catalog_enabled: {
      type: [String],
      default: ['all'],
    },
    sla_overrides: {
      type: [SLAOverrideSchema],
      default: [],
    },
    business_hours: {
      type: BusinessHoursSchema,
      default: () => ({
        schedule: [
          { day: 0, start_time: '08:00', end_time: '17:00', is_working: true },
          { day: 1, start_time: '08:00', end_time: '17:00', is_working: true },
          { day: 2, start_time: '08:00', end_time: '17:00', is_working: true },
          { day: 3, start_time: '08:00', end_time: '17:00', is_working: true },
          { day: 4, start_time: '08:00', end_time: '17:00', is_working: true },
          { day: 5, start_time: '00:00', end_time: '00:00', is_working: false },
          { day: 6, start_time: '00:00', end_time: '00:00', is_working: false },
        ],
        holidays: [],
      }),
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Indexes
SiteSchema.index({ code: 1 });
SiteSchema.index({ is_active: 1 });

// Include virtuals in JSON
SiteSchema.set('toJSON', { virtuals: true });
SiteSchema.set('toObject', { virtuals: true });

const Site = mongoose.model<ISite>('Site', SiteSchema);

export default Site;
