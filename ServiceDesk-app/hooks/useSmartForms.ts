/**
 * Smart Forms Hooks - خطافات النماذج الذكية
 * React Query hooks for Smart Forms API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FormTemplate,
  FormSubmission,
  CreateFormTemplateDTO,
  UpdateFormTemplateDTO,
  FormTemplateListParams,
  FormTemplateListResponse,
  FormTemplateResponse,
  ValidationResult,
  SmartField,
  WorkflowConfig,
} from '@/types/smart-forms';

// ============================================
// API BASE URL
// ============================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const FORMS_API = `${API_BASE}/api/v2/forms`;

// ============================================
// API HELPERS
// ============================================

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('accessToken')) : null;
  
  const response = await fetch(`${FORMS_API}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'API request failed');
  }

  return response.json();
}

// ============================================
// QUERY KEYS
// ============================================

export const formTemplateKeys = {
  all: ['formTemplates'] as const,
  lists: () => [...formTemplateKeys.all, 'list'] as const,
  list: (params: FormTemplateListParams) => [...formTemplateKeys.lists(), params] as const,
  details: () => [...formTemplateKeys.all, 'detail'] as const,
  detail: (id: string) => [...formTemplateKeys.details(), id] as const,
  published: () => [...formTemplateKeys.all, 'published'] as const,
  categories: () => [...formTemplateKeys.all, 'categories'] as const,
};

export const formSubmissionKeys = {
  all: ['formSubmissions'] as const,
  lists: () => [...formSubmissionKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...formSubmissionKeys.lists(), params] as const,
  details: () => [...formSubmissionKeys.all, 'detail'] as const,
  detail: (id: string) => [...formSubmissionKeys.details(), id] as const,
  mySubmissions: () => [...formSubmissionKeys.all, 'my'] as const,
  pendingApproval: () => [...formSubmissionKeys.all, 'pending'] as const,
};

// ============================================
// FORM TEMPLATE HOOKS
// ============================================

/**
 * الحصول على قائمة قوالب النماذج
 */
export function useFormTemplates(params: FormTemplateListParams = {}) {
  return useQuery({
    queryKey: formTemplateKeys.list(params),
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set('page', String(params.page));
      if (params.limit) searchParams.set('limit', String(params.limit));
      if (params.category) searchParams.set('category', params.category);
      if (params.is_published !== undefined) searchParams.set('is_published', String(params.is_published));
      if (params.search) searchParams.set('search', params.search);
      if (params.sort_by) searchParams.set('sort_by', params.sort_by);
      if (params.sort_order) searchParams.set('sort_order', params.sort_order);
      
      return fetchApi<FormTemplateListResponse>(`/templates?${searchParams.toString()}`);
    },
  });
}

/**
 * الحصول على قالب نموذج واحد
 */
export function useFormTemplate(formId: string, enabled = true) {
  return useQuery({
    queryKey: formTemplateKeys.detail(formId),
    queryFn: () => fetchApi<FormTemplateResponse>(`/templates/${formId}`),
    enabled: enabled && !!formId,
    select: (data) => data.data,
  });
}

/**
 * الحصول على قوالب النماذج المنشورة
 */
export function usePublishedTemplates() {
  return useQuery({
    queryKey: formTemplateKeys.published(),
    queryFn: () => fetchApi<{ success: boolean; data: FormTemplate[] }>('/templates/published'),
    select: (data) => data.data,
  });
}

/**
 * الحصول على التصنيفات المتاحة
 */
export function useFormCategories() {
  return useQuery({
    queryKey: formTemplateKeys.categories(),
    queryFn: () => fetchApi<{ success: boolean; data: string[] }>('/templates/categories'),
    select: (data) => data.data,
  });
}

/**
 * إنشاء قالب نموذج جديد
 */
export function useCreateFormTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFormTemplateDTO) =>
      fetchApi<FormTemplateResponse>('/templates', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formTemplateKeys.lists() });
    },
  });
}

/**
 * تحديث قالب نموذج
 */
export function useUpdateFormTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ formId, data }: { formId: string; data: UpdateFormTemplateDTO }) =>
      fetchApi<FormTemplateResponse>(`/templates/${formId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: formTemplateKeys.detail(variables.formId) });
      queryClient.invalidateQueries({ queryKey: formTemplateKeys.lists() });
    },
  });
}

/**
 * حذف قالب نموذج
 */
export function useDeleteFormTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formId: string) =>
      fetchApi<{ success: boolean; message: string }>(`/templates/${formId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formTemplateKeys.lists() });
    },
  });
}

