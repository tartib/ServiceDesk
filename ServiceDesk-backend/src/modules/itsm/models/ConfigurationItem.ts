import mongoose, { Schema, Document } from 'mongoose';

/**
 * CMDB (Configuration Management Database) Models
 * Based on the ITSM Platform PRD - Phase 2
 */

// CI Relationship Types
export enum CIRelationshipType {
  DEPENDS_ON = 'depends_on',
  CONNECTS_TO = 'connects_to',
  HOSTS = 'hosts',
  INSTALLED_ON = 'installed_on',
  PART_OF = 'part_of',
  RUNS_ON = 'runs_on',
  VIRTUALIZED_ON = 'virtualized_on',
  BACKUP_OF = 'backup_of',
  MONITORS = 'monitors',
  PROVIDES = 'provides',
  REPLICATES = 'replicates',
  CONSUMES = 'consumes',
}

// CI Status
export enum CIStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  RETIRED = 'retired',
  MAINTENANCE = 'maintenance',
  PENDING = 'pending',
  DECOMMISSIONED = 'decommissioned',
}

// CI Type
export enum CIType {
  HARDWARE = 'hardware',
  SOFTWARE = 'software',
  NETWORK = 'network',
  SERVICE = 'service',
  VIRTUAL_MACHINE = 'virtual_machine',
  DATABASE = 'database',
  APPLICATION = 'application',
  SERVER = 'server',
  WORKSTATION = 'workstation',
  MOBILE_DEVICE = 'mobile_device',
  PRINTER = 'printer',
  STORAGE = 'storage',
  SECURITY = 'security',
  CLOUD_RESOURCE = 'cloud_resource',
  LICENSE = 'license',
  DOCUMENT = 'document',
}

// CI Criticality
export enum CICriticality {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  TRIVIAL = 'trivial',
}

// CMDB Configuration Item Interface
export interface IConfigurationItem extends Document {
  ciId: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  ciType: CIType;
  status: CIStatus;
  criticality: CICriticality;
  
  // Classification
  category: string;
  subcategory?: string;
  tags: string[];
  
  // Organization
  organizationId?: mongoose.Types.ObjectId;
  department?: string;
  location?: string;
  site?: string;
  
  // Ownership
  ownerId?: mongoose.Types.ObjectId;
  ownerName?: string;
  technicalOwnerId?: mongoose.Types.ObjectId;
  technicalOwnerName?: string;
  supportGroupId?: string;
  
  // Identification
  serialNumber?: string;
  assetTag?: string;
  barcode?: string;
  ciModel?: string;
  manufacturer?: string;
  sku?: string;
  
  // Technical Details
  ipAddress?: string;
  macAddress?: string;
  hostname?: string;
  os?: string;
  osVersion?: string;
  cpu?: string;
  memory?: string;
  storage?: string;
  
  // Software-specific
  version?: string;
  licenseKey?: string;
  licenseExpiry?: Date;
  installDate?: Date;
  lastScanDate?: Date;
  
  // Financial
  purchaseDate?: Date;
  purchaseCost?: number;
  vendor?: string;
  warrantyExpiry?: Date;
  maintenanceExpiry?: Date;
  maintenanceCost?: number;
  
  // Relationships (stored as references)
  parentId?: mongoose.Types.ObjectId;
  children: mongoose.Types.ObjectId[];
  relatedCIs: Array<{
    ciId: mongoose.Types.ObjectId;
    relationship: CIRelationshipType;
    direction: 'inbound' | 'outbound' | 'bidirectional';
    strength: 'strong' | 'weak';
    description?: string;
  }>;
  
  // Impact Analysis
  dependentServices: string[];
  dependentUsers: number;
  
  // Dynamic Attributes
  attributes: Map<string, unknown>;
  
  // Monitoring
  monitoringEnabled: boolean;
  monitoringConfig?: {
    agent?: string;
    metrics?: string[];
    thresholds?: Record<string, { warning: number; critical: number }>;
  };
  
  // Audit
  discoveredAt?: Date;
  lastUpdatedAt: Date;
  lastUpdatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  
  // History
  history: Array<{
    timestamp: Date;
    userId: mongoose.Types.ObjectId;
    action: string;
    changes: Record<string, { old: unknown; new: unknown }>;
  }>;
  
  // Discovery Source
  discoverySource?: string;
  discoveryId?: string;
  
  // Custom methods
  calculateImpact(): Promise<{ direct: number; indirect: number; total: number }>;
  getRelatedCIs(depth: number): Promise<IConfigurationItem[]>;
  getServices(): Promise<string[]>;
  isInMaintenance(): boolean;
  daysUntilWarrantyExpiry(): number | null;
}

