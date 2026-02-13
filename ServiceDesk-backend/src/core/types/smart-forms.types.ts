/**
 * Smart Forms System - Type Definitions
 * نظام النماذج الذكية - تعريفات الأنواع
 */

import { ObjectId } from 'mongoose';

// ============================================
// ENUMS - التعدادات
// ============================================

/**
 * أنواع الحقول الذكية
 */
export enum SmartFieldType {
  // Basic Types - الأنواع الأساسية
  TEXT = 'text',
  TEXTAREA = 'textarea',
  NUMBER = 'number',
  DECIMAL = 'decimal',
  EMAIL = 'email',
  PHONE = 'phone',
  URL = 'url',
  PASSWORD = 'password',

  // Date & Time - التاريخ والوقت
  DATE = 'date',
  TIME = 'time',
  DATETIME = 'datetime',
  DATE_RANGE = 'date_range',

  // Selection - الاختيار
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  TOGGLE = 'toggle',

  // Advanced - متقدم
  FILE = 'file',
  MULTI_FILE = 'multi_file',
  IMAGE = 'image',
  SIGNATURE = 'signature',
  GEOLOCATION = 'geolocation',
  ADDRESS = 'address',

  // Rich Content - محتوى غني
  RICH_TEXT = 'rich_text',
  MARKDOWN = 'markdown',

  // Lookup & Reference - البحث والمرجع
  USER_LOOKUP = 'user_lookup',
  ENTITY_LOOKUP = 'entity_lookup',
  CASCADING_SELECT = 'cascading_select',

  // Calculated - محسوب
  FORMULA = 'formula',
  AGGREGATION = 'aggregation',

  // Layout - التخطيط
  SECTION_HEADER = 'section_header',
  DIVIDER = 'divider',
  INFO_BOX = 'info_box',

  // Custom - مخصص
  CUSTOM = 'custom',
}

/**
 * أنواع الشروط
 */
export enum ConditionType {
  FIELD_VALUE = 'field_value',
  FIELD_EMPTY = 'field_empty',
  FIELD_NOT_EMPTY = 'field_not_empty',
  USER_ROLE = 'user_role',
  USER_DEPARTMENT = 'user_department',
  USER_SITE = 'user_site',
  USER_ATTRIBUTE = 'user_attribute',
  FORM_STATUS = 'form_status',
  TIME_BASED = 'time_based',
  CUSTOM_FUNCTION = 'custom_function',
}

/**
 * عوامل المقارنة
 */
export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_OR_EQUAL = 'greater_or_equal',
  LESS_OR_EQUAL = 'less_or_equal',
  BETWEEN = 'between',
  IN = 'in',
  NOT_IN = 'not_in',
  IS_EMPTY = 'is_empty',
  IS_NOT_EMPTY = 'is_not_empty',
  MATCHES_REGEX = 'matches_regex',
}

/**
 * أنواع الإجراءات الشرطية
 */
export enum ConditionalActionType {
  // Visibility - الرؤية
  SHOW_FIELD = 'show_field',
  HIDE_FIELD = 'hide_field',
  SHOW_SECTION = 'show_section',
  HIDE_SECTION = 'hide_section',

  // State - الحالة
  ENABLE_FIELD = 'enable_field',
  DISABLE_FIELD = 'disable_field',
  SET_REQUIRED = 'set_required',
  SET_OPTIONAL = 'set_optional',
  SET_READONLY = 'set_readonly',

  // Value - القيمة
  SET_VALUE = 'set_value',
  CLEAR_VALUE = 'clear_value',
  CALCULATE_VALUE = 'calculate_value',

  // Options - الخيارات
  FILTER_OPTIONS = 'filter_options',
  SET_OPTIONS = 'set_options',

  // Validation - التحقق
  ADD_VALIDATION = 'add_validation',
  REMOVE_VALIDATION = 'remove_validation',

  // Display - العرض
  SHOW_MESSAGE = 'show_message',
  SHOW_WARNING = 'show_warning',
  SHOW_ERROR = 'show_error',
}

