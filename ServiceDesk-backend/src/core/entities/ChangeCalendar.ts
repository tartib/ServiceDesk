import mongoose, { Document, Schema } from 'mongoose';
import { ChangeCalendarEventType } from '../types/itsm.types';

export interface IChangeCalendarEvent extends Document {
  event_id: string;
  type: ChangeCalendarEventType;
  title: string;
  description?: string;
  start_date: Date;
  end_date: Date;
  site_id?: string;
  created_by: string;
  created_by_name: string;
  created_at: Date;
  updated_at: Date;
}

const ChangeCalendarSchema = new Schema<IChangeCalendarEvent>(
  {
    event_id: { type: String, required: true, unique: true, index: true },
    type: {
      type: String,
      enum: Object.values(ChangeCalendarEventType),
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, maxlength: 2000 },
    start_date: { type: Date, required: true, index: true },
    end_date: { type: Date, required: true, index: true },
    site_id: { type: String, index: true },
    created_by: { type: String, required: true },
    created_by_name: { type: String, required: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

ChangeCalendarSchema.index({ start_date: 1, end_date: 1, type: 1 });
ChangeCalendarSchema.index({ site_id: 1, start_date: 1, end_date: 1 });

const ChangeCalendar = (mongoose.models['ChangeCalendar'] as mongoose.Model<IChangeCalendarEvent>) ||
  mongoose.model<IChangeCalendarEvent>('ChangeCalendar', ChangeCalendarSchema);

export default ChangeCalendar;
