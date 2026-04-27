import mongoose, { Document, Schema } from 'mongoose';

export interface IStockIssue extends Document {
  part: mongoose.Types.ObjectId;
  warehouse: mongoose.Types.ObjectId;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  issuedTo?: string;
  bookingId?: mongoose.Types.ObjectId;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const stockIssueSchema = new Schema<IStockIssue>(
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
    issuedTo: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'StockBooking',
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

stockIssueSchema.index({ referenceType: 1, referenceId: 1 });
stockIssueSchema.index({ createdAt: -1 });

const StockIssue = mongoose.model<IStockIssue>('StockIssue', stockIssueSchema);

export default StockIssue;
