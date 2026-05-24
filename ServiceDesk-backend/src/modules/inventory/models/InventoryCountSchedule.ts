import mongoose, { Document, Schema } from 'mongoose';
import { CountFrequency, WeeklyDay, ScheduleStatus } from '../types';

export interface IInventoryCountSchedule extends Document {
  name: string;
  frequency: CountFrequency;
  warehouse: mongoose.Types.ObjectId;
  items: mongoose.Types.ObjectId[];
  assignedTo: mongoose.Types.ObjectId;
  startDate: Date;
  dueTime: string; // "HH:mm"
  weeklyDay?: WeeklyDay;
  varianceThreshold: number; // percentage (e.g. 5 = 5%)
  notes?: string;
  status: ScheduleStatus;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const inventoryCountScheduleSchema = new Schema<IInventoryCountSchedule>(
  {
    name: {
      type: String,
      required: [true, 'Schedule name is required'],
      trim: true,
      maxlength: 200,
    },
    frequency: {
      type: String,
      enum: Object.values(CountFrequency),
      required: [true, 'Frequency is required'],
    },
    warehouse: {
      type: Schema.Types.ObjectId,
      ref: 'InvWarehouse',
      required: [true, 'Warehouse is required'],
      index: true,
    },
    items: [{
      type: Schema.Types.ObjectId,
      ref: 'InventoryItem',
      required: true,
    }],
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned user is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    dueTime: {
      type: String,
      required: [true, 'Due time is required'],
      match: [/^\d{2}:\d{2}$/, 'Due time must be in HH:mm format'],
    },
    weeklyDay: {
      type: String,
      enum: Object.values(WeeklyDay),
    },
    varianceThreshold: {
      type: Number,
      required: true,
      default: 5,
      min: [0, 'Threshold cannot be negative'],
      max: [100, 'Threshold cannot exceed 100'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: Object.values(ScheduleStatus),
      default: ScheduleStatus.ACTIVE,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

inventoryCountScheduleSchema.index({ frequency: 1, status: 1 });
inventoryCountScheduleSchema.index({ assignedTo: 1 });

const InventoryCountSchedule = mongoose.model<IInventoryCountSchedule>(
  'InventoryCountSchedule',
  inventoryCountScheduleSchema
);

export default InventoryCountSchedule;
