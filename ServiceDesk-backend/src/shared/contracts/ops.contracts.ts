/**
 * OPS Domain Contracts
 * 
 * Work Order entity and related types
 */

import {
  BaseEntity,
  Assignable,
  Prioritizable,
  Statusable,
  Commentable,
  UserRef,
} from './base.contracts';

// ============================================================
// WORK ORDER TYPES
// ============================================================

export type WorkOrderType = 
  | 'red_alert'
  | 'standard'
  | 'recurring'
  | 'on_demand';

export type WorkOrderStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'overdue'
  | 'cancelled';

// ============================================================
// WORK ORDER ENTITY
// ============================================================

export interface ProductRef {
  _id: string;
  name: string;
  prepTimeMinutes: number;
  category?: string;
}

export interface WorkOrder
  extends BaseEntity,
    Assignable,
    Prioritizable,
    Statusable,
    Commentable {
  // Identity
  reference?: string;              // WO-2024-0001

  // Classification
  type: WorkOrderType;
  category?: string;

  // Product relation
  productId?: ProductRef | string;
  productName?: string;

  // Scheduling
  scheduledAt: string;
  dueAt: string;
  startedAt?: string;
  completedAt?: string;

  // SLA
  slaTarget?: number;              // Minutes
  isOverdue: boolean;
  isEscalated: boolean;
  escalatedTo?: UserRef | string;
  escalatedAt?: string;
  escalationReason?: string;

  // Execution
  prepTimeMinutes?: number;
  estimatedDuration?: number;
  actualDuration?: number;
  preparedQuantity?: number;
  unit?: string;

  // Performance
  performanceScore?: number;
  completionScore?: number;

  // Recurrence
  isRecurring: boolean;
  recurrencePattern?: string;

  // Metadata
  tags: string[];
  notes?: string;
  timeRemaining?: number;
  assignedToName?: string;
  assignmentType?: 'specific_user' | 'any_team_member';
}

// ============================================================
// WORK ORDER REQUEST/RESPONSE
// ============================================================

export interface CreateWorkOrderRequest {
  productId: string;
  scheduledAt: string;
  taskType: WorkOrderType;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  assignedTo?: string;
  assignedToName?: string;
  assignmentType?: 'specific_user' | 'any_team_member';
  notes?: string;
  tags?: string[];
}

export interface UpdateWorkOrderRequest {
  priority?: 'critical' | 'high' | 'medium' | 'low';
  assignedTo?: string;
  scheduledAt?: string;
  notes?: string;
  tags?: string[];
}

export interface WorkOrderTransitionRequest {
  targetStatus: WorkOrderStatus;
  comment?: string;
  metadata?: {
    preparedQuantity?: number;
    unit?: string;
    reason?: string;
  };
}

export interface CompleteWorkOrderRequest {
  preparedQuantity?: number;
  unit?: string;
  notes?: string;
}
