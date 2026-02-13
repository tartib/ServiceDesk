import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  category_id: string;
  name: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  parent_id?: string;
  icon?: string;
  color?: string;
  default_sla_id?: string;
  default_assignment_group?: string;
  applies_to: ('incident' | 'problem' | 'change' | 'service_request')[];
  subcategories?: Array<{
    subcategory_id: string;
    name: string;
    name_ar?: string;
    description?: string;
    default_sla_id?: string;
    default_assignment_group?: string;
    is_active: boolean;
  }>;
  order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const SubcategorySchema = new Schema(
  {
    subcategory_id: { type: String, required: true },
    name: { type: String, required: true },
    name_ar: { type: String },
    description: { type: String },
    default_sla_id: { type: String },
    default_assignment_group: { type: String },
    is_active: { type: Boolean, default: true },
  },
  { _id: false }
);

const CategorySchema = new Schema<ICategory>(
  {
    category_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: 100,
    },
    name_ar: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    description_ar: {
      type: String,
      maxlength: 500,
    },
    parent_id: {
      type: String,
      index: true,
    },
    icon: {
      type: String,
    },
    color: {
      type: String,
    },
    default_sla_id: {
      type: String,
    },
    default_assignment_group: {
      type: String,
    },
    applies_to: {
      type: [String],
      enum: ['incident', 'problem', 'change', 'service_request'],
      default: ['incident'],
    },
    subcategories: {
      type: [SubcategorySchema],
      default: [],
    },
    order: {
      type: Number,
      default: 0,
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Compound indexes
CategorySchema.index({ is_active: 1, order: 1 });
CategorySchema.index({ applies_to: 1, is_active: 1 });

// Virtual for full path
CategorySchema.virtual('has_subcategories').get(function () {
  return this.subcategories && this.subcategories.length > 0;
});

// Include virtuals in JSON
CategorySchema.set('toJSON', { virtuals: true });
CategorySchema.set('toObject', { virtuals: true });

const ITSMCategory = mongoose.model<ICategory>('ITSMCategory', CategorySchema);

export default ITSMCategory;