// CI Relationship Interface
export interface ICIRelationship extends Document {
  sourceId: mongoose.Types.ObjectId;
  targetId: mongoose.Types.ObjectId;
  relationshipType: CIRelationshipType;
  direction: 'inbound' | 'outbound' | 'bidirectional';
  strength: 'strong' | 'weak';
  description?: string;
  weight: number;
  isAutomatic: boolean;
  discoveryRule?: string;
  createdAt: Date;
  createdBy?: mongoose.Types.ObjectId;
}

// CI Discovery Rule Interface
export interface ICIDiscoveryRule extends Document {
  ruleId: string;
  name: string;
  description?: string;
  ciType: CIType;
  isActive: boolean;
  priority: number;
  
  // Discovery Method
  method: 'agent' | 'network_scan' | 'api' | 'manual' | 'import';
  config: {
    endpoint?: string;
    credentials?: string;
    scanRange?: string;
    ports?: number[];
    protocols?: string[];
    filters?: Record<string, unknown>;
    schedule?: string;
  };
  
  // Matching Criteria
  matchers: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'regex' | 'exists';
    value: unknown;
  }>;
  
  // Attribute Mapping
  attributeMapping: Record<string, string>;
  
  // Organization
  organizationId?: mongoose.Types.ObjectId;
  
  // Execution
  lastRunAt?: Date;
  lastRunStatus?: 'success' | 'failed' | 'partial';
  lastRunError?: string;
  nextScheduledRun?: Date;
  
  createdAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedAt: Date;
  updatedBy?: mongoose.Types.ObjectId;
}

// Schemas

