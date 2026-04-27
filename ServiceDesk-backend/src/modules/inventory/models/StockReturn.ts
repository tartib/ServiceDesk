import mongoose, { Document, Schema } from 'mongoose';
import { ReturnCondition } from '../types';

export interface IStockReturn extends Document {
  part: mongoose.Types.ObjectId;
  warehouse: mongoose.Types.ObjectId;
  quantity: number;
  originalIssueId?: mongoose.Types.ObjectId;
  returnedBy?: string;
  condition: ReturnCondition;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const stockReturnSchema = new Schema<IStockReturn>(
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
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be greater than 0'],
    },
    originalIssueId: {
      type: Schema.Types.ObjectId,
      ref: 'StockIssue',
    },
    returnedBy: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    condition: {
      type: String,
      enum: Object.values(ReturnCondition),
      required: [true, 'Return condition is required'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

stockReturnSchema.index({ createdAt: -1 });

const StockReturn = mongoose.model<IStockReturn>('StockReturn', stockReturnSchema);

export default StockReturn;
