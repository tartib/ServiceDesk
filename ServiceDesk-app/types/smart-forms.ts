/**
 * Smart Forms System - Frontend Type Definitions
 * نظام النماذج الذكية - تعريفات الأنواع للواجهة الأمامية
 */

// ============================================
// ENUMS - التعدادات
// ============================================

export enum SmartFieldType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  NUMBER = 'number',
  DECIMAL = 'decimal',
  EMAIL = 'email',
  PHONE = 'phone',
  URL = 'url',
  PASSWORD = 'password',
  DATE = 'date',
  TIME = 'time',
  DATETIME = 'datetime',
  DATE_RANGE = 'date_range',
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  TOGGLE = 'toggle',
  FILE = 'file',
  MULTI_FILE = 'multi_file',
  IMAGE = 'image',
  SIGNATURE = 'signature',
  GEOLOCATION = 'geolocation',
  ADDRESS = 'address',
  RICH_TEXT = 'rich_text',
  MARKDOWN = 'markdown',
  USER_LOOKUP = 'user_lookup',
  ENTITY_LOOKUP = 'entity_lookup',
  CASCADING_SELECT = 'cascading_select',
  FORMULA = 'formula',
  AGGREGATION = 'aggregation',
  SECTION_HEADER = 'section_header',
  DIVIDER = 'divider',
  INFO_BOX = 'info_box',
  CUSTOM = 'custom',
}

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

export enum ConditionalActionType {
  SHOW_FIELD = 'show_field',
  HIDE_FIELD = 'hide_field',
  SHOW_SECTION = 'show_section',
  HIDE_SECTION = 'hide_section',
  ENABLE_FIELD = 'enable_field',
  DISABLE_FIELD = 'disable_field',
  SET_REQUIRED = 'set_required',
  SET_OPTIONAL = 'set_optional',
  SET_READONLY = 'set_readonly',
  SET_VALUE = 'set_value',
  CLEAR_VALUE = 'clear_value',
  CALCULATE_VALUE = 'calculate_value',
  FILTER_OPTIONS = 'filter_options',
  SET_OPTIONS = 'set_options',
  ADD_VALIDATION = 'add_validation',
  REMOVE_VALIDATION = 'remove_validation',
  SHOW_MESSAGE = 'show_message',
  SHOW_WARNING = 'show_warning',
  SHOW_ERROR = 'show_error',
}

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

export enum ApprovalType {
  SEQUENTIAL = 'sequential',
  PARALLEL = 'parallel',
  HIERARCHICAL = 'hierarchical',
  CONDITIONAL = 'conditional',
  HYBRID = 'hybrid',
}

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

export enum FormLayoutType {
  SINGLE_COLUMN = 'single_column',
  TWO_COLUMN = 'two_column',
  WIZARD = 'wizard',
  TABS = 'tabs',
}

// ============================================
// INTERFACES - الواجهات
// ============================================

export interface FieldOption {
  value: string;
  label: string;
  label_ar?: string;
  icon?: string;
  color?: string;
  disabled?: boolean;
  metadata?: Record<string, unknown>;
}

export interface FieldValidation {
  required: boolean;
  required_condition?: Condition;
  min?: number;
  max?: number;
  min_length?: number;
  max_length?: number;
  pattern?: string;
  pattern_message?: string;
  pattern_message_ar?: string;
  custom_validator?: string;
}

export interface FieldDisplay {
  order: number;
  section_id?: string;
  width: 'full' | 'half' | 'third' | 'quarter';
  hidden: boolean;
  readonly: boolean;
  css_class?: string;
}

