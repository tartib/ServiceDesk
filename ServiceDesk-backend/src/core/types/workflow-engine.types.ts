/**
 * Workflow Engine - Generic BPMN-based Types
 * محرك سير العمل العام - أنواع BPMN
 */

// ============================================
// ENUMS
// ============================================

/**
 * نوع الكيان المرتبط بسير العمل
 */
export enum WFEntityType {
  TICKET = 'ticket',
  PROJECT = 'project',
  CHANGE_REQUEST = 'change_request',
  FORM_SUBMISSION = 'form_submission',
  TASK = 'task',
  CUSTOM = 'custom',
}

/**
 * تصنيف الحالة
 */
export enum WFStateCategory {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
  CANCELLED = 'cancelled',
}

/**
 * نوع الحالة (عادية أو BPMN gateway)
 */
export enum WFStateType {
  START = 'start',
  NORMAL = 'normal',
  FORK = 'fork',
  JOIN = 'join',
  END = 'end',
  EXTERNAL_TASK = 'external_task',
}

/**
 * نوع الحارس (Guard) على الانتقال
 */
export enum WFGuardType {
  ROLE = 'role',
  FIELD_VALUE = 'field_value',
  APPROVAL_STATUS = 'approval_status',
  EXPRESSION = 'expression',
  TIME_WINDOW = 'time_window',
  CUSTOM_FUNCTION = 'custom_function',
}

/**
 * عامل المقارنة للحراس
 */
export enum WFGuardOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_OR_EQUAL = 'greater_or_equal',
  LESS_OR_EQUAL = 'less_or_equal',
  IN = 'in',
  NOT_IN = 'not_in',
  IS_EMPTY = 'is_empty',
  IS_NOT_EMPTY = 'is_not_empty',
  BETWEEN = 'between',
  MATCHES_REGEX = 'matches_regex',
}

/**
 * نوع الإجراء التلقائي
 */
export enum WFActionType {
  SET_FIELD = 'set_field',
  NOTIFY = 'notify',
  SEND_EMAIL = 'send_email',
  ASSIGN = 'assign',
  CREATE_TASK = 'create_task',
  CALL_WEBHOOK = 'call_webhook',
  CALL_API = 'call_api',
  ESCALATE = 'escalate',
  UPDATE_ENTITY = 'update_entity',
  LOG_ACTIVITY = 'log_activity',
  ADD_COMMENT = 'add_comment',
  RUN_SCRIPT = 'run_script',
  EXTERNAL_TASK = 'external_task',
  CUSTOM = 'custom',
}

/**
 * نوع المحفز (Trigger)
 */
export enum WFTriggerType {
  MANUAL = 'manual',
  API = 'api',
  EVENT = 'event',
  TIMER = 'timer',
  SCHEDULE = 'schedule',
  CONDITION = 'condition',
}

/**
 * حالة تعريف سير العمل
 */
export enum WFDefinitionStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  DEPRECATED = 'deprecated',
  ARCHIVED = 'archived',
}

/**
 * حالة نموذج سير العمل (Instance)
 */
export enum WFInstanceStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  SUSPENDED = 'suspended',
  ERROR = 'error',
  WAITING = 'waiting',
}

/**
 * نوع الحدث في سجل التدقيق
 */
export enum WFEventType {
  INSTANCE_STARTED = 'instance_started',
  INSTANCE_COMPLETED = 'instance_completed',
  INSTANCE_CANCELLED = 'instance_cancelled',
  INSTANCE_SUSPENDED = 'instance_suspended',
  INSTANCE_RESUMED = 'instance_resumed',
  INSTANCE_ERROR = 'instance_error',
  STATE_ENTERED = 'state_entered',
  STATE_EXITED = 'state_exited',
  TRANSITION_EXECUTED = 'transition_executed',
  TRANSITION_FAILED = 'transition_failed',
  ACTION_EXECUTED = 'action_executed',
  ACTION_FAILED = 'action_failed',
  GUARD_EVALUATED = 'guard_evaluated',
  GUARD_FAILED = 'guard_failed',
  SLA_WARNING = 'sla_warning',
  SLA_BREACH = 'sla_breach',
  TIMER_FIRED = 'timer_fired',
  PARALLEL_FORK = 'parallel_fork',
  PARALLEL_JOIN = 'parallel_join',
  ASSIGNMENT_CHANGED = 'assignment_changed',
  VARIABLE_CHANGED = 'variable_changed',
  EXTERNAL_TASK_CREATED = 'external_task_created',
  EXTERNAL_TASK_LOCKED = 'external_task_locked',
  EXTERNAL_TASK_COMPLETED = 'external_task_completed',
  EXTERNAL_TASK_FAILED = 'external_task_failed',
}

/**
 * نوع الفاعل
 */
export enum WFActorType {
  USER = 'user',
  SYSTEM = 'system',
  TIMER = 'timer',
  API = 'api',
}

