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
// ITSM DOMAIN EVENTS
// ============================================================

export interface ServiceRequestCreatedEvent {
  requestId: string;
  serviceId: string;
  serviceName: string;
  priority: string;
  requesterId: string;
  requesterName: string;
}

export interface ServiceRequestStatusChangedEvent {
  requestId: string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
}

export interface ServiceRequestApprovedEvent {
  requestId: string;
  approvedBy: string;
  approverRole: string;
  decision: string;
}

export interface ServiceRequestAssignedEvent {
  requestId: string;
  assignedTo: string;
  assignedBy: string;
}

export interface ServiceRequestCancelledEvent {
  requestId: string;
  cancelledBy: string;
  reason?: string;
}

export interface CICreatedEvent {
  ciId: string;
  name: string;
  ciType: string;
  criticality: string;
  createdBy: string;
}

export interface CIUpdatedEvent {
  ciId: string;
  name: string;
  changes: FieldChange[];
  updatedBy: string;
}

export interface CIRetiredEvent {
  ciId: string;
  name: string;
  retiredBy: string;
  reason?: string;
}

export interface AutomationRuleTriggeredEvent {
  ruleId: string;
  ruleName: string;
  triggerType: string;
  triggeredBy: string;
}

export interface AutomationRuleExecutedEvent {
  ruleId: string;
  ruleName: string;
  executionId: string;
  success: boolean;
  actionsExecuted: number;
  duration: number;
}

// ============================================================
// WORKFLOW DOMAIN EVENTS
// ============================================================

export interface WorkflowInstanceStartedEvent {
  instanceId: string;
  definitionId: string;
  definitionName: string;
  startedBy: string;
  initialState: string;
}

export interface WorkflowInstanceTransitionedEvent {
  instanceId: string;
  definitionId: string;
  fromState: string;
  toState: string;
  transitionedBy: string;
  transitionName?: string;
}

export interface WorkflowInstanceCompletedEvent {
  instanceId: string;
  definitionId: string;
  completedBy: string;
  finalState: string;
  duration: number;
}

export interface WorkflowInstanceCancelledEvent {
  instanceId: string;
  definitionId: string;
  cancelledBy: string;
  reason?: string;
}

// ============================================================
// NOTIFICATION DOMAIN EVENTS
// ============================================================

export interface NotificationRequestedEvent {
  recipientId: string;
  recipientEmail?: string;
  channel: 'in_app' | 'email' | 'push' | 'sms';
  title: string;
  body: string;
  sourceType: string;
  sourceId: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
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

  // SD (legacy — kept for backward compatibility)
  SD_TICKET_CREATED: 'sd.ticket.created',
  SD_TICKET_RESOLVED: 'sd.ticket.resolved',
  SD_SLA_WARNING: 'sd.sla.warning',

  // ITSM
  ITSM_SERVICE_REQUEST_CREATED: 'itsm.service_request.created',
  ITSM_SERVICE_REQUEST_STATUS_CHANGED: 'itsm.service_request.status_changed',
  ITSM_SERVICE_REQUEST_APPROVED: 'itsm.service_request.approved',
  ITSM_SERVICE_REQUEST_ASSIGNED: 'itsm.service_request.assigned',
  ITSM_SERVICE_REQUEST_CANCELLED: 'itsm.service_request.cancelled',
  ITSM_CI_CREATED: 'itsm.ci.created',
  ITSM_CI_UPDATED: 'itsm.ci.updated',
  ITSM_CI_RETIRED: 'itsm.ci.retired',
  ITSM_AUTOMATION_RULE_TRIGGERED: 'itsm.automation_rule.triggered',
  ITSM_AUTOMATION_RULE_EXECUTED: 'itsm.automation_rule.executed',

  // Workflow
  WF_INSTANCE_STARTED: 'wf.instance.started',
  WF_INSTANCE_TRANSITIONED: 'wf.instance.transitioned',
  WF_INSTANCE_COMPLETED: 'wf.instance.completed',
  WF_INSTANCE_CANCELLED: 'wf.instance.cancelled',

  // Notifications
  NOTIFICATION_REQUESTED: 'notification.requested',

