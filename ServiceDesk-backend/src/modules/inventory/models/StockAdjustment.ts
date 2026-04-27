import mongoose, { Document, Schema } from 'mongoose';
import { AdjustmentType } from '../types';

export interface IStockAdjustment extends Document {
  part: mongoose.Types.ObjectId;
  warehouse: mongoose.Types.ObjectId;
  adjustmentType: AdjustmentType;
  quantity: number;
  reason: string;
  notes?: string;
  beforeInStock: number;
  afterInStock: number;
  beforeBooked: number;
  afterBooked: number;
  beforeAvailable: number;
  afterAvailable: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const stockAdjustmentSchema = new Schema<IStockAdjustment>(
  {
    part: {
      type: Schema.Types.ObjectId,
      ref: 'InventoryItem',
      required: true,
      index: true,
    },
    warehouse: {
      type: Schema.Types.ObjectId,
      ref: 'InvWarehouse',
      required: true,
      index: true,
    },
    adjustmentType: {
      type: String,
      enum: Object.values(AdjustmentType),
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Quantity cannot be negative'],
    },
    reason: {
      type: String,
      required: [true, 'Reason is required for adjustments'],
      trim: true,
      maxlength: 300,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    beforeInStock: { type: Number, required: true },
    afterInStock: { type: Number, required: true },
    beforeBooked: { type: Number, required: true },
    afterBooked: { type: Number, required: true },
    beforeAvailable: { type: Number, required: true },
    afterAvailable: { type: Number, required: true },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

stockAdjustmentSchema.index({ createdAt: -1 });

const StockAdjustment = mongoose.model<IStockAdjustment>('StockAdjustment', stockAdjustmentSchema);

export default StockAdjustment;