/**
 * أنواع خطوات سير العمل
 */
export enum WorkflowStepType {
  START = 'start',
  TASK = 'task',
  APPROVAL = 'approval',
  PARALLEL_APPROVAL = 'parallel_approval',
  SEQUENTIAL_APPROVAL = 'sequential_approval',
  REVIEW = 'review',
  CONDITION = 'condition',
  SUBPROCESS = 'subprocess',
  NOTIFICATION = 'notification',
  INTEGRATION = 'integration',
  END = 'end',
}

/**
 * أنواع الموافقات
 */
export enum ApprovalType {
  SEQUENTIAL = 'sequential',
  PARALLEL = 'parallel',
  HIERARCHICAL = 'hierarchical',
  CONDITIONAL = 'conditional',
  HYBRID = 'hybrid',
}

/**
 * استراتيجيات التعيين
 */
export enum AssignmentStrategy {
  DIRECT = 'direct',
  ROUND_ROBIN = 'round_robin',
  LEAST_LOADED = 'least_loaded',
  SKILL_BASED = 'skill_based',
  LOCATION_BASED = 'location_based',
  RANDOM = 'random',
  MANAGER = 'manager',
  CUSTOM = 'custom',
}

/**
 * أنواع القواعد التجارية
 */
export enum BusinessRuleType {
  VALIDATION = 'validation',
  AUTOMATION = 'automation',
  NOTIFICATION = 'notification',
  INTEGRATION = 'integration',
  CALCULATION = 'calculation',
  ESCALATION = 'escalation',
}

/**
 * أنواع محفزات القواعد
 */
export enum RuleTriggerType {
  // Form Events
  ON_FORM_CREATE = 'on_form_create',
  ON_FORM_UPDATE = 'on_form_update',
  ON_FORM_SUBMIT = 'on_form_submit',
  ON_FORM_DELETE = 'on_form_delete',

  // Field Events
  ON_FIELD_CHANGE = 'on_field_change',

  // Workflow Events
  ON_STATUS_CHANGE = 'on_status_change',
  ON_STEP_ENTER = 'on_step_enter',
  ON_STEP_EXIT = 'on_step_exit',
  ON_APPROVAL = 'on_approval',
  ON_REJECTION = 'on_rejection',

  // Time Events
  ON_SCHEDULE = 'on_schedule',
  ON_SLA_WARNING = 'on_sla_warning',
  ON_SLA_BREACH = 'on_sla_breach',

  // Manual
  ON_MANUAL_TRIGGER = 'on_manual_trigger',
}

/**
 * أنواع إجراءات القواعد
 */
export enum RuleActionType {
  // Data Actions
  SET_FIELD_VALUE = 'set_field_value',
  CALCULATE_FIELD = 'calculate_field',
  COPY_FIELD = 'copy_field',
  UPDATE_FIELD = 'update_field',
  CALCULATE = 'calculate',
  VALIDATE = 'validate',

  // Workflow Actions
  CHANGE_STATUS = 'change_status',
  ASSIGN_TO = 'assign_to',
  ESCALATE = 'escalate',
  CREATE_TASK = 'create_task',
  CREATE_SUB_REQUEST = 'create_sub_request',

  // Notification Actions
  SEND_EMAIL = 'send_email',
  SEND_SMS = 'send_sms',
  SEND_PUSH = 'send_push',
  SEND_IN_APP = 'send_in_app',
  SEND_NOTIFICATION = 'send_notification',

  // Integration Actions
  CALL_WEBHOOK = 'call_webhook',
  CALL_API = 'call_api',

  // SLA Actions
  SET_SLA = 'set_sla',
  PAUSE_SLA = 'pause_sla',
  RESUME_SLA = 'resume_sla',

  // Approval Actions
  AUTO_APPROVE = 'auto_approve',
  AUTO_REJECT = 'auto_reject',

  // Activity Actions
  LOG_ACTIVITY = 'log_activity',
  ADD_COMMENT = 'add_comment',
  ADD_APPROVER = 'add_approver',