/**
 * نشر قالب نموذج
 */
export function usePublishFormTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formId: string) =>
      fetchApi<FormTemplateResponse>(`/templates/${formId}/publish`, {
        method: 'POST',
      }),
    onSuccess: (_, formId) => {
      queryClient.invalidateQueries({ queryKey: formTemplateKeys.detail(formId) });
      queryClient.invalidateQueries({ queryKey: formTemplateKeys.lists() });
      queryClient.invalidateQueries({ queryKey: formTemplateKeys.published() });
    },
  });
}

/**
 * إلغاء نشر قالب نموذج
 */
export function useUnpublishFormTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formId: string) =>
      fetchApi<FormTemplateResponse>(`/templates/${formId}/unpublish`, {
        method: 'POST',
      }),
    onSuccess: (_, formId) => {
      queryClient.invalidateQueries({ queryKey: formTemplateKeys.detail(formId) });
      queryClient.invalidateQueries({ queryKey: formTemplateKeys.lists() });
      queryClient.invalidateQueries({ queryKey: formTemplateKeys.published() });
    },
  });
}

/**
 * نسخ قالب نموذج
 */
export function useCloneFormTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ formId, name, name_ar }: { formId: string; name: string; name_ar: string }) =>
      fetchApi<FormTemplateResponse>(`/templates/${formId}/clone`, {
        method: 'POST',
        body: JSON.stringify({ name, name_ar }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formTemplateKeys.lists() });
    },
  });
}

/**
 * إنشاء نسخة جديدة من قالب
 */
export function useCreateNewVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formId: string) =>
      fetchApi<FormTemplateResponse>(`/templates/${formId}/new-version`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formTemplateKeys.lists() });
    },
  });
}

/**
 * التحقق من صحة قالب النموذج
 */
export function useValidateFormTemplate() {
  return useMutation({
    mutationFn: (formId: string) =>
      fetchApi<{ success: boolean; data: ValidationResult }>(`/templates/${formId}/validate`, {
        method: 'POST',
      }),
  });
}

// ============================================
// FIELD MANAGEMENT HOOKS
// ============================================

/**
 * إضافة حقل إلى القالب
 */
export function useAddField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ formId, field }: { formId: string; field: SmartField }) =>
      fetchApi<FormTemplateResponse>(`/templates/${formId}/fields`, {
        method: 'POST',
        body: JSON.stringify(field),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: formTemplateKeys.detail(variables.formId) });
    },
  });
}

/**
 * تحديث حقل في القالب
 */
export function useUpdateField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      formId,
      fieldId,
      data,
    }: {
      formId: string;
      fieldId: string;
      data: Partial<SmartField>;
    }) =>
      fetchApi<FormTemplateResponse>(`/templates/${formId}/fields/${fieldId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: formTemplateKeys.detail(variables.formId) });
    },
  });
}

/**
 * حذف حقل من القالب
 */
export function useRemoveField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ formId, fieldId }: { formId: string; fieldId: string }) =>
      fetchApi<FormTemplateResponse>(`/templates/${formId}/fields/${fieldId}`, {
        method: 'DELETE',
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: formTemplateKeys.detail(variables.formId) });
    },
  });
}

/**
 * إعادة ترتيب الحقول
 */
export function useReorderFields() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      formId,
      fieldOrders,
    }: {
      formId: string;
      fieldOrders: { field_id: string; order: number }[];
    }) =>
      fetchApi<FormTemplateResponse>(`/templates/${formId}/fields/reorder`, {
        method: 'PUT',
        body: JSON.stringify({ field_orders: fieldOrders }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: formTemplateKeys.detail(variables.formId) });
    },
  });
}

// ============================================
// WORKFLOW & APPROVAL HOOKS
// ============================================

/**
 * تحديث سير العمل
 */
export function useUpdateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ formId, workflow }: { formId: string; workflow: WorkflowConfig }) =>
      fetchApi<FormTemplateResponse>(`/templates/${formId}/workflow`, {
        method: 'PUT',
        body: JSON.stringify(workflow),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: formTemplateKeys.detail(variables.formId) });
    },
  });
}

// ============================================
// FORM SUBMISSION HOOKS
// ============================================

/**
 * الحصول على قائمة التقديمات
 */
export function useFormSubmissions(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: formSubmissionKeys.list(params),
    queryFn: () => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value));
        }
      });
      
      return fetchApi<{ success: boolean; data: FormSubmission[]; pagination: unknown }>(
        `/submissions?${searchParams.toString()}`
      );
    },
  });
}

/**
 * الحصول على تقديم واحد
 */
export function useFormSubmission(submissionId: string, enabled = true) {
  return useQuery({
    queryKey: formSubmissionKeys.detail(submissionId),
    queryFn: () =>
      fetchApi<{ success: boolean; data: FormSubmission }>(`/submissions/${submissionId}`),
    enabled: enabled && !!submissionId,
    select: (data) => data.data,
  });
}

/**
 * إنشاء تقديم جديد
 */
export function useCreateSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      form_template_id: string;
      data: Record<string, unknown>;
      is_draft?: boolean;
    }) =>
      fetchApi<{ success: boolean; data: FormSubmission }>('/submissions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formSubmissionKeys.lists() });
    },
  });
}

/**
 * تحديث تقديم
 */
export function useUpdateSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      submissionId,
      data,
    }: {
      submissionId: string;
      data: Record<string, unknown>;
    }) =>
      fetchApi<{ success: boolean; data: FormSubmission }>(`/submissions/${submissionId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: formSubmissionKeys.detail(variables.submissionId) });
      queryClient.invalidateQueries({ queryKey: formSubmissionKeys.lists() });
    },
  });
}

