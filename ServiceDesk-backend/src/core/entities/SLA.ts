import mongoose, { Document, Schema } from 'mongoose';
import {
  Priority,
  IEscalationLevel,
  IBusinessSchedule,
  UserRole,
} from '../types/itsm.types';

export interface ISLA extends Document {
  sla_id: string;
  name: string;
  name_ar?: string;
  description: string;
  description_ar?: string;
  priority: Priority;
  response_time: {
    hours: number;
    business_hours_only: boolean;
  };
  resolution_time: {
    hours: number;
    business_hours_only: boolean;
  };
  escalation_matrix: IEscalationLevel[];
  business_hours: {
    timezone: string;
    schedule: IBusinessSchedule[];
    holidays: Date[];
  };
  notifications: {
    warning_threshold_percent: number;
    breach_notifications: string[];
  };
  applies_to: {
    categories?: string[];
    sites?: string[];
    user_groups?: string[];
  };
  is_default: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const EscalationLevelSchema = new Schema<IEscalationLevel>(
  {
    level: { type: Number, required: true },
    after_minutes: { type: Number, required: true },
    notify_role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
    },
    notify_users: { type: [String], default: [] },
    action: { type: String },
  },
  { _id: false }
);

const BusinessScheduleSchema = new Schema<IBusinessSchedule>(
  {
    day: { type: Number, required: true, min: 0, max: 6 },
    start_time: { type: String, required: true },
    end_time: { type: String, required: true },
    is_working: { type: Boolean, default: true },
  },
  { _id: false }
);

const ResponseTimeSchema = new Schema(
  {
    hours: { type: Number, required: true, min: 0 },
    business_hours_only: { type: Boolean, default: true },
  },
  { _id: false }
);

const ResolutionTimeSchema = new Schema(
  {
    hours: { type: Number, required: true, min: 0 },
    business_hours_only: { type: Boolean, default: true },
  },
  { _id: false }
);

const BusinessHoursSchema = new Schema(
  {
    timezone: { type: String, default: 'Asia/Riyadh' },
    schedule: { type: [BusinessScheduleSchema], default: [] },
    holidays: { type: [Date], default: [] },
  },
  { _id: false }
);

const NotificationsSchema = new Schema(
  {
    warning_threshold_percent: { type: Number, default: 75 },
    breach_notifications: { type: [String], default: [] },
  },
  { _id: false }
);

const AppliesToSchema = new Schema(
  {
    categories: { type: [String], default: [] },
    sites: { type: [String], default: [] },
    user_groups: { type: [String], default: [] },
  },
  { _id: false }
);

const SLASchema = new Schema<ISLA>(
  {
    sla_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'SLA name is required'],
      trim: true,
      maxlength: 100,
    },
    name_ar: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: 500,
    },
    description_ar: {
      type: String,
      maxlength: 500,
    },
    priority: {
      type: String,
      enum: Object.values(Priority),
      required: true,
      index: true,
    },
    response_time: {
      type: ResponseTimeSchema,
      required: true,
    },
    resolution_time: {
      type: ResolutionTimeSchema,
      required: true,
    },
    escalation_matrix: {
      type: [EscalationLevelSchema],
      default: [],
    },
    business_hours: {
      type: BusinessHoursSchema,
      default: () => ({
        timezone: 'Asia/Riyadh',
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
    notifications: {
      type: NotificationsSchema,
      default: () => ({
        warning_threshold_percent: 75,
        breach_notifications: [],
      }),
    },
    applies_to: {
      type: AppliesToSchema,
      default: () => ({
        categories: [],
        sites: [],
        user_groups: [],
      }),
    },
    is_default: {
      type: Boolean,
      default: false,
      index: true,
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

// Compound indexes
SLASchema.index({ priority: 1, is_active: 1 });
SLASchema.index({ is_default: 1, priority: 1 });

// Virtual for response time in minutes
SLASchema.virtual('response_time_minutes').get(function () {
  return this.response_time.hours * 60;
});

// Virtual for resolution time in minutes
SLASchema.virtual('resolution_time_minutes').get(function () {
  return this.resolution_time.hours * 60;
});

// Static method to get default SLA by priority
SLASchema.statics.getDefaultByPriority = async function (priority: Priority) {
  return this.findOne({ priority, is_default: true, is_active: true });
};

// Static method to find applicable SLA
SLASchema.statics.findApplicable = async function (
  priority: Priority,
  categoryId?: string,
  siteId?: string
) {
  // First try to find specific SLA
  const specificSLA = await this.findOne({
    priority,
    is_active: true,
    $or: [
      { 'applies_to.categories': categoryId },
      { 'applies_to.sites': siteId },
    ],
  });

  if (specificSLA) return specificSLA;

  // Fall back to default SLA
  return this.findOne({ priority, is_default: true, is_active: true });
};

// Include virtuals in JSON
SLASchema.set('toJSON', { virtuals: true });
SLASchema.set('toObject', { virtuals: true });

const SLA = mongoose.model<ISLA>('SLA', SLASchema);

export default SLA;
