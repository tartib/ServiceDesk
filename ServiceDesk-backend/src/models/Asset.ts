import mongoose, { Document, Schema } from 'mongoose';

export enum AssetType {
  HARDWARE = 'hardware',
  SOFTWARE = 'software',
  NETWORK = 'network',
  CLOUD = 'cloud',
  VIRTUAL = 'virtual',
  PERIPHERAL = 'peripheral',
  MOBILE = 'mobile',
  OTHER = 'other',
}

export enum AssetStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  IN_STOCK = 'in_stock',
  IN_MAINTENANCE = 'in_maintenance',
  RETIRED = 'retired',
  DISPOSED = 'disposed',
  LOST = 'lost',
  RESERVED = 'reserved',
}

export enum AssetCondition {
  NEW = 'new',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  DAMAGED = 'damaged',
}

export interface IAsset extends Document {
  asset_id: string;
  name: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  type: AssetType;
  status: AssetStatus;
  condition: AssetCondition;
  
  // Identification
  serial_number?: string;
  barcode?: string;
  qr_code?: string;
  asset_model?: string;
  manufacturer?: string;
  
  // Classification
  category_id?: string;
  subcategory?: string;
  tags?: string[];
  
  // Location & Assignment
  location?: {
    building?: string;
    floor?: string;
    room?: string;
    rack?: string;
    position?: string;
  };
  assigned_to?: {
    user_id?: string;
    user_name?: string;
    department?: string;
    assigned_date?: Date;
  };
  
  // Financial
  purchase_info?: {
    vendor?: string;
    purchase_date?: Date;
    purchase_price?: number;
    currency?: string;
    invoice_number?: string;
    po_number?: string;
  };
  warranty?: {
    start_date?: Date;
    end_date?: Date;
    provider?: string;
    type?: string;
    notes?: string;
  };
  depreciation?: {
    method?: 'straight_line' | 'declining_balance';
    useful_life_years?: number;
    salvage_value?: number;
    current_value?: number;
  };
  
  // Technical Specs (flexible for different asset types)
  specifications?: Record<string, unknown>;
  
  // Software specific
  software_info?: {
    version?: string;
    license_key?: string;
    license_type?: 'perpetual' | 'subscription' | 'open_source' | 'trial';
    license_count?: number;
    expiry_date?: Date;
  };
  
  // Network/Hardware specific
  network_info?: {
    ip_address?: string;
    mac_address?: string;
    hostname?: string;
    domain?: string;
  };
  
  // Relationships
  parent_asset_id?: string;
  child_assets?: string[];
  related_assets?: {
    asset_id: string;
    relationship_type: 'depends_on' | 'runs_on' | 'connected_to' | 'installed_on' | 'backup_of';
  }[];
  
  // Linked records
  linked_incidents?: string[];
  linked_changes?: string[];
  linked_problems?: string[];
  
  // Maintenance
  maintenance_schedule?: {
    frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    last_maintenance?: Date;
    next_maintenance?: Date;
    notes?: string;
  };
  
  // Audit
  created_by?: string;
  updated_by?: string;
  created_at: Date;
  updated_at: Date;
  
  // Custom fields
  custom_fields?: Record<string, unknown>;
}

const AssetSchema = new Schema<IAsset>(
  {
    asset_id: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    name_ar: {
      type: String,
      trim: true,
    },
    description: String,
    description_ar: String,
    type: {
      type: String,
      enum: Object.values(AssetType),
      required: true,
      default: AssetType.HARDWARE,
    },
    status: {
      type: String,
      enum: Object.values(AssetStatus),
      default: AssetStatus.IN_STOCK,
    },
    condition: {
      type: String,
      enum: Object.values(AssetCondition),
      default: AssetCondition.NEW,
    },
    serial_number: { type: String, index: true },
    barcode: { type: String, index: true },
    qr_code: String,
    asset_model: String,
    manufacturer: String,
    category_id: String,
    subcategory: String,
    tags: [String],
    location: {
      building: String,
      floor: String,
      room: String,
      rack: String,
      position: String,
    },
    assigned_to: {
      user_id: String,
      user_name: String,
      department: String,
      assigned_date: Date,
    },
    purchase_info: {
      vendor: String,
      purchase_date: Date,
      purchase_price: Number,
      currency: { type: String, default: 'SAR' },
      invoice_number: String,
      po_number: String,
    },
    warranty: {
      start_date: Date,
      end_date: Date,
      provider: String,
      type: String,
      notes: String,
    },
    depreciation: {
      method: { type: String, enum: ['straight_line', 'declining_balance'] },
      useful_life_years: Number,
      salvage_value: Number,
      current_value: Number,
    },
    specifications: Schema.Types.Mixed,
    software_info: {
      version: String,
      license_key: String,
      license_type: { type: String, enum: ['perpetual', 'subscription', 'open_source', 'trial'] },
      license_count: Number,
      expiry_date: Date,
    },
    network_info: {
      ip_address: String,
      mac_address: String,
      hostname: String,
      domain: String,
    },
    parent_asset_id: String,
    child_assets: [String],
    related_assets: [{
      asset_id: String,
      relationship_type: {
        type: String,
        enum: ['depends_on', 'runs_on', 'connected_to', 'installed_on', 'backup_of'],
      },
    }],
    linked_incidents: [String],
    linked_changes: [String],
    linked_problems: [String],
    maintenance_schedule: {
      frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] },
      last_maintenance: Date,
      next_maintenance: Date,
      notes: String,
    },
    created_by: String,
    updated_by: String,
    custom_fields: Schema.Types.Mixed,
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
AssetSchema.index({ name: 'text', description: 'text', serial_number: 'text' });
AssetSchema.index({ type: 1, status: 1 });
AssetSchema.index({ 'assigned_to.user_id': 1 });
AssetSchema.index({ 'assigned_to.department': 1 });
AssetSchema.index({ category_id: 1 });
AssetSchema.index({ created_at: -1 });

// Auto-generate asset_id
AssetSchema.pre('save', async function (next) {
  if (!this.asset_id) {
    const year = new Date().getFullYear();
    const prefix = this.type.substring(0, 3).toUpperCase();
    const count = await Asset.countDocuments({ type: this.type });
    this.asset_id = `${prefix}-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

export const Asset = mongoose.model<IAsset>('Asset', AssetSchema);
