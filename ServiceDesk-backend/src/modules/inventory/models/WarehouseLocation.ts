import mongoose, { Document, Schema } from 'mongoose';
import { LocationStatus } from '../types';

export interface IWarehouseLocation extends Document {
  warehouse: mongoose.Types.ObjectId;
  locationName: string;
  binCode: string;
  status: LocationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const warehouseLocationSchema = new Schema<IWarehouseLocation>(
  {
    warehouse: {
      type: Schema.Types.ObjectId,
      ref: 'InvWarehouse',
      required: true,
      index: true,
    },
    locationName: {
      type: String,
      required: [true, 'Location name is required'],
      trim: true,
      maxlength: 100,
    },
    binCode: {
      type: String,
      required: [true, 'Bin code is required'],
      trim: true,
      maxlength: 30,
    },
    status: {
      type: String,
      enum: Object.values(LocationStatus),
      default: LocationStatus.ACTIVE,
    },
  },
  { timestamps: true }
);

warehouseLocationSchema.index({ warehouse: 1, binCode: 1 }, { unique: true });

const WarehouseLocation = mongoose.model<IWarehouseLocation>('WarehouseLocation', warehouseLocationSchema);

export default WarehouseLocation;
