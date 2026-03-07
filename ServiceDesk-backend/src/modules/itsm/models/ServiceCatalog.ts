import mongoose, { Document, Schema } from 'mongoose';

/**
 * Service Catalog Item Status
 */
export enum ServiceStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  RETIRED = 'retired',
}

/**
 * Service Category
 */
export enum ServiceCategory {
  IT = 'IT',
  HR = 'HR',
  FACILITIES = 'facilities',
  PROCUREMENT = 'procurement',
  FINANCE = 'finance',
  SECURITY = 'security',
  OTHER = 'other',
}

/**
 * Service Fulfillment Type
 */
export enum FulfillmentType {
  MANUAL = 'manual',
  AUTOMATED = 'automated',
  HYBRID = 'hybrid',
}

/**
 * Service Visibility
 */
export enum ServiceVisibility {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  RESTRICTED = 'restricted',
}

/**
 * Field Type for Dynamic Forms
 */
export enum FormFieldType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  NUMBER = 'number',
  EMAIL = 'email',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  DATE = 'date',
  DATETIME = 'datetime',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  FILE = 'file',
  USER = 'user',
  DEPARTMENT = 'department',
  ASSET = 'asset',
}

/**
 * Form Field Configuration
 */
export interface IFormField {
  id: string;
  type: FormFieldType;
  label: string;
  labelAr?: string;
  placeholder?: string;
  placeholderAr?: string;
  helpText?: string;
  helpTextAr?: string;
  required: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  options?: {
    value: string;
    label: string;
    labelAr?: string;
  }[];
  defaultValue?: unknown;
  order: number;
  conditionalDisplay?: {
    dependsOnField: string;
    showWhenValue: string;
  };
}

/**
 * Service Catalog Item Interface
 */
export interface IServiceCatalogItem extends Document {
  serviceId: string;
  name: string;
  nameAr?: string;
  description: string;
  descriptionAr?: string;
  shortDescription?: string;
  shortDescriptionAr?: string;
  
  // Categorization
  category: ServiceCategory;
  subcategory?: string;
  tags: string[];
  
  // Icon and Appearance
  icon?: string;
  color?: string;
  featured: boolean;
  
  // Request Configuration
  requestForm: {
    fields: IFormField[];
    validationMessage?: string;
    validationMessageAr?: string;
  };
  
  // Workflow and Fulfillment
  workflowId?: string;
  approvalRequired: boolean;
  approvers?: {
    type: 'user' | 'role' | 'manager' | 'department_head';
    value: string;
  }[];
  fulfillmentType: FulfillmentType;
  fulfillmentTeam?: string;
  autoAssignee?: string;
  estimatedFulfillmentTime?: number; // in hours
  
  // SLA Configuration
  slaTemplateId?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // Visibility
  visibility: ServiceVisibility;
  allowedRoles: string[];
  allowedDepartments?: string[];
  
  // Status
  status: ServiceStatus;
  order: number;
  
  // Statistics
  stats: {
    totalRequests: number;
    completedRequests: number;
    avgFulfillmentTime: number;
    satisfactionScore: number;
    lastRequestedAt?: Date;
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

// Schema
const FormFieldSchema = new Schema(
  {
    id: { type: String, required: true },
    type: { type: String, enum: Object.values(FormFieldType), required: true },
    label: { type: String, required: true },
    labelAr: String,
    placeholder: String,
    placeholderAr: String,
    helpText: String,
    helpTextAr: String,
    required: { type: Boolean, default: false },
    validation: {
      min: Number,
      max: Number,
      pattern: String,
      message: String,
    },
    options: [
      {
        value: { type: String, required: true },
        label: { type: String, required: true },
        labelAr: String,
      },
    ],
    defaultValue: Schema.Types.Mixed,
    order: { type: Number, default: 0 },
    conditionalDisplay: {
      dependsOnField: String,
      showWhenValue: String,
    },
  },
  { _id: false }
);

const ServiceCatalogSchema = new Schema<IServiceCatalogItem>(
  {
    serviceId: {
      type: String,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    nameAr: String,
    description: {
      type: String,
      required: true,
    },
    descriptionAr: String,
    shortDescription: String,
    shortDescriptionAr: String,
    
    category: {
      type: String,
      enum: Object.values(ServiceCategory),
      required: true,
      index: true,
    },
    subcategory: String,
    tags: [{ type: String }],
    
    icon: String,
    color: String,
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    
    requestForm: {
      fields: [FormFieldSchema],
      validationMessage: String,
      validationMessageAr: String,
    },
    
    workflowId: String,
    approvalRequired: {
      type: Boolean,
      default: false,
    },
    approvers: [
      {
        type: {
          type: String,
          enum: ['user', 'role', 'manager', 'department_head'],
          required: true,
        },
        value: { type: String, required: true },
      },
    ],
    fulfillmentType: {
      type: String,
      enum: Object.values(FulfillmentType),
      default: FulfillmentType.MANUAL,
    },
    fulfillmentTeam: String,
    autoAssignee: String,
    estimatedFulfillmentTime: Number,
    
    slaTemplateId: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    
    visibility: {
      type: String,
      enum: Object.values(ServiceVisibility),
      default: ServiceVisibility.INTERNAL,
    },
    allowedRoles: [{ type: String }],
    allowedDepartments: [{ type: String }],
    
    status: {
      type: String,
      enum: Object.values(ServiceStatus),
      default: ServiceStatus.DRAFT,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    
    stats: {
      totalRequests: { type: Number, default: 0 },
      completedRequests: { type: Number, default: 0 },
      avgFulfillmentTime: { type: Number, default: 0 },
      satisfactionScore: { type: Number, default: 0 },
      lastRequestedAt: Date,
    },
    
    createdBy: {
      type: String,
      required: true,
    },
    updatedBy: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
ServiceCatalogSchema.index({ category: 1, status: 1 });
ServiceCatalogSchema.index({ visibility: 1, allowedRoles: 1 });
ServiceCatalogSchema.index({ tags: 1 });
ServiceCatalogSchema.index({ status: 1, featured: -1, order: 1 });

// Pre-save hook to generate serviceId
ServiceCatalogSchema.pre('save', async function (next) {
  if (!this.serviceId) {
    const count = await mongoose.model('ServiceCatalog').countDocuments();
    this.serviceId = `SRV-${Date.now()}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Remove any previously-registered model (e.g. legacy core/entities/ServiceCatalog)
// so this module's schema takes precedence.
if (mongoose.models.ServiceCatalog) {
  delete mongoose.models.ServiceCatalog;
  delete (mongoose.connection as any).collections['servicecatalogs'];
}

export const ServiceCatalog = mongoose.model<IServiceCatalogItem>('ServiceCatalog', ServiceCatalogSchema);
export default ServiceCatalog;