/**
 * استراتيجية الانضمام (Join)
 */
export enum WFJoinStrategy {
  ALL = 'all',
  ANY = 'any',
  COUNT = 'count',
}

/**
 * حالة المؤقت
 */
export enum WFTimerStatus {
  PENDING = 'pending',
  FIRED = 'fired',
  CANCELLED = 'cancelled',
}

// ============================================
// INTERFACES - الحراس والإجراءات
// ============================================

/**
 * حارس الانتقال
 */
export interface IWFGuard {
  guardId: string;
  type: WFGuardType;
  config: {
    // ROLE guard
    roles?: string[];
    // FIELD_VALUE guard
    fieldPath?: string;
    operator?: WFGuardOperator;
    value?: any;
    // EXPRESSION guard
    expression?: string;
    // TIME_WINDOW guard
    afterHours?: number;
    beforeHours?: number;
    workingHoursOnly?: boolean;
    // CUSTOM_FUNCTION guard
    functionName?: string;
    params?: Record<string, any>;
  };
  errorMessage?: string;
  errorMessageAr?: string;
}

/**
 * مدقق الانتقال
 */
export interface IWFValidator {
  validatorId: string;
  type: 'required_field' | 'field_value' | 'expression' | 'custom';
  config: {
    fieldPath?: string;
    operator?: WFGuardOperator;
    value?: any;
    expression?: string;
    functionName?: string;
  };
  errorMessage: string;
  errorMessageAr?: string;
}

/**
 * إجراء سير العمل
 */
export interface IWFAction {
  actionId: string;
  type: WFActionType;
  config: Record<string, any>;
  order: number;
  condition?: IWFGuard;
  retryOnFailure?: boolean;
  maxRetries?: number;
  continueOnError?: boolean;
}

/**
 * تكوين واجهة المستخدم للانتقال
 */
export interface IWFTransitionUI {
  buttonLabel: string;
  buttonLabelAr?: string;
  buttonColor?: string;
  buttonIcon?: string;
  confirmationRequired?: boolean;
  confirmationMessage?: string;
  confirmationMessageAr?: string;
  requireComment?: boolean;
  requireSignature?: boolean;
  formFields?: string[];
}

// ============================================
// INTERFACES - الحالات والانتقالات
// ============================================

/**
 * تكوين SLA للحالة
 */
export interface IWFStateSLA {
  responseHours?: number;
  resolutionHours?: number;
  warningPercent: number;
  workingHoursOnly: boolean;
  escalationRules: IWFEscalationRule[];
}

/**
 * قاعدة تصعيد
 */
export interface IWFEscalationRule {
  ruleId: string;
  trigger: {
    type: 'time' | 'condition';
    afterHours?: number;
    afterPercent?: number;
    condition?: IWFGuard;
  };
  action: {
    type: 'notify' | 'reassign' | 'escalate_to_manager' | 'auto_transition';
    targetUserId?: string;
    targetRole?: string;
    transitionId?: string;
    notificationTemplate?: string;
  };
  repeat: boolean;
  repeatIntervalHours?: number;
  maxEscalations?: number;
}

/**
 * تكوين المهمة الخارجية
 */
export interface IWFExternalTaskConfig {
  topic: string;
  retries: number;
  timeout: number;
  priority: number;
  errorHandling: 'retry' | 'fail_instance' | 'skip';
}

/**
 * حالة في تعريف سير العمل
 */
export interface IWFStateDefinition {
  code: string;
  name: string;
  nameAr?: string;
  description?: string;
  type: WFStateType;
  category: WFStateCategory;
  color?: string;
  order: number;
  onEnter: IWFAction[];
  onExit: IWFAction[];
  sla?: IWFStateSLA;
  requiredFields?: string[];
  metadata?: Record<string, any>;
  // For FORK state
  parallelBranches?: string[];
  // For JOIN state
  joinStrategy?: WFJoinStrategy;
  joinCount?: number;
  // For EXTERNAL_TASK state
  externalTask?: IWFExternalTaskConfig;
  // Visual position for builder
  position?: { x: number; y: number };
}

/**
 * محفز الانتقال
 */
export interface IWFTrigger {
  type: WFTriggerType;
  config: {
    // EVENT trigger
    eventName?: string;
    // TIMER trigger
    afterHours?: number;
    cronExpression?: string;
    // CONDITION trigger
    condition?: IWFGuard;
    // API trigger
    apiEndpoint?: string;
  };
}

/**
 * انتقال في تعريف سير العمل
 */
export interface IWFTransitionDefinition {
  transitionId: string;
  name: string;
  nameAr?: string;
  description?: string;
  fromState: string;
  toState: string;
  trigger: WFTriggerType;
  guards: IWFGuard[];
  validators: IWFValidator[];
  actions: IWFAction[];
  onTransition: IWFAction[];
  ui: IWFTransitionUI;
  priority?: number;
}

