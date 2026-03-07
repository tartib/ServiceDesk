/**
 * Notifications Module — Domain Interfaces
 */

// ── Enums ────────────────────────────────────────────────────

/** Source module that generated the notification */
export enum NotificationSource {
  ITSM = 'itsm',
  PM = 'pm',
  OPS = 'ops',
  WORKFLOW = 'workflow',
  SYSTEM = 'system',
}

/** Delivery channel */
export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  PUSH = 'push',
  SLACK = 'slack',
}

/** Notification level / severity */
export enum NotificationLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Unified notification type — superset of legacy OPS types + PM types.
 * Use `source` field to disambiguate domain context.
 */
export enum NotificationType {
  // General
  REMINDER = 'reminder',
  SYSTEM = 'system',

  // OPS / legacy
  START = 'start',
  LATE = 'late',
  OVERDUE = 'overdue',
  CRITICAL = 'critical',
  ESCALATION = 'escalation',
  BEFORE_DUE = 'before_due',
  COMPLETED = 'completed',

  // PM
  TASK = 'task',
  COMMENT = 'comment',
  MENTION = 'mention',
  ASSIGNMENT = 'assignment',
  DEADLINE = 'deadline',

  // ITSM
  STATUS_CHANGE = 'status_change',
  APPROVAL = 'approval',
  BREACH = 'breach',

  // Workflow
  WORKFLOW_STARTED = 'workflow_started',
  WORKFLOW_TRANSITIONED = 'workflow_transitioned',
  WORKFLOW_COMPLETED = 'workflow_completed',
}

// ── DTOs ─────────────────────────────────────────────────────

export interface CreateNotificationDTO {
  userId: string;
  type: NotificationType;
  source: NotificationSource;
  level?: NotificationLevel;
  channel?: NotificationChannel;
  title: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  /** Related entity id (task, request, incident, etc.) */
  relatedEntityId?: string;
  /** Related entity type for polymorphic lookup */
  relatedEntityType?: string;
  /** PM project scope */
  projectId?: string;
  organizationId?: string;
  isEscalation?: boolean;
  escalatedFrom?: string;
  actionRequired?: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationFilters {
  userId: string;
  isRead?: boolean;
  source?: NotificationSource;
  type?: NotificationType;
  level?: NotificationLevel;
  projectId?: string;
  organizationId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// ── Service Interface ────────────────────────────────────────

export interface INotificationService {
  create(data: CreateNotificationDTO): Promise<any>;
  createBulk(userIds: string[], data: Omit<CreateNotificationDTO, 'userId'>): Promise<number>;
  getByUser(filters: NotificationFilters, limit?: number): Promise<any[]>;
  getUnreadCount(userId: string): Promise<number>;
  markAsRead(notificationId: string): Promise<any | null>;
  markAllAsRead(userId: string): Promise<number>;
  cleanOld(daysOld?: number): Promise<number>;
}
