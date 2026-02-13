/**
 * Forms DTOs
 */

// Form Template DTOs
export interface CreateFormTemplateDTO {
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  category: string;
  icon?: string;
  fields: FormFieldDTO[];
  layout?: {
    type: 'single-column' | 'two-column' | 'multi-section';
    sections?: FormSectionDTO[];
  };
  settings?: {
    allowDraft?: boolean;
    requireSignature?: boolean;
    allowAttachments?: boolean;
    multipleSubmissions?: boolean;
  };
  access?: {
    isPublic?: boolean;
    allowedRoles?: string[];
  };
}

export interface UpdateFormTemplateDTO {
  name?: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  category?: string;
  icon?: string;
  fields?: FormFieldDTO[];
  layout?: {
    type: 'single-column' | 'two-column' | 'multi-section';
    sections?: FormSectionDTO[];
  };
  settings?: {
    allowDraft?: boolean;
    requireSignature?: boolean;
    allowAttachments?: boolean;
    multipleSubmissions?: boolean;
  };
}

export interface FormTemplateDTO {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  category: string;
  icon?: string;
  fieldCount: number;
  submissionCount: number;
  status: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FormFieldDTO {
  id?: string;
  name: string;
  label: string;
  labelAr?: string;
  type: 'text' | 'textarea' | 'number' | 'email' | 'phone' | 'date' | 'select' | 'checkbox' | 'radio' | 'file';
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  options?: { label: string; value: string }[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    customRule?: string;
  };
  conditional?: {
    dependsOn: string;
    condition: string;
    value: string;
  };
}

export interface FormSectionDTO {
  id?: string;
  title: string;
  titleAr?: string;
  description?: string;
  fields: FormFieldDTO[];
}

// Form Submission DTOs
export interface CreateFormSubmissionDTO {
  formTemplateId: string;
  data: Record<string, unknown>;
  isDraft?: boolean;
  attachments?: {
    fieldId: string;
    fileUrl: string;
    fileName: string;
  }[];
  signature?: {
    data: string;
    ipAddress: string;
    timestamp: Date;
  };
  geolocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

export interface UpdateFormSubmissionDTO {
  data?: Record<string, unknown>;
  isDraft?: boolean;
  status?: string;
}

export interface FormSubmissionDTO {
  id: string;
  formTemplateId: string;
  formName: string;
  data: Record<string, unknown>;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'archived';
  submittedBy: string;
  submittedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  attachments: {
    fieldId: string;
    fileUrl: string;
    fileName: string;
  }[];
  signature?: {
    data: string;
    ipAddress: string;
    timestamp: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface FormSubmissionListDTO {
  items: FormSubmissionDTO[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Form Approval DTOs
export interface ApproveSubmissionDTO {
  submissionId: string;
  approverNotes?: string;
}

export interface RejectSubmissionDTO {
  submissionId: string;
  rejectionReason: string;
  returnForRevision?: boolean;
}

export interface ApprovalHistoryDTO {
  id: string;
  submissionId: string;
  action: 'submitted' | 'approved' | 'rejected' | 'revised';
  performedBy: string;
  notes?: string;
  timestamp: Date;
}

// Form Assignment DTOs
export interface AssignSubmissionDTO {
  submissionId: string;
  assigneeId: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: Date;
  notes?: string;
}

export interface FormAssignmentDTO {
  id: string;
  submissionId: string;
  assigneeId: string;
  assigneeName: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

// Form Workflow DTOs
export interface FormWorkflowDTO {
  id: string;
  formTemplateId: string;
  steps: WorkflowStepDTO[];
  currentStep: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowStepDTO {
  id: string;
  name: string;
  type: 'approval' | 'assignment' | 'notification' | 'condition';
  assignees?: string[];
  conditions?: {
    field: string;
    operator: string;
    value: string;
  }[];
  nextStep?: string;
  timeout?: number;
}

// Form Comment DTOs
export interface CreateFormCommentDTO {
  submissionId: string;
  content: string;
  mentions?: string[];
}

export interface FormCommentDTO {
  id: string;
  submissionId: string;
  author: string;
  authorName: string;
  content: string;
  mentions: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Form Analytics DTOs
export interface FormAnalyticsDTO {
  formTemplateId: string;
  formName: string;
  totalSubmissions: number;
  approvedCount: number;
  rejectedCount: number;
  draftCount: number;
  averageCompletionTime: number;
  submissionTrend: {
    date: Date;
    count: number;
  }[];
  fieldAnalytics: {
    fieldName: string;
    completionRate: number;
    commonValues?: string[];
  }[];
}
