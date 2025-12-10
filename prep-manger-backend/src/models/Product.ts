import mongoose, { Document, Schema } from 'mongoose';

export interface IIngredient {
  ingredientId: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  unit: string;
}

export interface IProduct extends Document {
  name: string;
  nameAr?: string;
  description?: string;
  category: string;
  image?: string;
  prepTimeMinutes: number;
  prepIntervalHours: number;
  ingredients: IIngredient[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ingredientSchema = new Schema<IIngredient>(
  {
    ingredientId: {
      type: Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
      enum: ['kg', 'g', 'l', 'ml', 'pcs', 'cup', 'tbsp', 'tsp'],
    },
  },
  { _id: false }
);

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: 100,
    },
    nameAr: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
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
    prepTimeMinutes: {
      type: Number,
      required: [true, 'Prep time is required'],
      min: 1,
    },
    prepIntervalHours: {
      type: Number,
      required: [true, 'Prep interval is required'],
      min: 1,
      default: 24,
    },
    ingredients: {
      type: [ingredientSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
productSchema.index({ name: 1, isActive: 1 });
productSchema.index({ category: 1 });

// Transform image URL to full URL on JSON output
productSchema.set('toJSON', {
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

productSchema.set('toObject', {
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

const Product = mongoose.model<IProduct>('Product', productSchema);

export default Product;