  // Custom
  RUN_SCRIPT = 'run_script',
  CUSTOM_FUNCTION = 'custom_function',
}

/**
 * حالات تقديم النموذج
 */
export enum SubmissionStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * أنواع تخطيط النموذج
 */
export enum FormLayoutType {
  SINGLE_COLUMN = 'single_column',
  TWO_COLUMN = 'two_column',
  WIZARD = 'wizard',
  TABS = 'tabs',
}

// ============================================
// INTERFACES - الواجهات
// ============================================

/**
 * خيار الحقل
 */
export interface IFieldOption {
  value: string;
  label: string;
  label_ar?: string;
  icon?: string;
  color?: string;
  disabled?: boolean;
  metadata?: Record<string, any>;
}

/**
 * مصدر القيمة الافتراضية
 */
export interface IDefaultValueSource {
  type: 'static' | 'user_attribute' | 'api' | 'formula';
  value: string;
}

/**
 * مصدر الخيارات
 */
export interface IOptionsSource {
  type: 'static' | 'api' | 'lookup';
  endpoint?: string;
  lookup_entity?: string;
  value_field?: string;
  label_field?: string;
  filters?: Record<string, any>;
}

/**
 * تكوين التحقق
 */
export interface IFieldValidation {
  required: boolean;
  required_condition?: ICondition;
  min?: number;
  max?: number;
  min_length?: number;
  max_length?: number;
  pattern?: string;
  pattern_message?: string;
  pattern_message_ar?: string;
  custom_validator?: string;
}

/**
 * تكوين العرض
 */
export interface IFieldDisplay {
  order: number;
  section_id?: string;
  width: 'full' | 'half' | 'third' | 'quarter';
  hidden: boolean;
  readonly: boolean;
  css_class?: string;
}

/**
 * الحقل الذكي
 */
export interface ISmartField {
  field_id: string;
  type: SmartFieldType;

  // Labels
  label: string;
  label_ar: string;
  placeholder?: string;
  placeholder_ar?: string;
  help_text?: string;
  help_text_ar?: string;

  // Value Configuration
  default_value?: any;
  default_value_source?: IDefaultValueSource;

  // Options
  options?: IFieldOption[];
  options_source?: IOptionsSource;

  // Validation
  validation: IFieldValidation;

  // Display
  display: IFieldDisplay;

  // Conditional Visibility
  visibility_conditions?: ICondition[];

  // Dependencies
  depends_on?: string[];

  // Field-specific settings
  settings: Record<string, any>;
}

/**
 * قسم النموذج
 */
export interface IFormSection {
  section_id: string;
  title: string;
  title_ar: string;
  description?: string;
  description_ar?: string;
  order: number;
  collapsible: boolean;
  collapsed_by_default: boolean;
}

/**
 * الشرط
 */
export interface ICondition {
  type: ConditionType;
  field_id?: string;
  operator: ConditionOperator;
  value?: any;
  user_attribute?: 'role' | 'department' | 'site' | 'custom';
  data_source?: string;
  time_condition?: {
    type: 'before' | 'after' | 'between';
    value: string | string[];
  };
}

/**
 * مجموعة الشروط
 */
export interface IConditionGroup {
  operator: 'AND' | 'OR';
  conditions: (ICondition | IConditionGroup)[];
}

/**
 * الإجراء الشرطي
 */
export interface IConditionalAction {
  action_type: ConditionalActionType;
  target_field_id?: string;
  target_section_id?: string;
  value?: any;
  message?: string;
  message_ar?: string;
}

/**
 * القاعدة الشرطية
 */
export interface IConditionalRule {
  rule_id: string;
  name: string;
  description?: string;
  conditions: IConditionGroup;
  actions: IConditionalAction[];
  priority: number;
  is_active: boolean;
}

/**
 * إجراء سير العمل
 */
