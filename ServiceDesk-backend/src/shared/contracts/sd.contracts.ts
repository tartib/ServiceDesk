/**
 * SD Domain Contracts
 * 
 * Ticket, Asset, Catalog entities and related types (ITSM)
 */

import {
  BaseEntity,
  Assignable,
  Prioritizable,
  Statusable,
  Commentable,
} from './base.contracts';

// ============================================================
// TICKET TYPES
// ============================================================

export type TicketType =
  | 'incident'
  | 'service_request'
  | 'change'
  | 'problem';

export type TicketStatus =
  | 'new'
  | 'assigned'
  | 'in_progress'
  | 'pending_user'
  | 'pending_vendor'
  | 'on_hold'
  | 'resolved'
  | 'closed'
  | 'cancelled';

export type ImpactLevel = 'critical' | 'high' | 'medium' | 'low';
export type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low';

// ============================================================
// TICKET ENTITY
// ============================================================

export interface Ticket
  extends BaseEntity,
    Assignable,
    Prioritizable,
    Statusable,
    Commentable {
  // Identity
  reference: string;              // INC-2024-0001, CHG-2024-0001

  // Classification
  type: TicketType;
  category: string;
  subcategory?: string;

  // Content
  title: string;
  description: string;

  // Impact Assessment
  impact: ImpactLevel;
  urgency: UrgencyLevel;

  // SLA
  slaId?: string;
  responseDeadline?: string;
  resolutionDeadline?: string;
  respondedAt?: string;
  slaBreached?: boolean;

  // Resolution
  resolution?: string;
  resolutionCategory?: string;
  resolvedAt?: string;
  closedAt?: string;

  // Relationships
  relatedAssets: string[];
  relatedTickets: string[];
  parentTicketId?: string;        // For child incidents
}

// ============================================================
// ASSET ENTITY (formerly Inventory)
// ============================================================

export interface Asset extends BaseEntity {
  name: string;
  sku?: string;
  category: string;
  
  // Stock
  quantity: number;
  minQuantity: number;
  maxQuantity?: number;
  unit: string;
  
  // Location
  location?: string;
  
  // Status
  status: 'available' | 'low_stock' | 'out_of_stock';
  isActive: boolean;
  
  // Pricing
  unitPrice?: number;
  totalValue?: number;
}

export interface AssetHistoryEntry {
  assetId: string;
  action: 'restock' | 'consume' | 'adjust' | 'transfer';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  performedBy: string;
  performedAt: string;
  notes?: string;
}

// ============================================================
// CATALOG ENTITY (formerly Category)
// ============================================================

export interface CatalogItem extends BaseEntity {
  name: string;
  description?: string;
  parentId?: string;
  
  // Hierarchy
  level: number;
  path: string[];
  
  // Status
  isActive: boolean;
  
  // Ordering
  sortOrder: number;
}

// ============================================================
// SLA ENTITY
// ============================================================

export interface SLA extends BaseEntity {
  name: string;
  description?: string;
  
  // Targets (in minutes)
  responseTime: number;
  resolutionTime: number;
  
  // Conditions
  priority?: 'critical' | 'high' | 'medium' | 'low';
  ticketType?: TicketType;
  category?: string;
  
  // Business Hours
  businessHoursOnly: boolean;
  
  // Status
  isActive: boolean;
}

// ============================================================
// REQUEST/RESPONSE TYPES
// ============================================================

export interface CreateTicketRequest {
  title: string;
  description: string;
  type: TicketType;
  category: string;
  subcategory?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  impact?: ImpactLevel;
  urgency?: UrgencyLevel;
  assignee?: string;
  relatedAssets?: string[];
}

export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  category?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  impact?: ImpactLevel;
  urgency?: UrgencyLevel;
  assignee?: string | null;
}

export interface ResolveTicketRequest {
  resolution: string;
  resolutionCategory?: string;
}

export interface CreateAssetRequest {
  name: string;
  sku?: string;
  category: string;
  quantity: number;
  minQuantity: number;
  maxQuantity?: number;
  unit: string;
  location?: string;
  unitPrice?: number;
}

export interface RestockAssetRequest {
  quantity: number;
  notes?: string;
}

export interface AdjustAssetRequest {
  quantity: number;
  reason: string;
}
