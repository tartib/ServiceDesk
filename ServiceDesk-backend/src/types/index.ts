export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  SUPERVISOR = 'supervisor',
  PREP = 'prep',
  USER = 'user',
}

/**
 * Typed role constants for use with authorize() middleware.
 * Use these instead of raw strings to get compile-time safety.
 */
export const ROLES = {
  ADMIN: UserRole.ADMIN,
  MANAGER: UserRole.MANAGER,
  SUPERVISOR: UserRole.SUPERVISOR,
  PREP: UserRole.PREP,
  USER: UserRole.USER,

  /** Admin-only operations (metrics, feature flags, integrations) */
  ADMIN_ONLY: [UserRole.ADMIN] as UserRole[],
  /** Admin + Manager (delete operations, destructive actions) */
  ADMIN_MANAGER: [UserRole.ADMIN, UserRole.MANAGER] as UserRole[],
  /** Admin + Manager + Supervisor (create/update config) */
  ADMIN_MANAGER_SUPERVISOR: [UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR] as UserRole[],
  /** All operational roles (ITSM / Ops tasks) */
  TECH_ROLES: [UserRole.PREP, UserRole.SUPERVISOR, UserRole.MANAGER] as UserRole[],
} as const;

export enum TaskStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  LATE = 'late',
  OVERDUE = 'overdue',
  STOCK_ISSUE = 'stock_issue',
  PENDING = 'pending',
  DONE = 'done',
}

export enum TaskType {
  RED_ALERT = 'red_alert',       // مهمة ≤ 10 دقائق
  MEDIUM = 'medium',              // مهمة ≤ 4 ساعات
  DAILY_RECURRING = 'daily_recurring',   // مهمة متكررة يومياً
  WEEKLY_RECURRING = 'weekly_recurring', // مهمة أسبوعية
  ON_DEMAND = 'on_demand',        // مهمة فورية عند الطلب
}

export enum TaskPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum NotificationType {
  REMINDER = 'reminder',
  START = 'start',
  LATE = 'late',
  OVERDUE = 'overdue',
  CRITICAL = 'critical',
  STOCK_ISSUE = 'stock_issue',
  COMPLETION = 'completion',
  ESCALATION = 'escalation',
  BEFORE_DUE = 'before_due',
}

export enum NotificationLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum InventoryStatus {
  IN_STOCK = 'in_stock',
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
}

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  START_TASK = 'start_task',
  COMPLETE_TASK = 'complete_task',
  INVENTORY_UPDATE = 'inventory_update',
  ASSIGN_TASK = 'assign_task',
  COMMENT_ADD = 'comment_add',
  ESCALATE = 'escalate',
}

export enum AssignmentType {
  SPECIFIC_USER = 'specific_user',
  ANY_TEAM_MEMBER = 'any_team_member',
}

export enum StockMovementType {
  RESTOCK = 'restock',
  ADJUSTMENT_ADD = 'adjustment_add',
  ADJUSTMENT_REMOVE = 'adjustment_remove',
  USAGE = 'usage',
  DAMAGED = 'damaged',
  EXPIRED = 'expired',
  RETURNED = 'returned',
}
