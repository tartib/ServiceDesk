import mongoose, { Document, Schema } from 'mongoose';
import { CountTaskStatus } from '../types';

export interface ICountTaskItem {
  item: mongoose.Types.ObjectId;
  itemName: string;
  sku: string;
  systemQuantity: number;
  actualQuantity?: number;
  variance?: number;
  varianceReason?: string;
  notes?: string;
}

export interface IInventoryCountTask extends Document {
  schedule: mongoose.Types.ObjectId;
  warehouse: mongoose.Types.ObjectId;
  countDate: Date;
  assignedTo: mongoose.Types.ObjectId;
  status: CountTaskStatus;
  items: ICountTaskItem[];
  submittedBy?: mongoose.Types.ObjectId;
  submittedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const countTaskItemSchema = new Schema<ICountTaskItem>(
  {
    item: {
      type: Schema.Types.ObjectId,
      ref: 'InventoryItem',
      required: true,
    },
    itemName: { type: String, required: true },
    sku: { type: String, required: true },
    systemQuantity: { type: Number, required: true, min: 0 },
    actualQuantity: { type: Number, min: 0 },
    variance: { type: Number },
    varianceReason: { type: String, trim: true, maxlength: 300 },
    notes: { type: String, trim: true, maxlength: 300 },
  },
  { _id: false }
);

const inventoryCountTaskSchema = new Schema<IInventoryCountTask>(
  {
    schedule: {
      type: Schema.Types.ObjectId,
      ref: 'InventoryCountSchedule',
      required: true,
      index: true,
    },
    warehouse: {
      type: Schema.Types.ObjectId,
      ref: 'InvWarehouse',
      required: true,
      index: true,
    },
    countDate: {
      type: Date,
      required: [true, 'Count date is required'],
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(CountTaskStatus),
      default: CountTaskStatus.PENDING,
      index: true,
    },
    items: {
      type: [countTaskItemSchema],
      required: true,
      validate: [(v: ICountTaskItem[]) => v.length > 0, 'At least one item is required'],
    },
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    submittedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    rejectionReason: { type: String, trim: true, maxlength: 500 },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

inventoryCountTaskSchema.index({ schedule: 1, countDate: 1 }, { unique: true });
inventoryCountTaskSchema.index({ status: 1, countDate: -1 });

const InventoryCountTask = mongoose.model<IInventoryCountTask>(
  'InventoryCountTask',
  inventoryCountTaskSchema
);

export default InventoryCountTask;
