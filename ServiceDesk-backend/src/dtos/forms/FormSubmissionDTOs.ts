/**
 * Form Submission DTOs (Data Transfer Objects)
 * Defines request/response contracts for form submission endpoints
 */

// ============================================
// REQUEST DTOs
// ============================================

export interface CreateFormSubmissionRequestDTO {
  form_template_id: string;
  data: Record<string, unknown>;
  attachments?: AttachmentDTO[];
  signature?: SignatureDTO;
  geolocation?: GeolocationDTO;
  is_draft?: boolean;
}

export interface UpdateFormSubmissionRequestDTO {
  data?: Record<string, unknown>;
  attachments?: AttachmentDTO[];
}

export interface SubmitDraftRequestDTO {
  // No body required - uses submission ID from URL
}

export interface ExecuteWorkflowActionRequestDTO {
  action_id: string;
  comments?: string;
  signature?: string;
}

export interface ApproveSubmissionRequestDTO {
  comments?: string;
}

export interface RejectSubmissionRequestDTO {
  reason: string;
  comments?: string;
}

export interface AssignSubmissionRequestDTO {
  assignee_id: string;
  notes?: string;
}

export interface ReassignSubmissionRequestDTO {
  new_assignee_id: string;
  reason?: string;
}

export interface ListSubmissionsQueryDTO {
  page?: number;
  limit?: number;
  status?: string;
  form_template_id?: string;
  submitted_by?: string;
  assigned_to?: string;
  site_id?: string;
  from_date?: string;
  to_date?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// ============================================
// RESPONSE DTOs
// ============================================

export interface FormSubmissionResponseDTO {
  id: string;
  form_template_id: string;
  form_version: number;
  submitted_by: SubmitterDTO;
  data: Record<string, unknown>;
  attachments: AttachmentDTO[];
  signature?: SignatureDTO;
  geolocation?: GeolocationDTO;
  workflow_state: WorkflowStateDTO;
  timeline: TimelineEventDTO[];
  comments: CommentDTO[];
  status: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  rejected_at?: string;
}

export interface FormSubmissionListResponseDTO {
  submissions: FormSubmissionResponseDTO[];
  pagination: PaginationDTO;
  total: number;
}

export interface WorkflowStateDTO {
  current_step_id: string;
  status: string;
  assigned_to?: string;
  approvals: ApprovalDTO[];
}

export interface ApprovalDTO {
  id: string;
  approver_id: string;
  approver_name: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  approved_at?: string;
  rejected_at?: string;
}

export interface TimelineEventDTO {
  id: string;
  event_type: string;
  title: string;
  title_ar: string;
  actor_id: string;
  actor_name: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface CommentDTO {
  id: string;
  author_id: string;
  author_name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface SubmitterDTO {
  user_id: string;
  name: string;
  email: string;
  department?: string;
  site_id?: string;
}

export interface AttachmentDTO {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
  uploaded_at: string;
}

export interface SignatureDTO {
  data: string;
  ip_address: string;
  signed_at?: string;
}

export interface GeolocationDTO {
  latitude: number;
  longitude: number;
  accuracy: number;
  captured_at?: string;
}

export interface PaginationDTO {
  page: number;
  limit: number;
  total_pages: number;
}

// ============================================
// ACTION RESPONSE DTOs
// ============================================

export interface WorkflowActionResponseDTO {
  success: boolean;
  submission: FormSubmissionResponseDTO;
  message: string;
}

export interface ApprovalResponseDTO {
  success: boolean;
  submission: FormSubmissionResponseDTO;
  approval: ApprovalDTO;
  message: string;
}

export interface AssignmentResponseDTO {
  success: boolean;
  submission: FormSubmissionResponseDTO;
  assigned_to: string;
  message: string;
}

export interface AvailableActionsResponseDTO {
  actions: WorkflowActionDTO[];
}

export interface WorkflowActionDTO {
  id: string;
  name: string;
  description: string;
  requires_approval?: boolean;
  requires_signature?: boolean;
}
