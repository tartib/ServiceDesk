import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from '../types/itsm.types';

export interface IITSMUser extends Document {
  user_id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department: string;
  job_title?: string;
  phone?: string;
  mobile?: string;
  site_id: string;
  manager_id?: string;
  groups: string[];
  permissions: string[];
  preferences: {
    language: 'en' | 'ar';
    timezone: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    dashboard_layout?: Record<string, any>;
  };
  avatar?: string;
  fcm_token?: string;
  is_active: boolean;
  is_cab_member: boolean;
  last_login?: Date;
  password_changed_at?: Date;
  created_at: Date;
  updated_at: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const PreferencesSchema = new Schema(
  {
    language: {
      type: String,
      enum: ['en', 'ar'],
      default: 'ar',
    },
    timezone: {
      type: String,
      default: 'Asia/Riyadh',
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
    },
    dashboard_layout: {
      type: Schema.Types.Mixed,
    },
  },
  { _id: false }
);

const ITSMUserSchema = new Schema<IITSMUser>(
  {
    user_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.END_USER,
      required: true,
      index: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    job_title: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    mobile: {
      type: String,
      trim: true,
    },
    site_id: {
      type: String,
      required: true,
      index: true,
    },
    manager_id: {
      type: String,
      index: true,
    },
    groups: {
      type: [String],
      default: [],
      index: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
    preferences: {
      type: PreferencesSchema,
      default: () => ({
        language: 'ar',
        timezone: 'Asia/Riyadh',
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
      }),
    },
    avatar: {
      type: String,
    },
    fcm_token: {
      type: String,
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
    is_cab_member: {
      type: Boolean,
      default: false,
      index: true,
    },
    last_login: {
      type: Date,
    },
    password_changed_at: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Compound indexes
ITSMUserSchema.index({ role: 1, is_active: 1 });
ITSMUserSchema.index({ site_id: 1, role: 1, is_active: 1 });
ITSMUserSchema.index({ department: 1, is_active: 1 });

// Hash password before saving
ITSMUserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  this.password_changed_at = new Date();
  next();
});

// Compare password method
ITSMUserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
ITSMUserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Virtual for is technician
ITSMUserSchema.virtual('is_technician').get(function () {
  return [UserRole.TECHNICIAN, UserRole.TEAM_LEAD, UserRole.MANAGER, UserRole.ADMIN].includes(this.role);
});

// Virtual for full name with department
ITSMUserSchema.virtual('display_name').get(function () {
  return `${this.name} (${this.department})`;
});

// Include virtuals in JSON
ITSMUserSchema.set('toJSON', { virtuals: true });
ITSMUserSchema.set('toObject', { virtuals: true });

const ITSMUser = mongoose.model<IITSMUser>('ITSMUser', ITSMUserSchema);

export default ITSMUser;