export interface IWorkflowAction {
  action_id: string;
  name: string;
  name_ar: string;
  icon?: string;
  color?: string;
  type: 'approve' | 'reject' | 'return' | 'forward' | 'escalate' | 'complete' | 'cancel' | 'custom';
  requires_comment: boolean;
  requires_signature: boolean;
  confirmation_message?: string;
  confirmation_message_ar?: string;
  visible_when?: IConditionGroup;
}

/**
 * قاعدة التصعيد
 */
export interface IEscalationRule {
  rule_id: string;
  trigger: {
    type: 'time' | 'condition';
    after_hours?: number;
    condition?: IConditionGroup;
  };
  action: {
    type: 'notify' | 'reassign' | 'escalate_to_manager' | 'auto_action';
    target?: string;
    notification_template?: string;
    auto_action?: 'approve' | 'reject';
  };
  repeat: boolean;
  repeat_interval_hours?: number;
  max_escalations?: number;
}

/**
 * الإجراء التلقائي
 */
export interface IAutoAction {
  action_id: string;
  type: RuleActionType;
  config: Record<string, any>;
  condition?: IConditionGroup;
  order: number;
}

/**
 * النشاط الفرعي
 */
export interface ISubActivity {
  activity_id: string;
  name: string;
  name_ar: string;
  description?: string;
  type: 'task' | 'checklist' | 'form';
  task_config?: {
    assignee_type: 'same' | 'different';
    assignee?: string;
    due_hours: number;
  };
  checklist_items?: {
    item_id: string;
    label: string;
    label_ar: string;
    required: boolean;
  }[];
  sub_form_id?: string;
  is_required: boolean;
  order: number;
}

/**
 * خطوة سير العمل
 */
export interface IWorkflowStep {
  step_id: string;
  name: string;
  name_ar: string;
  description?: string;
  type: WorkflowStepType;

  assignment: {
    type: 'user' | 'role' | 'group' | 'dynamic' | 'requester_manager';
    value?: string;
    dynamic_rule?: string;
  };

  permissions: {
    can_edit_fields: string[];
    can_view_fields: string[];
    can_add_attachments: boolean;
    can_add_comments: boolean;
  };

  available_actions: IWorkflowAction[];

  sla?: {
    response_hours: number;
    warning_percent: number;
    escalation_rules: IEscalationRule[];
  };

  auto_actions?: {
    on_enter: IAutoAction[];
    on_exit: IAutoAction[];
    on_timeout: IAutoAction[];
  };

  sub_activities?: ISubActivity[];

  is_final: boolean;
  is_approval_step: boolean;
}

/**
 * انتقال سير العمل
 */
export interface IWorkflowTransition {
  transition_id: string;
  from_step_id: string;
  to_step_id: string;
  trigger: {
    type: 'action' | 'condition' | 'auto';
    action_id?: string;
    condition?: IConditionGroup;
    auto_after_hours?: number;
  };
  on_transition: IAutoAction[];
}

/**
 * تكوين سير العمل
 */
export interface IWorkflowConfig {
  workflow_id: string;
  name: string;
  description?: string;
  steps: IWorkflowStep[];
  initial_step_id: string;
  transitions: IWorkflowTransition[];
  settings: {
    allow_parallel_steps: boolean;
    require_comments_on_reject: boolean;
    enable_delegation: boolean;
    max_delegation_depth: number;
    auto_close_after_days?: number;
  };
}

/**
 * خطوة سلسلة الموافقات
 */
export interface IApprovalChainStep {
  step: number;
  approver: {
    type: 'user' | 'role' | 'group' | 'manager' | 'dynamic';
    value?: string;
    dynamic_rule?: string;
    manager_level?: number;
  };
  condition?: IConditionGroup;
  is_optional: boolean;
  can_skip_if_same_as_previous: boolean;
  auto_approve_after_hours?: number;
  auto_approve_condition?: IConditionGroup;
}

/**
 * قاعدة التفويض
 */
export interface IDelegationRule {
  rule_id: string;
  delegator: {
    type: 'user' | 'role' | 'any';
    value?: string;
  };
  delegate_to: {
    type: 'user' | 'role' | 'group';
    value?: string;
    restrictions?: string[];
  };
  valid_from?: Date;
  valid_to?: Date;
  applies_to_forms?: string[];
  is_active: boolean;
}