  // SLA
  SLA_POLICY_MATCHED: 'sla.policy.matched',
  SLA_METRIC_STARTED: 'sla.metric.started',
  SLA_METRIC_PAUSED: 'sla.metric.paused',
  SLA_METRIC_RESUMED: 'sla.metric.resumed',
  SLA_METRIC_MET: 'sla.metric.met',
  SLA_METRIC_BREACHED: 'sla.metric.breached',
  SLA_ESCALATION_TRIGGERED: 'sla.escalation.triggered',

  // Campaigns
  CAMPAIGN_CREATED: 'campaigns.campaign.created',
  CAMPAIGN_SCHEDULED: 'campaigns.campaign.scheduled',
  CAMPAIGN_STARTED: 'campaigns.campaign.started',
  CAMPAIGN_COMPLETED: 'campaigns.campaign.completed',
  CAMPAIGN_FAILED: 'campaigns.campaign.failed',
  CAMPAIGN_PAUSED: 'campaigns.campaign.paused',
  CAMPAIGN_RESUMED: 'campaigns.campaign.resumed',
  CAMPAIGN_MESSAGE_SENT: 'campaigns.message.sent',
  CAMPAIGN_MESSAGE_DELIVERED: 'campaigns.message.delivered',
  CAMPAIGN_MESSAGE_OPENED: 'campaigns.message.opened',
  CAMPAIGN_MESSAGE_CLICKED: 'campaigns.message.clicked',
  CAMPAIGN_MESSAGE_FAILED: 'campaigns.message.failed',
  CAMPAIGN_JOURNEY_STARTED: 'campaigns.journey.started',
  CAMPAIGN_JOURNEY_STEP_EXECUTED: 'campaigns.journey.step_executed',
  CAMPAIGN_JOURNEY_COMPLETED: 'campaigns.journey.completed',
  CAMPAIGN_TRIGGER_FIRED: 'campaigns.trigger.fired',

  // Gamification
  GAM_POINTS_AWARDED: 'gamification.points.awarded',
  GAM_LEVEL_CHANGED: 'gamification.level.changed',
  GAM_GROWTH_STATE_CHANGED: 'gamification.growth_state.changed',
  GAM_ACHIEVEMENT_UNLOCKED: 'gamification.achievement.unlocked',
  GAM_STREAK_UPDATED: 'gamification.streak.updated',
  GAM_STREAK_BROKEN: 'gamification.streak.broken',
  GAM_TEAM_MILESTONE: 'gamification.team.milestone',
} as const;

export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];

// ============================================================
// QUEUE NAMES (consumer group names)
// ============================================================

export const QUEUES = {
  NOTIFICATIONS: 'servicedesk.notifications',
  ANALYTICS: 'servicedesk.analytics',
  SLA_MONITOR: 'servicedesk.sla.monitor',
  AUDIT_LOG: 'servicedesk.audit.log',
  SEARCH_INDEX: 'servicedesk.search.index',
  WEBSOCKET_BROADCAST: 'servicedesk.websocket.broadcast',
  GAMIFICATION: 'servicedesk.gamification.consumers',
  CAMPAIGNS: 'servicedesk.campaigns.consumers',
  CAMPAIGNS_TRIGGERS: 'servicedesk.campaigns.triggers',
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
  ITSM_ALL: 'itsm.#',
  ITSM_SERVICE_REQUEST_ALL: 'itsm.service_request.*',
  ITSM_CI_ALL: 'itsm.ci.*',
  ITSM_AUTOMATION_ALL: 'itsm.automation_rule.*',
  WF_ALL: 'wf.#',
  WF_INSTANCE_ALL: 'wf.instance.*',
  SLA_EVENTS: '*.sla.*',
  SLA_ALL: 'sla.#',
  SLA_METRIC_ALL: 'sla.metric.*',
  NOTIFICATION_ALL: 'notification.#',
  GAM_ALL: 'gamification.#',
  GAM_POINTS_ALL: 'gamification.points.*',
  GAM_STREAK_ALL: 'gamification.streak.*',
  CAMPAIGNS_ALL: 'campaigns.#',
  CAMPAIGNS_CAMPAIGN_ALL: 'campaigns.campaign.*',
  CAMPAIGNS_MESSAGE_ALL: 'campaigns.message.*',
  CAMPAIGNS_JOURNEY_ALL: 'campaigns.journey.*',
} as const;
