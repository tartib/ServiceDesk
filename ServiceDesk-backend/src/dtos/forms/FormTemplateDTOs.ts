/**
 * Form Template DTOs (Data Transfer Objects)
 * Defines request/response contracts for form template endpoints
 */

// ============================================
// REQUEST DTOs
// ============================================

export interface CreateFormTemplateRequestDTO {
  name: string;
  name_ar: string;
  description?: string;
  description_ar?: string;
  category?: string;
  fields: FormFieldDTO[];
  workflow?: WorkflowConfigDTO;
  approval?: ApprovalConfigDTO;
  assignment_rules?: AssignmentRuleDTO[];
}

export interface UpdateFormTemplateRequestDTO {
  name?: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  category?: string;
  fields?: FormFieldDTO[];
}

export interface PublishFormTemplateRequestDTO {
  // No body required - uses template ID from URL
}

export interface AddFieldRequestDTO {
  field: FormFieldDTO;
}

export interface UpdateFieldRequestDTO {
  field: FormFieldDTO;
}

export interface RemoveFieldRequestDTO {
  field_id: string;
}

export interface ReorderFieldsRequestDTO {
  field_orders: string[];
}

export interface UpdateWorkflowRequestDTO {
  workflow: WorkflowConfigDTO;
}

export interface UpdateApprovalRequestDTO {
  approval: ApprovalConfigDTO;
}

export interface AddConditionalRuleRequestDTO {
  rule: ConditionalRuleDTO;
}

export interface AddBusinessRuleRequestDTO {
  rule: BusinessRuleDTO;
}

export interface CloneTemplateRequestDTO {
  name: string;
  name_ar: string;
}

// ============================================
// RESPONSE DTOs
// ============================================

export interface FormTemplateResponseDTO {
  id: string;
  name: string;
  name_ar: string;
  description?: string;
  description_ar?: string;
  category?: string;
  version: number;
  is_published: boolean;
  fields: FormFieldDTO[];
  workflow?: WorkflowConfigDTO;
  approval?: ApprovalConfigDTO;
  assignment_rules?: AssignmentRuleDTO[];
  conditional_rules?: ConditionalRuleDTO[];
  business_rules?: BusinessRuleDTO[];
  created_at: string;
  updated_at: string;
  published_at?: string;
  created_by: string;
  updated_by?: string;
}

export interface FormTemplateListResponseDTO {
  templates: FormTemplateResponseDTO[];
  pagination: PaginationDTO;
  total: number;
}

export interface FormFieldDTO {
  id: string;
  name: string;
  label: string;
  label_ar: string;
  type: 'text' | 'email' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea' | 'file' | 'signature';
  required: boolean;
  placeholder?: string;
  help_text?: string;
  help_text_ar?: string;
  validation?: FieldValidationDTO;
  options?: SelectOptionDTO[];
  default_value?: unknown;
  order: number;
  visible?: boolean;
  editable?: boolean;
}

export interface FieldValidationDTO {
  min_length?: number;
  max_length?: number;
  pattern?: string;
  custom_validator?: string;
  error_message?: string;
  error_message_ar?: string;
}

export interface SelectOptionDTO {
  value: string;
  label: string;
  label_ar: string;
}

export interface WorkflowConfigDTO {
  steps: WorkflowStepDTO[];
  initial_step_id: string;
}

export interface WorkflowStepDTO {
  step_id: string;
  name: string;
  name_ar: string;
  description?: string;
  description_ar?: string;
  actions: WorkflowActionDTO[];
  transitions: WorkflowTransitionDTO[];
}

export interface WorkflowActionDTO {
  action_id: string;
  name: string;
  name_ar: string;
  type: 'submit' | 'approve' | 'reject' | 'reassign' | 'custom';
  requires_approval?: boolean;
  requires_signature?: boolean;
}

export interface WorkflowTransitionDTO {
  from_step_id: string;
  to_step_id: string;
  action_id: string;
  condition?: string;
}

export interface ApprovalConfigDTO {
  required: boolean;
  approvers: ApproverDTO[];
  approval_type: 'sequential' | 'parallel';
  auto_approve_after_days?: number;
}

export interface ApproverDTO {
  approver_id: string;
  approver_name: string;
  approver_email: string;
  order?: number;
}

export interface AssignmentRuleDTO {
  rule_id: string;
  name: string;
  condition: string;
  assignee_id: string;
  assignee_name: string;
}

export interface ConditionalRuleDTO {
  rule_id: string;
  name: string;
  name_ar: string;
  condition: string;
  actions: ConditionalActionDTO[];
}

export interface ConditionalActionDTO {
  action_type: 'show' | 'hide' | 'require' | 'disable' | 'set_value';
  target_field_id: string;
  value?: unknown;
}

export interface BusinessRuleDTO {
  rule_id: string;
  name: string;
  name_ar: string;
  description?: string;
  description_ar?: string;
  condition: string;
  action: string;
  error_message?: string;
  error_message_ar?: string;
}

export interface PaginationDTO {
  page: number;
  limit: number;
  total_pages: number;
}

// ============================================
// ACTION RESPONSE DTOs
// ============================================

export interface PublishTemplateResponseDTO {
  success: boolean;
  template: FormTemplateResponseDTO;
  message: string;
}

export interface CloneTemplateResponseDTO {
  success: boolean;
  template: FormTemplateResponseDTO;
  message: string;
}

export interface CreateNewVersionResponseDTO {
  success: boolean;
  template: FormTemplateResponseDTO;
  message: string;
}

export interface FieldOperationResponseDTO {
  success: boolean;
  template: FormTemplateResponseDTO;
  message: string;
}
