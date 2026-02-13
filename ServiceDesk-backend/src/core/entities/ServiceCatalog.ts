import mongoose, { Document, Schema } from 'mongoose';
import {
  ServiceCategory,
  FulfillmentType,
  IDynamicFormField,
  IServiceWorkflow,
  FormFieldType,
} from '../types/itsm.types';

export interface IServiceCatalogItem extends Document {
  service_id: string;
  category: ServiceCategory;
  name: string;
  name_ar?: string;
  description: string;
  description_ar?: string;
  icon?: string;
  image?: string;
  form: IDynamicFormField[];
  workflow: IServiceWorkflow;
  fulfillment: {
    type: FulfillmentType;
    automation_script?: string;
    estimated_hours: number;
  };
  pricing?: {
    cost: number;
    currency: string;
    billing_type: 'one_time' | 'recurring' | 'free';
  };
  availability: {
    is_active: boolean;
    available_to: string[];
    blackout_dates?: Date[];
    requires_approval: boolean;
  };
  metrics: {
    total_requests: number;
    avg_fulfillment_hours: number;
    satisfaction_score: number;
  };
  tags?: string[];
  order: number;
  site_id?: string;
  created_at: Date;
  updated_at: Date;
}

const FormFieldSchema = new Schema<IDynamicFormField>(
  {
    field_id: { type: String, required: true },
    label: { type: String, required: true },
    label_ar: { type: String },
    type: {
      type: String,
      enum: Object.values(FormFieldType),
      required: true,
    },
    required: { type: Boolean, default: false },
    placeholder: { type: String },
    default_value: { type: Schema.Types.Mixed },
    options: [
      {
        value: { type: String, required: true },
        label: { type: String, required: true },
        label_ar: { type: String },
      },
    ],
    validation: {
      min: { type: Number },
      max: { type: Number },
      pattern: { type: String },
      message: { type: String },
    },
    order: { type: Number, default: 0 },
    depends_on: {
      field_id: { type: String },
      value: { type: Schema.Types.Mixed },
    },
  },
  { _id: false }
);

const ApprovalStepSchema = new Schema(
  {
    step: { type: Number, required: true },
    approver_type: {
      type: String,
      enum: ['role', 'user', 'group'],
      required: true,
    },
    approver_id: { type: String, required: true },
    approver_name: { type: String, required: true },
    is_optional: { type: Boolean, default: false },
    auto_approve_after_hours: { type: Number },
  },
  { _id: false }
);

const WorkflowSchema = new Schema<IServiceWorkflow>(
  {
    approval_chain: { type: [ApprovalStepSchema], default: [] },
    auto_assign_group: { type: String },
    auto_assign_user: { type: String },
    sla_id: { type: String, required: true },
    notification_template: { type: String },
  },
  { _id: false }
);

const FulfillmentSchema = new Schema(
  {
    type: {
      type: String,
      enum: Object.values(FulfillmentType),
      default: FulfillmentType.MANUAL,
    },
    automation_script: { type: String },
    estimated_hours: { type: Number, default: 24 },
  },
  { _id: false }
);

const PricingSchema = new Schema(
  {
    cost: { type: Number, default: 0 },
    currency: { type: String, default: 'SAR' },
    billing_type: {
      type: String,
      enum: ['one_time', 'recurring', 'free'],
      default: 'free',
    },
  },
  { _id: false }
);

const AvailabilitySchema = new Schema(
  {
    is_active: { type: Boolean, default: true },
    available_to: { type: [String], default: ['all'] },
    blackout_dates: { type: [Date], default: [] },
    requires_approval: { type: Boolean, default: true },
  },
  { _id: false }
);

const MetricsSchema = new Schema(
  {
    total_requests: { type: Number, default: 0 },
    avg_fulfillment_hours: { type: Number, default: 0 },
    satisfaction_score: { type: Number, default: 0 },
  },
  { _id: false }
);

const ServiceCatalogSchema = new Schema<IServiceCatalogItem>(
  {
    service_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    category: {
      type: String,
      enum: Object.values(ServiceCategory),
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Service name is required'],
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
      required: [true, 'Description is required'],
      maxlength: 1000,
    },
    description_ar: {
      type: String,
      maxlength: 1000,
    },
    icon: {
      type: String,
    },
    image: {
      type: String,
    },
    form: {
      type: [FormFieldSchema],
      default: [],
    },
    workflow: {
      type: WorkflowSchema,
      required: true,
    },
    fulfillment: {
      type: FulfillmentSchema,
      default: () => ({
        type: FulfillmentType.MANUAL,
        estimated_hours: 24,
      }),
    },
    pricing: {
      type: PricingSchema,
    },
    availability: {
      type: AvailabilitySchema,
      default: () => ({
        is_active: true,
        available_to: ['all'],
        blackout_dates: [],
        requires_approval: true,
      }),
    },
    metrics: {
      type: MetricsSchema,
      default: () => ({
        total_requests: 0,
        avg_fulfillment_hours: 0,
        satisfaction_score: 0,
      }),
    },
    tags: {
      type: [String],
      default: [],
    },
    order: {
      type: Number,
      default: 0,
    },
    site_id: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Compound indexes
ServiceCatalogSchema.index({ category: 1, 'availability.is_active': 1, order: 1 });
ServiceCatalogSchema.index({ 'availability.is_active': 1, order: 1 });

// Virtual for is free
ServiceCatalogSchema.virtual('is_free').get(function () {
  return !this.pricing || this.pricing.billing_type === 'free' || this.pricing.cost === 0;
});

// Include virtuals in JSON
ServiceCatalogSchema.set('toJSON', { virtuals: true });
ServiceCatalogSchema.set('toObject', { virtuals: true });

const ServiceCatalog = mongoose.model<IServiceCatalogItem>('ServiceCatalog', ServiceCatalogSchema);

export default ServiceCatalog;
