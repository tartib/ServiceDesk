import mongoose, { Document, Schema } from 'mongoose';
import { ReceiptStatus } from '../types';

export interface IStockReceipt extends Document {
  part: mongoose.Types.ObjectId;
  warehouse: mongoose.Types.ObjectId;
  location?: mongoose.Types.ObjectId;
  quantity: number;
  supplierId?: string;
  referenceNo?: string;
  notes?: string;
  status: ReceiptStatus;
  confirmedBy?: mongoose.Types.ObjectId;
  confirmedAt?: Date;
  cancelledBy?: mongoose.Types.ObjectId;
  cancelledAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const stockReceiptSchema = new Schema<IStockReceipt>(
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
    location: {
      type: Schema.Types.ObjectId,
      ref: 'WarehouseLocation',
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be greater than 0'],
    },
    supplierId: {
      type: String,
      trim: true,
    },
    referenceNo: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: Object.values(ReceiptStatus),
      default: ReceiptStatus.DRAFT,
    },
    confirmedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    confirmedAt: { type: Date },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cancelledAt: { type: Date },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

stockReceiptSchema.index({ status: 1 });
stockReceiptSchema.index({ createdAt: -1 });

const StockReceipt = mongoose.model<IStockReceipt>('StockReceipt', stockReceiptSchema);

export default StockReceipt;