// ============================================
// INTERFACES - التعريف الكامل
// ============================================

/**
 * إعدادات تعريف سير العمل
 */
export interface IWFDefinitionSettings {
  allowParallelSteps: boolean;
  requireCommentsOnReject: boolean;
  enableDelegation: boolean;
  maxDelegationDepth: number;
  autoCloseAfterDays?: number;
  trackSLA: boolean;
  enableTimers: boolean;
  enableWebhooks: boolean;
}

/**
 * تعريف سير العمل الكامل (document shape)
 */
export interface IWFDefinition {
  _id: any;
  organizationId: any;
  projectId?: any;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  entityType: WFEntityType;
  version: number;
  isLatest: boolean;
  status: WFDefinitionStatus;
  publishedAt?: Date;
  states: IWFStateDefinition[];
  transitions: IWFTransitionDefinition[];
  initialState: string;
  finalStates: string[];
  settings: IWFDefinitionSettings;
  tags?: string[];
  createdBy: any;
  updatedBy?: any;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// INTERFACES - Instance
// ============================================

/**
 * حالة فرع متوازي
 */
export interface IWFParallelBranch {
  branchId: string;
  stateCode: string;
  enteredAt: Date;
  completedAt?: Date;
  isCompleted: boolean;
}

/**
 * مؤقت نشط
 */
export interface IWFActiveTimer {
  timerId: string;
  type: 'sla_warning' | 'sla_breach' | 'auto_transition' | 'escalation' | 'scheduled';
  dueAt: Date;
  status: WFTimerStatus;
  escalationLevel?: number;
  config: Record<string, any>;
  createdAt: Date;
}

/**
 * معلومات التعيين
 */
export interface IWFAssignment {
  userId: string;
  userName?: string;
  assignedAt: Date;
  assignedBy?: string;
  assignmentType: 'user' | 'role' | 'group' | 'auto';
}

/**
 * حالة SLA للنموذج
 */
export interface IWFInstanceSLA {
  startedAt: Date;
  responseDue?: Date;
  resolutionDue?: Date;
  respondedAt?: Date;
  resolvedAt?: Date;
  breached: boolean;
  warningNotified: boolean;
  pausedDurationMinutes: number;
  isPaused: boolean;
  pausedAt?: Date;
}

/**
 * نموذج سير العمل (Instance)
 */
export interface IWFInstance {
  _id: any;
  definitionId: any;
  definitionVersion: number;
  organizationId: any;
  entityType: WFEntityType;
  entityId: string;
  currentState: string;
  previousState?: string;
  status: WFInstanceStatus;
  parallelBranches: IWFParallelBranch[];
  variables: Record<string, any>;
  assignment?: IWFAssignment;
  sla?: IWFInstanceSLA;
  timers: IWFActiveTimer[];
  startedAt: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  startedBy: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// INTERFACES - Events (Audit Trail)
// ============================================

/**
 * حدث سير العمل (Audit Trail)
 */
export interface IWFEvent {
  _id: any;
  instanceId: any;
  definitionId: any;
  organizationId: any;
  entityType: WFEntityType;
  entityId: string;
  type: WFEventType;
  fromState?: string;
  toState?: string;
  transitionId?: string;
  actorId?: string;
  actorType: WFActorType;
  actorName?: string;
  data?: Record<string, any>;
  error?: string;
  timestamp: Date;
}

// ============================================
// INTERFACES - Engine Results
// ============================================

/**
 * نتيجة تقييم الحراس
 */
export interface IWFGuardResult {
  passed: boolean;
  failedGuard?: IWFGuard;
  reason?: string;
}

/**
 * نتيجة تنفيذ الإجراء
 */
export interface IWFActionResult {
  actionId: string;
  type: WFActionType;
  success: boolean;
  result?: any;
  error?: string;
}

/**
 * نتيجة تنفيذ الانتقال
 */
export interface IWFTransitionResult {
  success: boolean;
  instanceId: string;
  fromState: string;
  toState: string;
  transitionId: string;
  newStatus: WFInstanceStatus;
  actionResults: IWFActionResult[];
  error?: string;
}

/**
 * انتقال متاح للمستخدم
 */
export interface IWFAvailableTransition {
  transitionId: string;
  name: string;
  nameAr?: string;
  toState: string;
  toStateName: string;
  toStateNameAr?: string;
  ui: IWFTransitionUI;
}

/**
 * سياق التنفيذ (يمرر للحراس والإجراءات)
 */
export interface IWFExecutionContext {
  instance: IWFInstance;
  definition: IWFDefinition;
  actor: {
    id: string;
    type: WFActorType;
    name?: string;
    roles?: string[];
    department?: string;
  };
  entity?: Record<string, any>;
  transitionData?: Record<string, any>;
  comment?: string;
  signature?: string;
}
