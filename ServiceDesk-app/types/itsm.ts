/**
 * ITSM Frontend Types
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
  created_at: string;
}

export interface IAttachment {
  file_id: string;
  name: string;
  size: number;
  mime_type: string;
  url: string;
  uploaded_by: string;
  uploaded_at: string;
}

export interface ITimelineEvent {
  event: string;
  by: string;
  by_name?: string;
  time: string;
  details?: Record<string, unknown>;
}

export interface IResolution {
  code: string;
  notes: string;
  resolved_by: string;
  resolved_by_name: string;
  resolved_at: string;
}

export interface ISLAConfig {
  sla_id: string;
  response_due: string;
  resolution_due: string;
  response_met?: boolean;
  resolution_met?: boolean;
  response_at?: string;
  resolved_at?: string;
  breach_flag: boolean;
  escalation_level: number;
  paused_at?: string;
  paused_duration_minutes?: number;
}

// ============================================
// INTERFACES - Incident
// ============================================

export interface IIncident {
  _id: string;
  incident_id: string;
  title: string;
  description: string;
  status: IncidentStatus;
  priority: Priority;
  impact: Impact;
  urgency: Urgency;
  category_id: string;
  subcategory_id?: string;
  requester: IRequester;
  channel: Channel;
  assigned_to?: IAssignee;
  sla: ISLAConfig;
  worklogs: IWorklog[];
  attachments: IAttachment[];
  timeline: ITimelineEvent[];
  linked_problem_id?: string;
  linked_change_id?: string;
  linked_incidents?: string[];
  resolution?: IResolution;
  site_id: string;
  tags?: string[];
  is_major: boolean;
  reopen_count: number;
  first_response_at?: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  // Virtuals
  is_sla_breached?: boolean;
  time_to_breach_minutes?: number;
  total_worklog_minutes?: number;
}

// ============================================
// INTERFACES - Problem
// ============================================

export interface IKnownError {
  ke_id: string;
  title: string;
  symptoms: string;
  root_cause: string;
  workaround: string;
  documented_at: string;
  documented_by: string;
}

export interface IProblem {
  _id: string;
  problem_id: string;
  title: string;
  description: string;
  status: ProblemStatus;
  priority: Priority;
  impact: Impact;
  category_id: string;
  subcategory_id?: string;
  root_cause?: string;
  workaround?: string;
  permanent_fix?: string;
  linked_incidents: string[];
  linked_changes?: string[];
  owner: {
    id: string;
    name: string;
    email: string;
  };
  assigned_group?: {
    group_id: string;
    group_name: string;
  };
  known_error?: IKnownError;
  timeline: ITimelineEvent[];
  attachments: IAttachment[];
  site_id: string;
  tags?: string[];
  affected_services?: string[];
  affected_users_count?: number;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  // Virtuals
  linked_incidents_count?: number;
  is_known_error?: boolean;
}

// ============================================
// INTERFACES - Change
// ============================================

export interface ICabMember {
  member_id: string;
  name: string;
  role: string;
  decision?: ApprovalStatus;
  decision_at?: string;
  comments?: string;
}

export interface ICabApproval {
  cab_status: ApprovalStatus;
  required_approvers: number;
  current_approvers: number;
  members: ICabMember[];
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
}

export interface ISchedule {
  planned_start: string;
  planned_end: string;
  actual_start?: string;
  actual_end?: string;
  maintenance_window?: string;
  downtime_minutes?: number;
}

export interface IChange {
  _id: string;
  change_id: string;
  type: ChangeType;
  title: string;
  description: string;
  status: ChangeStatus;
  priority: Priority;
  impact: Impact;
  risk: RiskLevel;
  risk_assessment: string;
  requested_by: {
    id: string;
    name: string;
    email: string;
    department: string;
  };
  owner?: {
    id: string;
    name: string;
    email: string;
  };
  implementation_plan: string;
  rollback_plan: string;
  test_plan?: string;
  communication_plan?: string;
  cab_required: boolean;
  approval: ICabApproval;
  schedule: ISchedule;
  linked_problems?: string[];
  linked_incidents?: string[];
  release_id?: string;
  affected_services: string[];
  affected_cis?: string[];
  timeline: ITimelineEvent[];
  attachments: IAttachment[];
  site_id: string;
  tags?: string[];
  reason_for_change: string;
  business_justification?: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  // Virtuals
  is_emergency?: boolean;
  is_approved?: boolean;
  approval_progress?: number;
}

// ============================================
// INTERFACES - Statistics
// ============================================

export interface IIncidentStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  breached: number;
}

export interface IProblemStats {
  total: number;
  logged: number;
  rcaInProgress: number;
  knownErrors: number;
  resolved: number;
}

export interface IChangeStats {
  total: number;
  draft: number;
  pendingApproval: number;
  approved: number;
  scheduled: number;
  implementing: number;
  completed: number;
  failed: number;
}

// ============================================
// INTERFACES - API Responses
// ============================================

export interface IPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: IPagination;
}

export interface IApiListResponse<T> {
  success: boolean;
  data: T[];
  pagination: IPagination;
}

// ============================================
// INTERFACES - Create/Update DTOs
// ============================================

export interface CreateIncidentDTO {
  title: string;
  description: string;
  impact: Impact;
  urgency: Urgency;
  category_id: string;
  subcategory_id?: string;
  channel?: Channel;
  site_id: string;
  department?: string;
  phone?: string;
  tags?: string[];
  is_major?: boolean;
}

export interface UpdateIncidentDTO {
  title?: string;
  description?: string;
  impact?: Impact;
  urgency?: Urgency;
  category_id?: string;
  subcategory_id?: string;
  tags?: string[];
  is_major?: boolean;
}

export interface CreateProblemDTO {
  title: string;
  description: string;
  priority: Priority;
  impact: Impact;
  category_id: string;
  subcategory_id?: string;
  site_id: string;
  linked_incidents?: string[];
  tags?: string[];
  affected_services?: string[];
}

export interface CreateChangeDTO {
  type: ChangeType;
  title: string;
  description: string;
  priority: Priority;
  impact: Impact;
  risk: RiskLevel;
  risk_assessment: string;
  implementation_plan: string;
  rollback_plan: string;
  test_plan?: string;
  communication_plan?: string;
  schedule: {
    planned_start: string;
    planned_end: string;
    maintenance_window?: string;
  };
  affected_services: string[];
  affected_cis?: string[];
  site_id: string;
  reason_for_change: string;
  business_justification?: string;
  department?: string;
  linked_problems?: string[];
  linked_incidents?: string[];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getPriorityColor = (priority: Priority): string => {
  const colors: Record<Priority, string> = {
    [Priority.CRITICAL]: 'bg-red-600 text-white',
    [Priority.HIGH]: 'bg-orange-500 text-white',
    [Priority.MEDIUM]: 'bg-yellow-500 text-black',
    [Priority.LOW]: 'bg-green-500 text-white',
  };
  return colors[priority] || 'bg-gray-500 text-white';
};

export const getStatusColor = (status: IncidentStatus | ProblemStatus | ChangeStatus): string => {
  const colors: Record<string, string> = {
    // Incident statuses
    open: 'bg-blue-500 text-white',
    in_progress: 'bg-yellow-500 text-black',
    pending: 'bg-orange-500 text-white',
    resolved: 'bg-green-500 text-white',
    closed: 'bg-gray-500 text-white',
    cancelled: 'bg-gray-400 text-white',
    // Problem statuses
    logged: 'bg-blue-500 text-white',
    rca_in_progress: 'bg-yellow-500 text-black',
    known_error: 'bg-purple-500 text-white',
    // Change statuses
    draft: 'bg-gray-400 text-white',
    submitted: 'bg-blue-400 text-white',
    cab_review: 'bg-yellow-500 text-black',
    approved: 'bg-green-400 text-white',
    rejected: 'bg-red-500 text-white',
    scheduled: 'bg-indigo-500 text-white',
    implementing: 'bg-orange-500 text-white',
    completed: 'bg-green-600 text-white',
    failed: 'bg-red-600 text-white',
  };
  return colors[status] || 'bg-gray-500 text-white';
};

export const formatSLATime = (minutes: number): string => {
  if (minutes < 0) return 'Breached';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return `${hours}h ${mins}m`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}d ${remainingHours}h`;
};

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
