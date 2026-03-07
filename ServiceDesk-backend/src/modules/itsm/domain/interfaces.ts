/**
 * ITSM Domain Interfaces
 *
 * Pure domain entity interfaces extracted from Mongoose schemas.
 * These define the shape of domain objects without coupling to the database.
 * Models (infrastructure) implement these; services (application) depend on them.
 */

// ── Enums (re-exported from models for convenience) ──────────

export {
  ServiceRequestStatus,
  ApprovalDecision,
  FulfillmentTaskStatus,
  RequestPriority,
} from '../models/ServiceRequest';

export {
  ServiceStatus,
  ServiceCategory,
  FulfillmentType,
  ServiceVisibility,
  FormFieldType,
} from '../models/ServiceCatalog';

// ── Service Request Domain Entity ────────────────────────────

export interface IServiceRequestEntity {
  _id?: string;
  requestId: string;
  serviceId: string;
  serviceName: string;
  serviceNameAr?: string;
  serviceCategory: string;
  requester: {
    userId: string;
    name: string;
    email: string;
    department: string;
    phone?: string;
  };
  onBehalfOf?: {
    userId: string;
    name: string;
    email: string;
    department: string;
  };
  formData: Record<string, unknown>;
  workflowInstanceId?: string;
  currentState: string;
  assignedTo?: {
    userId: string;
    name: string;
    assignedAt: Date;
    assignedBy: string;
  };
  assignedTeam?: string;
  status: string;
  statusReason?: string;
  sla: {
    priority: string;
    targetResponseTime: number;
    targetResolutionTime: number;
    targetResponseDate: Date;
    targetResolutionDate: Date;
    actualResponseTime?: number;
    actualResolutionTime?: number;
    responseBreached: boolean;
    resolutionBreached: boolean;
    breachReason?: string;
    pausedDuration: number;
    onHoldSince?: Date;
  };
  source: string;
  organizationId?: string;
  submittedAt: Date;
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// ── Configuration Item Domain Entity ─────────────────────────

export interface IConfigurationItemEntity {
  _id?: string;
  ciId: string;
  name: string;
  nameAr?: string;
  ciType: string;
  status: string;
  criticality: string;
  description?: string;
  ownership?: {
    ownerId?: string;
    ownerName?: string;
    department?: string;
    teamId?: string;
  };
  technicalDetails?: Record<string, unknown>;
  financialInfo?: Record<string, unknown>;
  organizationId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ── Service Catalog Domain Entity ────────────────────────────

export interface IServiceCatalogEntity {
  _id?: string;
  serviceId: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  category: string;
  status: string;
  visibility: string;
  fulfillmentType: string;
  isActive: boolean;
  organizationId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ── Automation Rule Domain Entity ────────────────────────────

export interface IAutomationRuleEntity {
  _id?: string;
  ruleId: string;
  name: string;
  nameAr?: string;
  description?: string;
  status: string;
  trigger: {
    type: string;
    config: Record<string, unknown>;
  };
  conditions: {
    operator: string;
    groups: unknown[];
  };
  actions: {
    order: number;
    type: string;
    config: Record<string, unknown>;
  }[];
  isValid: boolean;
  organizationId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
