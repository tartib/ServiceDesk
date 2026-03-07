/**
 * Base Entity Contracts
 * 
 * Shared interfaces for all domain entities
 */

// ============================================================
// BASE ENTITY
// ============================================================

export interface BaseEntity {
  _id: string;
  createdAt: string;      // ISO 8601
  updatedAt: string;      // ISO 8601
  createdBy?: string;     // User ID
  updatedBy?: string;     // User ID
}

// ============================================================
// ASSIGNABLE (OPS WorkOrder, PM WorkItem, SD Ticket)
// ============================================================

export interface UserRef {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Assignable {
  assignee?: UserRef;
  reporter?: UserRef;
}

// ============================================================
// PRIORITIZABLE
// ============================================================

export type Priority = 'critical' | 'high' | 'medium' | 'low';

export interface Prioritizable {
  priority: Priority;
}

// ============================================================
// STATUSABLE (Unified Status Pattern)
// ============================================================

export type StatusCategory = 'todo' | 'in_progress' | 'done' | 'cancelled';

export interface StatusRef {
  id: string;
  name: string;
  category: StatusCategory;
}

export interface StatusHistoryEntry {
  from: string;
  to: string;
  changedBy: string;
  changedAt: string;
  comment?: string;
}

export interface Statusable {
  status: StatusRef | string;  // Can be full object or just ID
  statusHistory?: StatusHistoryEntry[];
}

// ============================================================
// COMMENTABLE
// ============================================================

export interface Commentable {
  commentsCount: number;
}

// ============================================================
// API RESPONSE CONTRACTS
// ============================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  count: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, string[]>;
}

// ============================================================
// TRANSITION CONTRACTS
// ============================================================

export interface TransitionRequest {
  targetStatus: string;
  comment?: string;
  resolution?: string;
  metadata?: Record<string, unknown>;
}

export interface TransitionResponse<T = unknown> {
  success: boolean;
  data: {
    entity: T;
    transition: {
      from: string;
      to: string;
      timestamp: string;
      triggeredBy: string;
    };
    sideEffects?: {
      notifications?: string[];
      events?: string[];
    };
  };
}

// ============================================================
// QUERY PARAMS
// ============================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

export interface SearchParams extends PaginationParams {
  q?: string;
  status?: string;
  priority?: Priority;
  assignee?: string;
  type?: string;
}
