import mongoose, { Document, Schema } from 'mongoose';
import { InventoryStatus } from '../types';

export interface IInventory extends Document {
  name: string;
  nameAr?: string;
  category: string;
  image?: string;
  currentQuantity: number;
  unit: string;
  minThreshold: number;
  maxThreshold: number;
  status: InventoryStatus;
  lastRestocked?: Date;
  supplier?: string;
  cost?: number;
  createdAt: Date;
  updatedAt: Date;
}

const inventorySchema = new Schema<IInventory>(
  {
    name: {
      type: String,
      required: [true, 'Ingredient name is required'],
      trim: true,
      unique: true,
      maxlength: 100,
    },
    nameAr: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    currentQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    unit: {
      type: String,
      required: true,
      enum: ['kg', 'g', 'l', 'ml', 'pcs', 'cup', 'tbsp', 'tsp'],
    },
    minThreshold: {
      type: Number,
      required: true,
      min: 0,
    },
    maxThreshold: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(InventoryStatus),
      default: InventoryStatus.IN_STOCK,
    },
    lastRestocked: {
      type: Date,
    },
    supplier: {
      type: String,
      trim: true,
    },
    cost: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
inventorySchema.index({ name: 1 });
inventorySchema.index({ status: 1 });
inventorySchema.index({ category: 1 });

// Pre-save middleware to update status based on quantity
inventorySchema.pre('save', function (next) {
  if (this.currentQuantity <= 0) {
    this.status = InventoryStatus.OUT_OF_STOCK;
  } else if (this.currentQuantity <= this.minThreshold) {
    this.status = InventoryStatus.LOW_STOCK;
  } else {
    this.status = InventoryStatus.IN_STOCK;
  }
  next();
});

// Transform image URL to full URL on JSON output
inventorySchema.set('toJSON', {
  transform: (_doc, ret) => {
    if (ret.image && typeof ret.image === 'string') {
      if (!ret.image.startsWith('http')) {
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
        (ret as { image: string | null }).image = `${baseUrl}${ret.image}`;
      }
    } else {
      (ret as { image: string | null }).image = null;
    }
    return ret;
  },
});

inventorySchema.set('toObject', {
  transform: (_doc, ret) => {
    if (ret.image && typeof ret.image === 'string') {
      if (!ret.image.startsWith('http')) {
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
        (ret as { image: string | null }).image = `${baseUrl}${ret.image}`;
      }
    } else {
      (ret as { image: string | null }).image = null;
    }
    return ret;
  },
});

const Inventory = mongoose.model<IInventory>('Inventory', inventorySchema);

export default Inventory;
