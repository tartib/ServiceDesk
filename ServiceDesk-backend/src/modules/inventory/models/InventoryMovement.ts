import mongoose, { Document, Schema } from 'mongoose';
import { MovementType } from '../types';

export interface IInventoryMovement extends Document {
  part: mongoose.Types.ObjectId;
  warehouse: mongoose.Types.ObjectId;
  location?: mongoose.Types.ObjectId;
  movementType: MovementType;
  quantity: number;
  beforeInStock: number;
  afterInStock: number;
  beforeBooked: number;
  afterBooked: number;
  beforeAvailable: number;
  afterAvailable: number;
  referenceType?: string;
  referenceId?: string;
  referenceNo?: string;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const inventoryMovementSchema = new Schema<IInventoryMovement>(
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
    movementType: {
      type: String,
      enum: Object.values(MovementType),
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    beforeInStock: { type: Number, required: true },
    afterInStock: { type: Number, required: true },
    beforeBooked: { type: Number, required: true },
    afterBooked: { type: Number, required: true },
    beforeAvailable: { type: Number, required: true },
    afterAvailable: { type: Number, required: true },
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
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

inventoryMovementSchema.index({ part: 1, createdAt: -1 });
inventoryMovementSchema.index({ warehouse: 1, createdAt: -1 });
inventoryMovementSchema.index({ movementType: 1 });
inventoryMovementSchema.index({ referenceType: 1, referenceId: 1 });
inventoryMovementSchema.index({ createdAt: -1 });

const InventoryMovement = mongoose.model<IInventoryMovement>('InventoryMovement', inventoryMovementSchema);

export default InventoryMovement;