/**
 * قاعدة الموافقة التلقائية
 */
export interface IAutoApproveRule {
  rule_id: string;
  name: string;
  conditions: IConditionGroup;
  priority: number;
  is_active: boolean;
}

/**
 * مستوى الموافقة
 */
export interface IApprovalLevel {
  level: number;
  approver_type: 'user' | 'role' | 'manager' | 'dynamic';
  approver_id?: string;
  approver_role?: string;
  dynamic_approver_field?: string;
  condition?: ICondition;
  is_optional: boolean;
  can_delegate: boolean;
  timeout_hours?: number;
}

/**
 * تكوين الموافقات
 */
export interface IApprovalConfig {
  approval_id: string;
  type: ApprovalType;
  enabled: boolean;
  levels: IApprovalLevel[];
  chain: IApprovalChainStep[];
  min_approvals?: number;
  skip_conditions?: ICondition[];
  settings: {
    allow_delegation: boolean;
    delegation_rules: IDelegationRule[];
    auto_approve_rules: IAutoApproveRule[];
    escalation_enabled: boolean;
    escalation_rules: IEscalationRule[];
    quorum_type: 'all' | 'majority' | 'any' | 'count';
    quorum_count?: number;
    on_reject: 'stop' | 'continue' | 'restart';
    timeout_hours: number;
    on_timeout: 'escalate' | 'auto_approve' | 'auto_reject' | 'notify';
  };
}

/**
 * تكوين موازنة الأحمال
 */
export interface ILoadBalancingConfig {
  consider_active_tasks: boolean;
  max_tasks_per_user: number;
  consider_skills: boolean;
  required_skills?: string[];
  consider_availability: boolean;
  working_hours_only: boolean;
}

/**
 * قاعدة التعيين
 */
export interface IAssignmentRule {
  rule_id: string;
  name: string;
  description?: string;
  priority: number;
  conditions: IConditionGroup;
  strategy: AssignmentStrategy;
  target: {
    type: 'user' | 'role' | 'group' | 'team';
    values: string[];
    user_id?: string;
    role?: string;
    group_id?: string;
    department?: string;
    skill_field?: string;
    dynamic_field?: string;
    exclude_users?: string[];
  };
  load_balancing?: ILoadBalancingConfig;
  fallback_assignment?: {
    type: 'user' | 'role' | 'group';
    value: string;
  };
  is_active: boolean;
}

/**
 * محفز القاعدة
 */
export interface IRuleTrigger {
  type: RuleTriggerType;
  event?: string;
  schedule?: {
    cron: string;
    timezone: string;
  };
  field_ids?: string[];
  from_status?: string[];
  to_status?: string[];
}

/**
 * إجراء القاعدة
 */
export interface IRuleAction {
  action_id: string;
  type: RuleActionType;
  config: Record<string, any>;
  condition?: IConditionGroup;
  order: number;
}

/**
 * القاعدة التجارية
 */
export interface IBusinessRule {
  rule_id: string;
  name: string;
  description?: string;
  type: BusinessRuleType;
  trigger: RuleTriggerType;
  conditions: IConditionGroup;
  actions: IRuleAction[];
  execution: {
    async: boolean;
    retry_on_failure: boolean;
    max_retries: number;
    retry_delay_seconds: number;
  };
  priority: number;
  is_active: boolean;
  stop_on_first_match?: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * إعدادات النموذج
 */
export interface IFormSettings {
  allow_draft: boolean;
  allow_attachments: boolean;
  max_attachments: number;
  allowed_file_types: string[];
  max_file_size_mb: number;
  require_signature: boolean;
  enable_geolocation: boolean;
  submission_message?: string;
  submission_message_ar?: string;
}

/**
 * التحكم في الوصول
 */
export interface IFormAccess {
  available_to: string[];
  restricted_from?: string[];
  requires_authentication: boolean;
}

/**
 * قالب النموذج
 */
export interface IFormTemplate {
  _id?: ObjectId;
  form_id: string;

