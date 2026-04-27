import mongoose, { Document, Schema } from 'mongoose';
import { ItemStatus } from '../types';

export interface IInventoryItem extends Document {
  partNo: string;
  partDescription: string;
  partDescriptionAr?: string;
  groupName: string;
  uom: string;
  cost: number;
  minStock: number;
  maxStock: number;
  reorderLevel: number;
  image?: string;
  status: ItemStatus;
  createdAt: Date;
  updatedAt: Date;
}

const inventoryItemSchema = new Schema<IInventoryItem>(
  {
    partNo: {
      type: String,
      required: [true, 'Part number is required'],
      unique: true,
      trim: true,
      maxlength: 50,
    },
    partDescription: {
      type: String,
      required: [true, 'Part description is required'],
      trim: true,
      maxlength: 300,
    },
    partDescriptionAr: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    groupName: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      maxlength: 100,
    },
    uom: {
      type: String,
      required: [true, 'Unit of measure is required'],
      trim: true,
      maxlength: 20,
    },
    cost: {
      type: Number,
      default: 0,
      min: [0, 'Cost cannot be negative'],
    },
    minStock: {
      type: Number,
      default: 0,
      min: [0, 'Min stock cannot be negative'],
    },
    maxStock: {
      type: Number,
      default: 0,
      min: [0, 'Max stock cannot be negative'],
    },
    reorderLevel: {
      type: Number,
      default: 0,
      min: [0, 'Reorder level cannot be negative'],
    },
    image: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(ItemStatus),
      default: ItemStatus.ACTIVE,
    },
  },
  { timestamps: true }
);

inventoryItemSchema.index({ groupName: 1 });
inventoryItemSchema.index({ status: 1 });
inventoryItemSchema.index({ partNo: 1 }, { unique: true });

const InventoryItem = mongoose.model<IInventoryItem>('InventoryItem', inventoryItemSchema);

export default InventoryItem;
