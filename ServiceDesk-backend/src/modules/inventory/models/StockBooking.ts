import mongoose, { Document, Schema } from 'mongoose';
import { BookingStatus } from '../types';

export interface IStockBooking extends Document {
  part: mongoose.Types.ObjectId;
  warehouse: mongoose.Types.ObjectId;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  status: BookingStatus;
  releasedBy?: mongoose.Types.ObjectId;
  releasedAt?: Date;
  cancelledBy?: mongoose.Types.ObjectId;
  cancelledAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const stockBookingSchema = new Schema<IStockBooking>(
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
    referenceType: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    referenceId: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.ACTIVE,
    },
    releasedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    releasedAt: { type: Date },
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

stockBookingSchema.index({ status: 1 });
stockBookingSchema.index({ referenceType: 1, referenceId: 1 });
stockBookingSchema.index({ createdAt: -1 });

const StockBooking = mongoose.model<IStockBooking>('StockBooking', stockBookingSchema);

export default StockBooking;
