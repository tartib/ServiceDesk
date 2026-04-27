import mongoose, { Document, Schema } from 'mongoose';

export interface IStockBalance extends Document {
  part: mongoose.Types.ObjectId;
  warehouse: mongoose.Types.ObjectId;
  location?: mongoose.Types.ObjectId;
  inStock: number;
  booked: number;
  available: number;
  averageCost: number;
  lastMovementAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const stockBalanceSchema = new Schema<IStockBalance>(
  {
    part: {
      type: Schema.Types.ObjectId,
      ref: 'InventoryItem',
      required: true,
    },
    warehouse: {
      type: Schema.Types.ObjectId,
      ref: 'InvWarehouse',
      required: true,
    },
    location: {
      type: Schema.Types.ObjectId,
      ref: 'WarehouseLocation',
    },
    inStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    booked: {
      type: Number,
      default: 0,
      min: 0,
    },
    available: {
      type: Number,
      default: 0,
    },
    averageCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastMovementAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

stockBalanceSchema.index({ part: 1, warehouse: 1, location: 1 }, { unique: true });
stockBalanceSchema.index({ part: 1, warehouse: 1 });
stockBalanceSchema.index({ warehouse: 1 });
stockBalanceSchema.index({ available: 1 });

const StockBalance = mongoose.model<IStockBalance>('StockBalance', stockBalanceSchema);

export default StockBalance;