/**
 * تقديم النموذج
 */
export function useSubmitForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (submissionId: string) =>
      fetchApi<{ success: boolean; data: FormSubmission }>(`/submissions/${submissionId}/submit`, {
        method: 'POST',
      }),
    onSuccess: (_, submissionId) => {
      queryClient.invalidateQueries({ queryKey: formSubmissionKeys.detail(submissionId) });
      queryClient.invalidateQueries({ queryKey: formSubmissionKeys.lists() });
    },
  });
}

/**
 * تنفيذ إجراء في سير العمل
 */
export function useExecuteWorkflowAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      submissionId,
      actionId,
      comments,
      signature,
    }: {
      submissionId: string;
      actionId: string;
      comments?: string;
      signature?: string;
    }) =>
      fetchApi<{ success: boolean; data: FormSubmission }>(
        `/submissions/${submissionId}/workflow/action`,
        {
          method: 'POST',
          body: JSON.stringify({ action_id: actionId, comments, signature }),
        }
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: formSubmissionKeys.detail(variables.submissionId) });
      queryClient.invalidateQueries({ queryKey: formSubmissionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: formSubmissionKeys.pendingApproval() });
    },
  });
}

/**
 * الموافقة على تقديم
 */
export function useApproveSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, comments }: { submissionId: string; comments?: string }) =>
      fetchApi<{ success: boolean; data: FormSubmission }>(`/submissions/${submissionId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ comments }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: formSubmissionKeys.detail(variables.submissionId) });
      queryClient.invalidateQueries({ queryKey: formSubmissionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: formSubmissionKeys.pendingApproval() });
    },
  });
}

/**
 * رفض تقديم
 */
export function useRejectSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, comments }: { submissionId: string; comments: string }) =>
      fetchApi<{ success: boolean; data: FormSubmission }>(`/submissions/${submissionId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ comments }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: formSubmissionKeys.detail(variables.submissionId) });
      queryClient.invalidateQueries({ queryKey: formSubmissionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: formSubmissionKeys.pendingApproval() });
    },
  });
}

/**
 * الحصول على التقديمات المعلقة للموافقة
 */
export function usePendingApprovals() {
  return useQuery({
    queryKey: formSubmissionKeys.pendingApproval(),
    queryFn: () =>
      fetchApi<{ success: boolean; data: FormSubmission[] }>('/submissions/pending-approval'),
    select: (data) => data.data,
  });
}

// ============================================
// EXPORT ALL HOOKS
// ============================================

export default {
  // Template hooks
  useFormTemplates,
  useFormTemplate,
  usePublishedTemplates,
  useFormCategories,
  useCreateFormTemplate,
  useUpdateFormTemplate,
  useDeleteFormTemplate,
  usePublishFormTemplate,
  useUnpublishFormTemplate,
  useCloneFormTemplate,
  useCreateNewVersion,
  useValidateFormTemplate,
  // Field hooks
  useAddField,
  useUpdateField,
  useRemoveField,
  useReorderFields,
  // Workflow hooks
  useUpdateWorkflow,
  // Submission hooks
  useFormSubmissions,
  useFormSubmission,
  useCreateSubmission,
  useUpdateSubmission,
  useSubmitForm,
  useExecuteWorkflowAction,
  useApproveSubmission,
  useRejectSubmission,
  usePendingApprovals,
};
