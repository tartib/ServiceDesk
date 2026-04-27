import mongoose, { Document, Schema } from 'mongoose';
import { TransferStatus } from '../types';

export interface IStockTransfer extends Document {
  part: mongoose.Types.ObjectId;
  sourceWarehouse: mongoose.Types.ObjectId;
  destinationWarehouse: mongoose.Types.ObjectId;
  quantity: number;
  referenceNo?: string;
  notes?: string;
  status: TransferStatus;
  completedBy?: mongoose.Types.ObjectId;
  completedAt?: Date;
  cancelledBy?: mongoose.Types.ObjectId;
  cancelledAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const stockTransferSchema = new Schema<IStockTransfer>(
  {
    part: {
      type: Schema.Types.ObjectId,
      ref: 'InventoryItem',
      required: true,
      index: true,
    },
    sourceWarehouse: {
      type: Schema.Types.ObjectId,
      ref: 'InvWarehouse',
      required: true,
      index: true,
    },
    destinationWarehouse: {
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
      enum: Object.values(TransferStatus),
      default: TransferStatus.PENDING,
    },
    completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    completedAt: { type: Date },
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

stockTransferSchema.index({ status: 1 });
stockTransferSchema.index({ createdAt: -1 });

const InvStockTransfer = mongoose.model<IStockTransfer>('InvStockTransfer', stockTransferSchema);

export default InvStockTransfer;
