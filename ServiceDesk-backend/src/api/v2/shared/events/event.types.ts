/**
 * Event System Types
 * 
 * Domain event contracts and type definitions
 */

// ============================================================
// BASE EVENT TYPES
// ============================================================

export interface DomainEvent<T = unknown> {
  // Metadata
  id: string;                     // UUID
  type: string;                   // Event type (e.g., 'ops.work_order.created')
  timestamp: string;              // ISO 8601
  version: string;                // Schema version

  // Context
  organizationId: string;
  userId: string;
  correlationId?: string;         // For tracing

  // Payload
  data: T;

  // Change tracking
  changes?: FieldChange[];
}

export interface FieldChange {
  field: string;
  from: unknown;
  to: unknown;
}

// ============================================================
// EVENT HANDLER TYPES
// ============================================================

export type EventHandler<T = unknown> = (event: DomainEvent<T>) => Promise<void>;

export interface EventSubscription {
  queueName: string;
  routingKey: string;
  handler: EventHandler<unknown>;
}

// ============================================================
// CORE DOMAIN EVENTS
// ============================================================

export interface UserCreatedEvent {
  userId: string;
  email: string;
  name: string;
}

export interface UserUpdatedEvent {
  userId: string;
}

export interface OrganizationMemberAddedEvent {
  organizationId: string;
  userId: string;
  role: string;
}

export interface OrganizationMemberRemovedEvent {
  organizationId: string;
  userId: string;
}

// ============================================================
// OPS DOMAIN EVENTS
// ============================================================

export interface WorkOrderCreatedEvent {
  workOrderId: string;
  type: string;
  priority: string;
  scheduledAt: string;
  assigneeId?: string;
  productId?: string;
  productName?: string;
}

export interface WorkOrderStartedEvent {
  workOrderId: string;
  startedAt: string;
  startedBy: string;
}

export interface WorkOrderCompletedEvent {
  workOrderId: string;
  completedAt: string;
  duration: number;
  performanceScore?: number;
  preparedQuantity?: number;
  unit?: string;
}

export interface WorkOrderOverdueEvent {
  workOrderId: string;
  dueAt: string;
  currentTime: string;
  assigneeId?: string;
  overdueMinutes: number;
}

export interface WorkOrderEscalatedEvent {
  workOrderId: string;
  escalatedTo: string;
  reason: string;
  escalatedAt: string;
}

export interface SLABreachedEvent {
  workOrderId: string;
  slaTarget: number;
  actualTime: number;
  breachType: 'response' | 'resolution';
}

// ============================================================
// PM DOMAIN EVENTS
// ============================================================

export interface ProjectCreatedEvent {
  projectId: string;
  key: string;
  name: string;
  methodology: string;
  ownerId: string;
}

export interface WorkItemCreatedEvent {
  itemId: string;
  projectId: string;
  type: string;
  priority: string;
  assigneeId?: string;
  title: string;
}

export interface WorkItemTransitionedEvent {
  itemId: string;
  projectId: string;
  from: string;
  to: string;
  transitionedBy: string;
}

export interface SprintStartedEvent {
  sprintId: string;
  projectId: string;
  startDate: string;
  endDate: string;
  itemCount: number;
  totalPoints: number;
}

export interface SprintCompletedEvent {
  sprintId: string;
  projectId: string;
  completedItems: number;
  incompleteItems: number;
  velocity: number;
}

// ============================================================
// SD DOMAIN EVENTS
// ============================================================

export interface TicketCreatedEvent {
  ticketId: string;
  reference: string;
  type: string;
  priority: string;
  impact: string;
  urgency: string;
  category: string;
}

export interface TicketResolvedEvent {
  ticketId: string;
  resolution: string;
  resolvedBy: string;
  resolutionTime: number;
}

export interface SLAWarningEvent {
  ticketId: string;
  deadline: string;
  timeRemaining: number;
  warningLevel: 'yellow' | 'red';
}

// ============================================================
// EVENT TYPE CONSTANTS
// ============================================================

export const EVENT_TYPES = {
  // Core
  CORE_USER_CREATED: 'core.user.created',
  CORE_USER_UPDATED: 'core.user.updated',
  CORE_ORG_MEMBER_ADDED: 'core.organization.member_added',
  CORE_ORG_MEMBER_REMOVED: 'core.organization.member_removed',

  // OPS
  OPS_WORK_ORDER_CREATED: 'ops.work_order.created',
  OPS_WORK_ORDER_STARTED: 'ops.work_order.started',
  OPS_WORK_ORDER_COMPLETED: 'ops.work_order.completed',
  OPS_WORK_ORDER_OVERDUE: 'ops.work_order.overdue',
  OPS_WORK_ORDER_ESCALATED: 'ops.work_order.escalated',
  OPS_SLA_BREACHED: 'ops.sla.breached',

  // PM
  PM_PROJECT_CREATED: 'pm.project.created',
  PM_WORK_ITEM_CREATED: 'pm.work_item.created',
  PM_WORK_ITEM_TRANSITIONED: 'pm.work_item.transitioned',
  PM_SPRINT_STARTED: 'pm.sprint.started',
  PM_SPRINT_COMPLETED: 'pm.sprint.completed',

  // SD
  SD_TICKET_CREATED: 'sd.ticket.created',
  SD_TICKET_RESOLVED: 'sd.ticket.resolved',
  SD_SLA_WARNING: 'sd.sla.warning',
} as const;

export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];

// ============================================================
// QUEUE NAMES
// ============================================================

export const QUEUES = {
  NOTIFICATIONS: 'servicedesk.notifications',
  ANALYTICS: 'servicedesk.analytics',
  SLA_MONITOR: 'servicedesk.sla.monitor',
  AUDIT_LOG: 'servicedesk.audit.log',
  SEARCH_INDEX: 'servicedesk.search.index',
  WEBSOCKET_BROADCAST: 'servicedesk.websocket.broadcast',
} as const;

// ============================================================
// ROUTING KEY PATTERNS
// ============================================================

export const ROUTING_PATTERNS = {
  ALL_EVENTS: '#',
  ALL_CREATED: '*.*.created',
  ALL_TRANSITIONS: '*.*.transitioned',
  OPS_ALL: 'ops.#',
  OPS_WORK_ORDER_ALL: 'ops.work_order.*',
  PM_ALL: 'pm.#',
  SD_ALL: 'sd.#',
  SLA_EVENTS: '*.sla.*',
} as const;
