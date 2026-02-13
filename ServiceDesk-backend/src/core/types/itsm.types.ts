/**
 * ITSM Core Types
 * IT Service Management System Type Definitions
 */

// ============================================
// ENUMS
// ============================================

export enum IncidentStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  PENDING = 'pending',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

export enum ProblemStatus {
  LOGGED = 'logged',
  RCA_IN_PROGRESS = 'rca_in_progress',
  KNOWN_ERROR = 'known_error',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum ChangeStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  CAB_REVIEW = 'cab_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SCHEDULED = 'scheduled',
  IMPLEMENTING = 'implementing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum ReleaseStatus {
  PLANNING = 'planning',
  BUILDING = 'building',
  TESTING = 'testing',
  APPROVED = 'approved',
  DEPLOYED = 'deployed',
  ROLLED_BACK = 'rolled_back',
  CLOSED = 'closed',
}

export enum ServiceRequestStatus {
  SUBMITTED = 'submitted',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  IN_PROGRESS = 'in_progress',
  FULFILLED = 'fulfilled',
  CANCELLED = 'cancelled',
}

export enum Priority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum Impact {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum Urgency {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum Channel {
  SELF_SERVICE = 'self_service',
  EMAIL = 'email',
  PHONE = 'phone',
  CHAT = 'chat',
  WALK_IN = 'walk_in',
  API = 'api',
}

export enum ChangeType {
  NORMAL = 'normal',
  STANDARD = 'standard',
  EMERGENCY = 'emergency',
}

export enum RiskLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum ServiceCategory {
  ACCESS_MANAGEMENT = 'access_management',
  HARDWARE = 'hardware',
  SOFTWARE = 'software',
  NETWORK = 'network',
  ACCOUNTS = 'accounts',
  GENERAL_REQUEST = 'general_request',
}

export enum FulfillmentType {
  MANUAL = 'manual',
  AUTOMATED = 'automated',
  HYBRID = 'hybrid',
}

export enum FormFieldType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  NUMBER = 'number',
  EMAIL = 'email',
  PHONE = 'phone',
  DATE = 'date',
  DATETIME = 'datetime',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  FILE = 'file',
}

export enum UserRole {
  END_USER = 'end_user',
  TECHNICIAN = 'technician',
  TEAM_LEAD = 'team_lead',
  MANAGER = 'manager',
  CAB_MEMBER = 'cab_member',
  ADMIN = 'admin',
}

// ============================================
// INTERFACES - Common
// ============================================

export interface IRequester {
  id: string;
  name: string;
  email: string;
  department: string;
  phone?: string;
  site_id?: string;
}

export interface IAssignee {
  technician_id: string;
  name: string;
  email: string;
  group_id?: string;
  group_name?: string;
}

export interface IWorklog {
  log_id: string;
  by: string;
  by_name: string;
  minutes_spent: number;
  note: string;
  is_internal: boolean;
  created_at: Date;
}

export interface IAttachment {
  file_id: string;
  name: string;
  size: number;
  mime_type: string;
  url: string;
  uploaded_by: string;
  uploaded_at: Date;
}

export interface ITimelineEvent {
  event: string;
  by: string;
  by_name?: string;
  time: Date;
  details?: Record<string, any>;
}

export interface IResolution {
  code: string;
  notes: string;
  resolved_by: string;
  resolved_by_name: string;
  resolved_at: Date;
}

// ============================================
// INTERFACES - SLA
// ============================================

export interface IEscalationLevel {
  level: number;
  after_minutes: number;
  notify_role: UserRole;
  notify_users?: string[];
  action?: string;
}

export interface IBusinessSchedule {
  day: number; // 0-6 (Sunday-Saturday)
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  is_working: boolean;
}

export interface ISLAConfig {
  sla_id: string;
  response_due: Date;
  resolution_due: Date;
  response_met?: boolean;
  resolution_met?: boolean;
  response_at?: Date;
  resolved_at?: Date;
  breach_flag: boolean;
  escalation_level: number;
  paused_at?: Date;
  paused_duration_minutes?: number;
}

// ============================================
// INTERFACES - CAB (Change Advisory Board)
// ============================================

export interface ICabMember {
  member_id: string;
  name: string;
  role: string;
  decision?: ApprovalStatus;
  decision_at?: Date;
  comments?: string;
}

export interface ICabApproval {
  cab_status: ApprovalStatus;
  required_approvers: number;
  current_approvers: number;
  members: ICabMember[];
  approved_at?: Date;
  rejected_at?: Date;
  rejection_reason?: string;
}

// ============================================
// INTERFACES - Schedule
// ============================================

export interface ISchedule {
  planned_start: Date;
  planned_end: Date;
  actual_start?: Date;
  actual_end?: Date;
  maintenance_window?: string;
  downtime_minutes?: number;
}

// ============================================
// INTERFACES - Service Catalog
// ============================================

export interface IDynamicFormField {
  field_id: string;
  label: string;
  label_ar?: string;
  type: FormFieldType;
  required: boolean;
  placeholder?: string;
  default_value?: any;
  options?: { value: string; label: string; label_ar?: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  order: number;
  depends_on?: {
    field_id: string;
    value: any;
  };
}

export interface IApprovalStep {
  step: number;
  approver_type: 'role' | 'user' | 'group';
  approver_id: string;
  approver_name: string;
  is_optional: boolean;
  auto_approve_after_hours?: number;
}

export interface IServiceWorkflow {
  approval_chain: IApprovalStep[];
  auto_assign_group?: string;
  auto_assign_user?: string;
  sla_id: string;
  notification_template?: string;
}

// ============================================
// INTERFACES - Known Error
// ============================================

export interface IKnownError {
  ke_id: string;
  title: string;
  symptoms: string;
  root_cause: string;
  workaround: string;
  documented_at: Date;
  documented_by: string;
}

// ============================================
// ID Generation Helpers
// ============================================

export const generateIncidentId = (sequence: number): string => {
  const year = new Date().getFullYear();
  return `INC-${year}-${String(sequence).padStart(5, '0')}`;
};

export const generateProblemId = (sequence: number): string => {
  const year = new Date().getFullYear();
  return `PRB-${year}-${String(sequence).padStart(5, '0')}`;
};

export const generateChangeId = (sequence: number): string => {
  const year = new Date().getFullYear();
  return `CHG-${year}-${String(sequence).padStart(5, '0')}`;
};

export const generateReleaseId = (sequence: number): string => {
  const year = new Date().getFullYear();
  return `REL-${year}-${String(sequence).padStart(5, '0')}`;
};

export const generateServiceRequestId = (sequence: number): string => {
  const year = new Date().getFullYear();
  return `SRQ-${year}-${String(sequence).padStart(5, '0')}`;
};

// ============================================
// Priority Matrix Calculator
// ============================================

export const calculatePriority = (impact: Impact, urgency: Urgency): Priority => {
  const matrix: Record<Impact, Record<Urgency, Priority>> = {
    [Impact.HIGH]: {
      [Urgency.HIGH]: Priority.CRITICAL,
      [Urgency.MEDIUM]: Priority.HIGH,
      [Urgency.LOW]: Priority.MEDIUM,
    },
    [Impact.MEDIUM]: {
      [Urgency.HIGH]: Priority.HIGH,
      [Urgency.MEDIUM]: Priority.MEDIUM,
      [Urgency.LOW]: Priority.LOW,
    },
    [Impact.LOW]: {
      [Urgency.HIGH]: Priority.MEDIUM,
      [Urgency.MEDIUM]: Priority.LOW,
      [Urgency.LOW]: Priority.LOW,
    },
  };

  return matrix[impact][urgency];
};
