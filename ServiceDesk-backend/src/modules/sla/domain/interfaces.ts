/**
 * SLA Domain Interfaces
 *
 * Pure domain entity interfaces and enums for the SLA module.
 * These define the shape of domain objects without coupling to the database.
 */

// ── Enums ────────────────────────────────────────────────────

export enum SlaEntityType {
  INCIDENT = 'incident',
  SERVICE_REQUEST = 'service_request',
  PROBLEM = 'problem',
  CHANGE = 'change',
}

export enum SlaMetricKey {
  FIRST_RESPONSE = 'first_response',
  RESOLUTION = 'resolution',
  ASSIGNMENT = 'assignment',
  PENDING_CUSTOMER = 'pending_customer',
}

export enum SlaMetricStatus {
  RUNNING = 'running',
  PAUSED = 'paused',
  MET = 'met',
  BREACHED = 'breached',
  CANCELLED = 'cancelled',
}

export enum SlaInstanceStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  BREACHED = 'breached',
  CANCELLED = 'cancelled',
}

export enum SlaEventType {
  POLICY_MATCHED = 'policy_matched',
  METRIC_STARTED = 'metric_started',
  METRIC_PAUSED = 'metric_paused',
  METRIC_RESUMED = 'metric_resumed',
  METRIC_STOPPED = 'metric_stopped',
  METRIC_MET = 'metric_met',
  METRIC_BREACHED = 'metric_breached',
  ESCALATION_TRIGGERED = 'escalation_triggered',
  MANUALLY_OVERRIDDEN = 'manually_overridden',
}

export enum SlaEventSource {
  TICKET = 'ticket',
  WORKFLOW = 'workflow',
  SCHEDULER = 'scheduler',
  MANUAL = 'manual',
  SYSTEM = 'system',
}

export enum SlaEscalationTrigger {
  BEFORE_BREACH = 'before_breach',
  ON_BREACH = 'on_breach',
  AFTER_BREACH = 'after_breach',
}

export enum SlaEscalationAction {
  NOTIFY_ASSIGNEE = 'notify_assignee',
  NOTIFY_TEAM_LEAD = 'notify_team_lead',
  NOTIFY_MANAGER = 'notify_manager',
  REASSIGN_QUEUE = 'reassign_queue',
  ESCALATE_PRIORITY = 'escalate_priority',
  WEBHOOK = 'webhook',
}

export enum SlaConditionOperator {
  EQ = 'eq',
  NEQ = 'neq',
  IN = 'in',
  NOT_IN = 'not_in',
  GT = 'gt',
  GTE = 'gte',
  LT = 'lt',
  LTE = 'lte',
}

export enum SlaBreachSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

// ── Condition ────────────────────────────────────────────────

export interface ISlaMatchCondition {
  field: string;         // priority, request_type, service_id, customer_tier, category
  operator: SlaConditionOperator;
  value: unknown;        // string | string[] | number
}

// ── Calendar ─────────────────────────────────────────────────

export interface ISlaCalendarEntity {
  id?: string;
  _id?: string;
  tenantId: string;
  name: string;
  nameAr?: string;
  timezone: string;
  isDefault: boolean;
  isActive: boolean;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISlaWorkingHours {
  id?: string;
  calendarId: string;
  dayOfWeek: number;    // 0=Sunday ... 6=Saturday
  startTime: string;    // "HH:mm"
  endTime: string;      // "HH:mm"
  isWorkingDay: boolean;
}

export interface ISlaHoliday {
  id?: string;
  calendarId: string;
  holidayDate: string;  // YYYY-MM-DD
  name?: string;
  nameAr?: string;
}

/** Resolved calendar with hours + holidays loaded */
export interface ISlaCalendarResolved {
  id: string;
  timezone: string;
  workingHours: ISlaWorkingHours[];
  holidays: ISlaHoliday[];
}

// ── Policy ───────────────────────────────────────────────────

export interface ISlaPolicyEntity {
  id?: string;
  _id?: string;
  tenantId: string;
  code: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  entityType: SlaEntityType;
  priority: number;
  matchConditions: ISlaMatchCondition[];
  isActive: boolean;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ── Goal ─────────────────────────────────────────────────────

export interface ISlaGoalEntity {
  id?: string;
  _id?: string;
  policyId: string;
  metricKey: SlaMetricKey;
  targetMinutes: number;
  calendarId?: string;
  startEvent: string;
  stopEvent: string;
  pauseOnStatuses: string[];
  resumeOnStatuses: string[];
  breachSeverity: SlaBreachSeverity;
  createdAt?: Date;
}

// ── Escalation Rule ──────────────────────────────────────────

export interface ISlaEscalationRuleEntity {
  id?: string;
  _id?: string;
  goalId: string;
  triggerType: SlaEscalationTrigger;
  offsetMinutes: number;
  actionType: SlaEscalationAction;
  actionConfig: Record<string, unknown>;
  isActive: boolean;
  sortOrder: number;
  createdAt?: Date;
}

// ── Instance ─────────────────────────────────────────────────

export interface ISlaInstanceEntity {
  id?: string;
  _id?: string;
  tenantId: string;
  ticketId: string;
  ticketType: SlaEntityType;
  policyId: string;
  status: SlaInstanceStatus;
  startedAt: Date;
  stoppedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// ── Metric Instance ──────────────────────────────────────────

export interface ISlaMetricInstanceEntity {
  id?: string;
  _id?: string;
  instanceId: string;
  goalId?: string;
  metricKey: SlaMetricKey;
  status: SlaMetricStatus;
  targetMinutes: number;
  elapsedBusinessSeconds: number;
  remainingBusinessSeconds?: number;
  startedAt: Date;
  pausedAt?: Date;
  stoppedAt?: Date;
  dueAt?: Date;
  breachedAt?: Date;
  lastStateChangeAt: Date;
  calendarId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ── Event (Audit) ────────────────────────────────────────────

export interface ISlaEventEntity {
  id?: string;
  _id?: string;
  tenantId: string;
  instanceId: string;
  metricInstanceId?: string;
  ticketId: string;
  eventType: SlaEventType;
  eventSource: SlaEventSource;
  payload?: Record<string, unknown>;
  occurredAt: Date;
}

// ── Ticket SLA View (read-only projection) ───────────────────

export interface ITicketSlaView {
  ticketId: string;
  ticketType: SlaEntityType;
  policy: {
    id: string;
    code: string;
    name: string;
    nameAr?: string;
  };
  instanceId: string;
  instanceStatus: SlaInstanceStatus;
  metrics: ITicketSlaMetricView[];
}

export interface ITicketSlaMetricView {
  metricKey: SlaMetricKey;
  status: SlaMetricStatus;
  targetMinutes: number;
  startedAt: string;
  stoppedAt?: string;
  dueAt?: string;
  breachedAt?: string;
  elapsedBusinessSeconds: number;
  remainingBusinessSeconds: number;
  breached: boolean;
  paused: boolean;
}

// ── Report Types ─────────────────────────────────────────────

export interface ISlaComplianceReport {
  period: string;
  total: number;
  met: number;
  breached: number;
  compliancePercent: number;
  avgResponseMinutes: number;
  avgResolutionMinutes: number;
}

export interface ISlaBreachSummary {
  metricKey: SlaMetricKey;
  count: number;
  byPriority: Record<string, number>;
  byTeam: Record<string, number>;
  byService: Record<string, number>;
}