export interface SmartField {
  field_id: string;
  type: SmartFieldType;
  label: string;
  label_ar: string;
  placeholder?: string;
  placeholder_ar?: string;
  help_text?: string;
  help_text_ar?: string;
  default_value?: unknown;
  default_value_source?: {
    type: 'static' | 'user_attribute' | 'api' | 'formula';
    value: string;
  };
  options?: FieldOption[];
  options_source?: {
    type: 'static' | 'api' | 'lookup';
    endpoint?: string;
    lookup_entity?: string;
    value_field?: string;
    label_field?: string;
    filters?: Record<string, unknown>;
  };
  validation: FieldValidation;
  display: FieldDisplay;
  visibility_conditions?: Condition[];
  depends_on?: string[];
  settings: Record<string, unknown>;
}

export interface FormSection {
  section_id: string;
  title: string;
  title_ar: string;
  description?: string;
  description_ar?: string;
  order: number;
  collapsible: boolean;
  collapsed_by_default: boolean;
}

export interface Condition {
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

export interface ConditionGroup {
  operator: 'AND' | 'OR';
  conditions: (Condition | ConditionGroup)[];
}

export interface ConditionalAction {
  action_type: ConditionalActionType;
  target_field_id?: string;
  target_section_id?: string;
  value?: any;
  message?: string;
  message_ar?: string;
}

export interface ConditionalRule {
  rule_id: string;
  name: string;
  description?: string;
  conditions: ConditionGroup;
  actions: ConditionalAction[];
  priority: number;
  is_active: boolean;
}

export interface WorkflowAction {
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
  visible_when?: ConditionGroup;
}

export interface WorkflowStep {
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
  available_actions: WorkflowAction[];
  sla?: {
    response_hours: number;
    warning_percent: number;
  };
  is_final: boolean;
  is_approval_step: boolean;
}

export interface WorkflowTransition {
  transition_id: string;
  from_step_id: string;
  to_step_id: string;
  trigger: {
    type: 'action' | 'condition' | 'auto';
    action_id?: string;
    condition?: ConditionGroup;
    auto_after_hours?: number;
  };
}

export interface WorkflowConfig {
  workflow_id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  initial_step_id: string;
  transitions: WorkflowTransition[];
  settings: {
    allow_parallel_steps: boolean;
    require_comments_on_reject: boolean;
    enable_delegation: boolean;
    max_delegation_depth: number;
    auto_close_after_days?: number;
  };
}

export interface FormSettings {
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

export interface FormAccess {
  available_to: string[];
  restricted_from?: string[];
  requires_authentication: boolean;
}

export interface FormTemplate {
  _id: string;
  form_id: string;
  name: string;
  name_ar: string;
  description?: string;
  description_ar?: string;
  category: string;
  icon?: string;
  version: number;
  is_published: boolean;
  published_at?: string;
  fields: SmartField[];
  layout: {
    type: FormLayoutType;
    sections?: FormSection[];
  };
  conditional_rules: ConditionalRule[];
  workflow?: WorkflowConfig;
  settings: FormSettings;
  access: FormAccess;
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  site_id?: string;
  field_count?: number;
  submission_count?: number;
  has_workflow?: boolean;
}

export interface Attachment {
  attachment_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  uploaded_by: string;
  uploaded_at: string;
}

export interface ApprovalRecord {
  step: number;
  approver_id: string;
  approver_name: string;
  status: 'pending' | 'approved' | 'rejected' | 'delegated' | 'skipped';
  decision_at?: string;
  comments?: string;
  delegated_to?: string;
  delegated_by?: string;
}

export interface TimelineEvent {
  event_id: string;
  type: string;
  description: string;
  description_ar?: string;
  user_id?: string;
  user_name?: string;
  data?: Record<string, unknown>;
  created_at: string;
}

export interface Comment {
  comment_id: string;
  content: string;
  user_id: string;
  user_name: string;
  is_internal: boolean;
  attachments?: Attachment[];
  created_at: string;
  updated_at?: string;
}

export interface Assignee {
  user_id: string;
  name: string;
  email?: string;
  assigned_at: string;
  assigned_by?: string;
}

export interface SLAState {
  sla_id: string;
  started_at: string;
  response_due: string;
  resolution_due: string;
  response_at?: string;
  resolved_at?: string;
  breach_flag: boolean;
  paused_duration_minutes: number;
  is_paused: boolean;
}

export interface WorkflowState {
  current_step_id: string;
  status: SubmissionStatus;
  assigned_to?: Assignee;
  approvals: ApprovalRecord[];
  sla?: SLAState;
}

export interface Submitter {
  user_id: string;
  name: string;
  email: string;
  department?: string;
  site_id?: string;
}

export interface FormSubmission {
  _id: string;
  submission_id: string;
  form_template_id: string;
  form_version: number;
  submitted_by: Submitter;
  data: Record<string, any>;
  attachments: Attachment[];
  signature?: {
    data: string;
    signed_at: string;
    ip_address: string;
  };
  geolocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    captured_at: string;
  };
  workflow_state: WorkflowState;
  timeline: TimelineEvent[];
  comments: Comment[];
  linked_submissions?: string[];
  parent_submission_id?: string;
  site_id?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  cancelled_at?: string;
  status?: SubmissionStatus;
  is_draft?: boolean;
  is_completed?: boolean;
  is_pending_approval?: boolean;
  sla_breached?: boolean;
}

// ============================================
// API TYPES - أنواع API
// ============================================

export interface CreateFormTemplateDTO {
  name: string;
  name_ar: string;
  description?: string;
  description_ar?: string;
  category: string;
  icon?: string;
  fields?: SmartField[];
  layout?: {
    type: FormLayoutType;
    sections?: FormSection[];
  };
  settings?: Partial<FormSettings>;
  access?: Partial<FormAccess>;
}

export interface UpdateFormTemplateDTO {
  name?: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  category?: string;
  icon?: string;
  fields?: SmartField[];
  layout?: {
    type: FormLayoutType;
    sections?: FormSection[];
  };
  conditional_rules?: ConditionalRule[];
  workflow?: WorkflowConfig;
  settings?: Partial<FormSettings>;
  access?: Partial<FormAccess>;
}

export interface FormTemplateListParams {
  page?: number;
  limit?: number;
  category?: string;
  is_published?: boolean;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface FormTemplateListResponse {
  success: boolean;
  data: FormTemplate[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface FormTemplateResponse {
  success: boolean;
  data: FormTemplate;
  message?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  message_ar: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// ============================================
// FORM STATE TYPES - أنواع حالة النموذج
// ============================================

export interface RenderedField extends SmartField {
  visible: boolean;
  value: unknown;
  errors: { type: string; message: string }[];
  state: {
    disabled: boolean;
    readonly: boolean;
    required: boolean;
  };
}

export interface FormState {
  template: FormTemplate | null;
  fields: RenderedField[];
  data: Record<string, any>;
  errors: Record<string, string[]>;
  isLoading: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  currentStep?: number;
  totalSteps?: number;
}

export interface FormBuilderState {
  template: Partial<FormTemplate>;
  selectedFieldId: string | null;
  selectedSectionId: string | null;
  isDragging: boolean;
  history: Partial<FormTemplate>[];
  historyIndex: number;
}

// ============================================
// FIELD COMPONENT PROPS - خصائص مكونات الحقول
// ============================================

export interface BaseFieldProps {
  field: RenderedField;
  value: unknown;
  onChange: (value: any) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  readonly?: boolean;
  locale?: 'en' | 'ar';
}

export interface SelectFieldProps extends BaseFieldProps {
  options: FieldOption[];
  isMulti?: boolean;
  isSearchable?: boolean;
  isLoading?: boolean;
}

export interface FileFieldProps extends BaseFieldProps {
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
  onUpload?: (files: File[]) => Promise<Attachment[]>;
}

export interface SignatureFieldProps extends BaseFieldProps {
  width?: number;
  height?: number;
  penColor?: string;
  backgroundColor?: string;
}

export interface GeolocationFieldProps extends BaseFieldProps {
  enableHighAccuracy?: boolean;
  showMap?: boolean;
}
