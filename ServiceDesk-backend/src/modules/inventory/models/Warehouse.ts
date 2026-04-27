import mongoose, { Document, Schema } from 'mongoose';
import { WarehouseStatus } from '../types';

export interface IWarehouse extends Document {
  warehouseName: string;
  warehouseNameAr?: string;
  code: string;
  address?: string;
  isDefault: boolean;
  status: WarehouseStatus;
  createdAt: Date;
  updatedAt: Date;
}

const warehouseSchema = new Schema<IWarehouse>(
  {
    warehouseName: {
      type: String,
      required: [true, 'Warehouse name is required'],
      trim: true,
      maxlength: 150,
    },
    warehouseNameAr: {
      type: String,
      trim: true,
      maxlength: 150,
    },
    code: {
      type: String,
      required: [true, 'Warehouse code is required'],
      unique: true,
      trim: true,
      maxlength: 20,
    },
    address: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: Object.values(WarehouseStatus),
      default: WarehouseStatus.ACTIVE,
    },
  },
  { timestamps: true }
);

warehouseSchema.index({ code: 1 }, { unique: true });
warehouseSchema.index({ status: 1 });
warehouseSchema.index({ isDefault: 1 });

const InvWarehouse = mongoose.model<IWarehouse>('InvWarehouse', warehouseSchema);

export default InvWarehouse;