  // Basic Info
  name: string;
  name_ar: string;
  description?: string;
  description_ar?: string;
  category: string;
  icon?: string;

  // Version Control
  version: number;
  is_published: boolean;
  published_at?: Date;

  // Fields Definition
  fields: ISmartField[];

  // Layout Configuration
  layout: {
    type: FormLayoutType;
    sections?: IFormSection[];
  };

  // Conditional Logic Rules
  conditional_rules: IConditionalRule[];

  // Validation Rules
  validation_rules: IValidationRule[];

  // Workflow Configuration
  workflow?: IWorkflowConfig;

  // Approval Configuration
  approval?: IApprovalConfig;

  // Auto-Assignment Rules
  assignment_rules: IAssignmentRule[];

  // Business Rules
  business_rules: IBusinessRule[];

  // Settings
  settings: IFormSettings;

  // Access Control
  access: IFormAccess;

  // Metadata
  created_by: string;
  updated_by?: string;
  created_at: Date;
  updated_at: Date;
  site_id?: string;
}

/**
 * قاعدة التحقق
 */
export interface IValidationRule {
  rule_id: string;
  name: string;
  type: 'field' | 'cross_field' | 'form';
  field_ids?: string[];
  condition: IConditionGroup;
  error_message: string;
  error_message_ar: string;
  is_active: boolean;
}

/**
 * المرفق
 */
export interface IAttachment {
  attachment_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  uploaded_by: string;
  uploaded_at: Date;
}

/**
 * سجل الموافقة
 */
export interface IApprovalRecord {
  step: number;
  approver_id: string;
  approver_name: string;
  status: 'pending' | 'approved' | 'rejected' | 'delegated' | 'skipped';
  decision_at?: Date;
  comments?: string;
  delegated_to?: string;
  delegated_by?: string;
  delegated_from?: string;
}

/**
 * حدث الجدول الزمني
 */
export interface ITimelineEvent {
  event_id: string;
  type: string;
  description: string;
  description_ar?: string;
  user_id?: string;
  user_name?: string;
  data?: Record<string, any>;
  created_at: Date;
}

/**
 * التعليق
 */
export interface IComment {
  comment_id: string;
  content: string;
  user_id: string;
  user_name: string;
  is_internal: boolean;
  attachments?: IAttachment[];
  created_at: Date;
  updated_at?: Date;
}

/**
 * المعين
 */
export interface IAssignee {
  user_id: string;
  name: string;
  email?: string;
  assigned_at: Date;
  assigned_by?: string;
}

/**
 * حالة SLA
 */
export interface ISLAState {
  sla_id: string;
  started_at: Date;
  response_due: Date;
  resolution_due: Date;
  response_at?: Date;
  resolved_at?: Date;
  breach_flag: boolean;
  paused_duration_minutes: number;
  is_paused: boolean;
  paused_at?: Date;
}

/**
 * حالة سير العمل
 */
export interface IWorkflowState {
  current_step_id: string;
  status: SubmissionStatus;
  assigned_to?: IAssignee;
  approvals: IApprovalRecord[];
  sla?: ISLAState;
}

/**
 * حالة النشاط
 */
export interface IActivityState {
  activity_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completed_at?: Date;
  completed_by?: string;
  data?: Record<string, any>;
}

/**
 * مقدم النموذج
 */
export interface ISubmitter {
  user_id: string;
  id?: string; // alias for user_id for compatibility
  name: string;
  email: string;
  role?: string;
  department?: string;
  site_id?: string;
}

/**
 * بيانات التوقيع
 */
export interface ISignatureData {
  data: string;
  signed_at: Date;
  ip_address: string;
}

/**
 * بيانات الموقع الجغرافي
 */
export interface IGeolocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  captured_at: Date;
}

/**
 * تقديم النموذج
 */
export interface IFormSubmission {
  _id?: ObjectId;
  submission_id: string;