const ConfigurationItemSchema = new Schema<IConfigurationItem>(
  {
    ciId: {
      type: String,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'CI name is required'],
      trim: true,
    },
    nameAr: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    descriptionAr: {
      type: String,
      trim: true,
    },
    ciType: {
      type: String,
      enum: Object.values(CIType),
      required: [true, 'CI type is required'],
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(CIStatus),
      default: CIStatus.ACTIVE,
      index: true,
    },
    criticality: {
      type: String,
      enum: Object.values(CICriticality),
      default: CICriticality.MEDIUM,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    subcategory: String,
    tags: [String],
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    department: String,
    location: String,
    site: String,
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    ownerName: String,
    technicalOwnerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    technicalOwnerName: String,
    supportGroupId: String,
    serialNumber: String,
    assetTag: String,
    barcode: String,
    ciModel: String,
    manufacturer: String,
    sku: String,
    ipAddress: String,
    macAddress: String,
    hostname: String,
    os: String,
    osVersion: String,
    cpu: String,
    memory: String,
    storage: String,
    version: String,
    licenseKey: String,
    licenseExpiry: Date,
    installDate: Date,
    lastScanDate: Date,
    purchaseDate: Date,
    purchaseCost: Number,
    vendor: String,
    warrantyExpiry: Date,
    maintenanceExpiry: Date,
    maintenanceCost: Number,
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'ConfigurationItem',
    },
    children: [{
      type: Schema.Types.ObjectId,
      ref: 'ConfigurationItem',
    }],
    relatedCIs: [{
      ciId: {
        type: Schema.Types.ObjectId,
        ref: 'ConfigurationItem',
      },
      relationship: {
        type: String,
        enum: Object.values(CIRelationshipType),
      },
      direction: {
        type: String,
        enum: ['inbound', 'outbound', 'bidirectional'],
      },
      strength: {
        type: String,
        enum: ['strong', 'weak'],
      },
      description: String,
    }],
    dependentServices: [String],
    dependentUsers: {
      type: Number,
      default: 0,
    },
    attributes: {
      type: Map,
      of: Schema.Types.Mixed,
    },
    monitoringEnabled: {
      type: Boolean,
      default: false,
    },
    monitoringConfig: {
      agent: String,
      metrics: [String],
      thresholds: {
        type: Map,
        of: new Schema({
          warning: Number,
          critical: Number,
        }),
      },
    },
    discoveredAt: Date,
    lastUpdatedAt: {
      type: Date,
      default: Date.now,
    },
    lastUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    history: [{
      timestamp: {
        type: Date,
        default: Date.now,
      },
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      action: String,
      changes: {
        type: Map,
        of: new Schema({
          old: Schema.Types.Mixed,
          new: Schema.Types.Mixed,
        }),
      },
    }],
    discoverySource: String,
    discoveryId: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
ConfigurationItemSchema.index({ ciId: 1 });
ConfigurationItemSchema.index({ ciType: 1, status: 1 });
ConfigurationItemSchema.index({ organizationId: 1, ciType: 1 });
ConfigurationItemSchema.index({ category: 1, subcategory: 1 });
ConfigurationItemSchema.index({ ownerId: 1 });
ConfigurationItemSchema.index({ 'relatedCIs.ciId': 1 });
ConfigurationItemSchema.index({ name: 'text', description: 'text' });

// Pre-save hook to generate CI ID
ConfigurationItemSchema.pre('save', async function (next) {
  if (!this.ciId) {
    const prefix = this.ciType.substring(0, 3).toUpperCase();
    const count = await mongoose.model('ConfigurationItem').countDocuments({ ciType: this.ciType });
    this.ciId = `${prefix}-${(count + 1).toString().padStart(6, '0')}`;
  }
  this.lastUpdatedAt = new Date();
  next();
});

// Methods
ConfigurationItemSchema.methods.calculateImpact = async function (): Promise<{ direct: number; indirect: number; total: number }> {
  const direct = this.dependentServices?.length || 0;
  const indirect = this.relatedCIs?.length || 0;
  return {
    direct,
    indirect,
    total: direct + indirect,
  };
};

ConfigurationItemSchema.methods.getRelatedCIs = async function (depth: number = 1): Promise<IConfigurationItem[]> {
  if (depth <= 0) return [];
  
  const relatedIds = this.relatedCIs?.map((r: { ciId: mongoose.Types.ObjectId }) => r.ciId) || [];
  if (relatedIds.length === 0) return [];
  
  const related = await mongoose.model('ConfigurationItem').find({
    _id: { $in: relatedIds },
  });
  
  return related;
};

ConfigurationItemSchema.methods.getServices = async function (): Promise<string[]> {
  return this.dependentServices || [];
};

ConfigurationItemSchema.methods.isInMaintenance = function (): boolean {
  return this.status === CIStatus.MAINTENANCE;
};

ConfigurationItemSchema.methods.daysUntilWarrantyExpiry = function (): number | null {
  if (!this.warrantyExpiry) return null;
  const diff = this.warrantyExpiry.getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// Static Methods
ConfigurationItemSchema.statics.findByService = async function (serviceId: string) {
  return this.find({ dependentServices: serviceId });
};

ConfigurationItemSchema.statics.findImpacted = async function (ciIds: string[]) {
  return this.find({
    $or: [
      { _id: { $in: ciIds } },
      { 'relatedCIs.ciId': { $in: ciIds } },
    ],
  });
};

// CI Relationship Schema
const CIRelationshipSchema = new Schema<ICIRelationship>(
  {
    sourceId: {
      type: Schema.Types.ObjectId,
      ref: 'ConfigurationItem',
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      ref: 'ConfigurationItem',
      required: true,
    },
    relationshipType: {
      type: String,
      enum: Object.values(CIRelationshipType),
      required: true,
    },
    direction: {
      type: String,
      enum: ['inbound', 'outbound', 'bidirectional'],
      default: 'bidirectional',
    },
    strength: {
      type: String,
      enum: ['strong', 'weak'],
      default: 'strong',
    },
    description: String,
    weight: {
      type: Number,
      default: 1,
    },
    isAutomatic: {
      type: Boolean,
      default: false,
    },
    discoveryRule: String,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

CIRelationshipSchema.index({ sourceId: 1, targetId: 1 }, { unique: true });
CIRelationshipSchema.index({ relationshipType: 1 });

// CI Discovery Rule Schema
const CIDiscoveryRuleSchema = new Schema<ICIDiscoveryRule>(
  {
    ruleId: {
      type: String,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: String,
    ciType: {
      type: String,
      enum: Object.values(CIType),
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    priority: {
      type: Number,
      default: 100,
    },
    method: {
      type: String,
      enum: ['agent', 'network_scan', 'api', 'manual', 'import'],
      required: true,
    },
    config: {
      endpoint: String,
      credentials: String,
      scanRange: String,
      ports: [Number],
      protocols: [String],
      filters: {
        type: Map,
        of: Schema.Types.Mixed,
      },
      schedule: String,
    },
    matchers: [{
      field: String,
      operator: {
        type: String,
        enum: ['equals', 'contains', 'regex', 'exists'],
      },
      value: Schema.Types.Mixed,
    }],
    attributeMapping: {
      type: Map,
      of: String,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    },
    lastRunAt: Date,
    lastRunStatus: {
      type: String,
      enum: ['success', 'failed', 'partial'],
    },
    lastRunError: String,
    nextScheduledRun: Date,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook for rule ID
CIDiscoveryRuleSchema.pre('save', async function (next) {
  if (!this.ruleId) {
    const count = await mongoose.model('CIDiscoveryRule').countDocuments();
    this.ruleId = `RULE-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

// Models
export const ConfigurationItem = (mongoose.models.ConfigurationItem as mongoose.Model<IConfigurationItem>) || mongoose.model<IConfigurationItem>('ConfigurationItem', ConfigurationItemSchema);
export const CIRelationship = (mongoose.models.CIRelationship as mongoose.Model<ICIRelationship>) || mongoose.model<ICIRelationship>('CIRelationship', CIRelationshipSchema);
export const CIDiscoveryRule = (mongoose.models.CIDiscoveryRule as mongoose.Model<ICIDiscoveryRule>) || mongoose.model<ICIDiscoveryRule>('CIDiscoveryRule', CIDiscoveryRuleSchema);
