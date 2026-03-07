import mongoose, { Schema } from 'mongoose';
import { MethodologyCode } from './Project';

export interface IPMOrganization {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  settings: {
    defaultMethodology: MethodologyCode;
    timezone: string;
    dateFormat: string;
    workingDays: number[];
    workingHours: {
      start: string;
      end: string;
    };
  };
  subscription: {
    plan: 'free' | 'pro' | 'enterprise';
    validUntil?: Date;
    limits: {
      maxProjects: number;
      maxUsers: number;
      maxStorage: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy: mongoose.Types.ObjectId;
}

const OrganizationSchema = new Schema<IPMOrganization>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    logo: {
      type: String,
    },
    settings: {
      defaultMethodology: {
        type: String,
        enum: Object.values(MethodologyCode),
        default: MethodologyCode.SCRUM,
      },
      timezone: { type: String, default: 'UTC' },
      dateFormat: { type: String, default: 'YYYY-MM-DD' },
      workingDays: { type: [Number], default: [1, 2, 3, 4, 5] },
      workingHours: {
        start: { type: String, default: '09:00' },
        end: { type: String, default: '18:00' },
      },
    },
    subscription: {
      plan: {
        type: String,
        enum: ['free', 'pro', 'enterprise'],
        default: 'free',
      },
      validUntil: { type: Date },
      limits: {
        maxProjects: { type: Number, default: 5 },
        maxUsers: { type: Number, default: 10 },
        maxStorage: { type: Number, default: 1 },
      },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.__v = undefined;
        return ret;
      },
    },
  }
);

OrganizationSchema.index({ createdBy: 1 });

OrganizationSchema.pre('save', function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

const PMOrganization = mongoose.model<IPMOrganization>('PMOrganization', OrganizationSchema);

export default PMOrganization;