  // Reference
  form_template_id: string;
  form_version: number;

  // Submitter
  submitted_by: ISubmitter;

  // Form Data
  data: Record<string, any>;

  // Attachments
  attachments: IAttachment[];

  // Signature
  signature?: ISignatureData;

  // Geolocation
  geolocation?: IGeolocationData;

  // Workflow State
  workflow_state: IWorkflowState;

  // History
  timeline: ITimelineEvent[];

  // Comments
  comments: IComment[];

  // Sub-activities status
  activities: IActivityState[];

  // Linked items
  linked_submissions?: string[];
  parent_submission_id?: string;

  // Metadata
  site_id?: string;
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
  cancelled_at?: Date;
  rejected_at?: Date;
  rejection_reason?: string;
}

// ============================================
// UTILITY TYPES - أنواع مساعدة
// ============================================

/**
 * نتيجة التحقق
 */
export interface IValidationResult {
  valid: boolean;
  errors: IValidationError[];
}

/**
 * خطأ التحقق
 */
export interface IValidationError {
  field_id: string;
  type: string;
  message: string;
  message_ar?: string;
}

/**
 * نتيجة التحقق من النموذج
 */
export interface IFormValidationResult {
  valid: boolean;
  errors: IValidationError[];
  fieldResults: Map<string, IValidationResult>;
}

/**
 * سياق التقييم
 */
export interface IEvaluationContext {
  formData: Record<string, any>;
  user: ISubmitter | {
    id?: string;
    user_id?: string;
    role?: string;
    department?: string;
    site_id?: string;
    [key: string]: any;
  };
  submission?: IFormSubmission;
  locale?: 'en' | 'ar';
}

/**
 * سياق التنفيذ
 */
export interface IExecutionContext extends IEvaluationContext {
  token?: string;
}

/**
 * سياق النموذج
 */
export interface IFormContext {
  user: {
    id: string;
    name: string;
    email: string;
    role?: string;
    department?: string;
    site_id?: string;
    [key: string]: any;
  };
  data: Record<string, any>;
  token?: string;
  locale: 'en' | 'ar';
}

/**
 * الحقل المُعرض
 */
export interface IRenderedField extends ISmartField {
  visible: boolean;
  value: any;
  errors: IValidationError[];
  state: {
    disabled: boolean;
    readonly: boolean;
    required: boolean;
  };
}

/**
 * تحديث الحقل
 */
export interface IFieldUpdate {
  fieldId: string;
  property: string;
  value: any;
}

/**
 * نتيجة تحديث الحقل
 */
export interface IFieldUpdateResult {
  updates: IFieldUpdate[];
  shouldValidate: boolean;
}

/**
 * نتيجة الإجراء
 */
export interface IActionResult {
  type: string;
  fieldId?: string;
  property?: string;
  value?: any;
  level?: 'info' | 'warning' | 'error';
  message?: string;
}

/**
 * نتيجة الشرط
 */
export interface IConditionalResult {
  appliedRules: string[];
  actions: IActionResult[];
}

/**
 * نتيجة انتقال سير العمل
 */
export interface IWorkflowTransitionResult {
  success: boolean;
  new_step: IWorkflowStep;
  new_status: SubmissionStatus;
  assigned_to: IAssignee | null;
}

/**
 * نتيجة الموافقة
 */
export interface IApprovalResult {
  status: 'in_progress' | 'fully_approved' | 'rejected' | 'auto_approved';
  current_step?: number;
  completed_at?: Date;
  auto_approve_rule?: string;
}

/**
 * نتيجة تنفيذ القاعدة
 */
export interface IRuleExecutionResult {
  rule_id: string;
  executed_at: Date;
  actions: {
    action_id: string;
    success: boolean;
    result?: any;
    error?: string;
  }[];
}

/**
 * سياق القاعدة
 */
export interface IRuleContext extends IEvaluationContext {
  form_template_id: string;
  submission: IFormSubmission;
  trigger_type: RuleTriggerType;
  trigger_data?: Record<string, any>;
}
