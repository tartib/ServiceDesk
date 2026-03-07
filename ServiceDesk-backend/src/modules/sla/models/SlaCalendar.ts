import mongoose, { Document, Schema } from 'mongoose';

export interface ISlaCalendarDoc extends Document {
  tenantId: string;
  name: string;
  nameAr?: string;
  timezone: string;
  isDefault: boolean;
  isActive: boolean;
  workingHours: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isWorkingDay: boolean;
  }[];
  holidays: {
    holidayDate: string;
    name?: string;
    nameAr?: string;
  }[];
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WorkingHoursSchema = new Schema(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isWorkingDay: { type: Boolean, default: true },
  },
  { _id: false }
);

const HolidaySchema = new Schema(
  {
    holidayDate: { type: String, required: true },
    name: { type: String },
    nameAr: { type: String },
  },
  { _id: false }
);

const SlaCalendarSchema = new Schema<ISlaCalendarDoc>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    nameAr: { type: String },
    timezone: { type: String, default: 'Asia/Riyadh' },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    workingHours: {
      type: [WorkingHoursSchema],
      default: () => [
        { dayOfWeek: 0, startTime: '08:00', endTime: '17:00', isWorkingDay: true },
        { dayOfWeek: 1, startTime: '08:00', endTime: '17:00', isWorkingDay: true },
        { dayOfWeek: 2, startTime: '08:00', endTime: '17:00', isWorkingDay: true },
        { dayOfWeek: 3, startTime: '08:00', endTime: '17:00', isWorkingDay: true },
        { dayOfWeek: 4, startTime: '08:00', endTime: '17:00', isWorkingDay: true },
        { dayOfWeek: 5, startTime: '00:00', endTime: '00:00', isWorkingDay: false },
        { dayOfWeek: 6, startTime: '00:00', endTime: '00:00', isWorkingDay: false },
      ],
    },
    holidays: { type: [HolidaySchema], default: [] },
    createdBy: { type: String },
  },
  {
    timestamps: true,
    collection: 'sla_calendars',
  }
);

SlaCalendarSchema.index({ tenantId: 1, isDefault: 1 });

const SlaCalendar = mongoose.model<ISlaCalendarDoc>('SlaCalendar', SlaCalendarSchema);
export default SlaCalendar;
