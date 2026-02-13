import mongoose, { Document, Schema } from 'mongoose';

export enum StockMovementType {
  RESTOCK = 'restock',
  ADJUSTMENT_ADD = 'adjustment_add',
  ADJUSTMENT_REMOVE = 'adjustment_remove',
  USAGE = 'usage',
  DAMAGED = 'damaged',
  EXPIRED = 'expired',
  RETURNED = 'returned',
}

export interface IStockHistory extends Document {
  inventoryItem: mongoose.Types.ObjectId;
  movementType: StockMovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  performedBy: mongoose.Types.ObjectId;
  referenceId?: string;
  notes?: string;
  createdAt: Date;
}

const stockHistorySchema = new Schema<IStockHistory>(
  {
    inventoryItem: {
      type: Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true,
      index: true,
    },
    movementType: {
      type: String,
      enum: Object.values(StockMovementType),
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    previousQuantity: {
      type: Number,
      required: true,
    },
    newQuantity: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      trim: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    referenceId: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

stockHistorySchema.index({ inventoryItem: 1, createdAt: -1 });
stockHistorySchema.index({ movementType: 1 });
stockHistorySchema.index({ performedBy: 1 });

const StockHistory = mongoose.model<IStockHistory>('StockHistory', stockHistorySchema);

export default StockHistory;
