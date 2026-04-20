/**
 * Forms Platform — Records API Functions
 *
 * Typed wrappers around /api/v2/forms/submissions endpoints using the
 * platform's RecordDetail read model vocabulary.
 */

import api from '@/lib/axios';
import type { SubmissionStatus } from '@/types/smart-forms';

// ── Canonical record read model (mirrors backend RecordDetail) ─────────────

export interface RecordTimelineEvent {
  eventId: string;
  type: string;
  description: string;
  description_ar?: string;
  actor?: string;
  actorName?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface RecordComment {
  commentId: string;
  text: string;
  author: string;
  authorName?: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface RecordAttachment {
  attachmentId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface RecordDetail {
  id: string;
  submissionId: string;
  formDefinitionId: string;
  formVersion: number;
  status: SubmissionStatus;
  data: Record<string, unknown>;
  assignee?: string;
  submittedBy: {
    userId: string;
    name: string;
    email: string;
    department?: string;
  };
  timeline: RecordTimelineEvent[];
  comments: RecordComment[];
  attachments: RecordAttachment[];
  signature?: {
    data: string;
    ipAddress: string;
    signedAt: string;
  };
  workflowState?: {
    currentStepId: string;
    status: string;
  };
  siteId?: string;
  createdAt: string;
  updatedAt: string;
}

// ── List params / result ───────────────────────────────────────────────────

export interface RecordListParams {
  page?: number;
  limit?: number;
  formTemplateId?: string;
  status?: SubmissionStatus;
  submittedBy?: string;
  assignedTo?: string;
  siteId?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface RecordListResult {
  records: RecordDetail[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── API functions ──────────────────────────────────────────────────────────

interface RawListResponse {
  submissions?: unknown[];
  data?: unknown[];
  total?: number;
  page?: number;
  limit?: number;
  total_pages?: number;
}

interface RawDetailResponse {
  data?: unknown;
  submission?: unknown;
}

function normalizeRecord(raw: unknown): RecordDetail {
  const r = raw as Record<string, unknown>;
  return {
    id: ((r.id ?? r._id ?? '') as string).toString(),
    submissionId: (r.submissionId ?? r.submission_id ?? '') as string,
    formDefinitionId: (r.formDefinitionId ?? r.form_template_id ?? '') as string,
    formVersion: (r.formVersion ?? r.form_version ?? 1) as number,
    status: (r.status ?? (r.workflow_state as Record<string, unknown>)?.status) as SubmissionStatus,
    data: (r.data ?? {}) as Record<string, unknown>,
    assignee: r.assignee as string | undefined,
    submittedBy: (r.submittedBy ?? r.submitted_by ?? {}) as RecordDetail['submittedBy'],
    timeline: (r.timeline ?? []) as RecordTimelineEvent[],
    comments: (r.comments ?? []) as RecordComment[],
    attachments: (r.attachments ?? []) as RecordAttachment[],
    signature: r.signature as RecordDetail['signature'],
    workflowState: (r.workflowState ?? r.workflow_state) as RecordDetail['workflowState'],
    siteId: r.siteId as string | undefined,
    createdAt: (r.createdAt ?? r.created_at ?? '') as string,
    updatedAt: (r.updatedAt ?? r.updated_at ?? '') as string,
  };
}

export const recordApi = {
  /** List records with optional filters */
  list: async (params?: RecordListParams): Promise<RecordListResult> => {
    const raw = await api.get<RawListResponse>('/forms/submissions', { params });
    const items = raw?.submissions ?? raw?.data ?? [];
    return {
      records: (items as unknown[]).map(normalizeRecord),
      total: raw?.total ?? (items as unknown[]).length,
      page: raw?.page ?? 1,
      limit: raw?.limit ?? 20,
      totalPages: raw?.total_pages ?? 1,
    };
  },

  /** Get a single record by ID */
  get: async (id: string): Promise<RecordDetail> => {
    const raw = await api.get<RawDetailResponse>(`/forms/submissions/${id}`);
    return normalizeRecord(raw?.data ?? raw?.submission ?? raw);
  },

  /** Submit a new record */
  create: async (payload: {
    formTemplateId: string;
    data: Record<string, unknown>;
    isDraft?: boolean;
    siteId?: string;
  }): Promise<RecordDetail> => {
    const raw = await api.post<RawDetailResponse>('/forms/submissions', {
      form_template_id: payload.formTemplateId,
      data: payload.data,
      is_draft: payload.isDraft ?? false,
      site_id: payload.siteId,
    });
    return normalizeRecord(raw?.data ?? raw?.submission ?? raw);
  },

  /** Approve a record */
  approve: async (id: string, approverId: string, comment?: string): Promise<RecordDetail> => {
    const raw = await api.post<RawDetailResponse>(`/forms/submissions/${id}/approve`, {
      approverId,
      comment,
    });
    return normalizeRecord(raw?.data ?? raw?.submission ?? raw);
  },

  /** Reject a record */
  reject: async (id: string, approverId: string, reason: string): Promise<RecordDetail> => {
    const raw = await api.post<RawDetailResponse>(`/forms/submissions/${id}/reject`, {
      approverId,
      comments: reason,
    });
    return normalizeRecord(raw?.data ?? raw?.submission ?? raw);
  },

  /** Add a comment to a record */
  addComment: async (id: string, text: string, isPrivate = false): Promise<RecordDetail> => {
    const raw = await api.post<RawDetailResponse>(`/forms/submissions/${id}/comments`, {
      content: text,
      is_internal: isPrivate,
    });
    return normalizeRecord(raw?.data ?? raw?.submission ?? raw);
  },

  /** Cancel a record */
  cancel: async (id: string, reason?: string): Promise<RecordDetail> => {
    const raw = await api.post<RawDetailResponse>(`/forms/submissions/${id}/cancel`, { reason });
    return normalizeRecord(raw?.data ?? raw?.submission ?? raw);
  },

  /** My records (submitted by current user) */
  mine: async (): Promise<RecordDetail[]> => {
    const raw = await api.get<RawListResponse>('/forms/submissions/my');
    const items = raw?.submissions ?? raw?.data ?? [];
    return (items as unknown[]).map(normalizeRecord);
  },

  /** Pending approvals for current user */
  pendingApprovals: async (): Promise<RecordDetail[]> => {
    const raw = await api.get<RawListResponse>('/forms/submissions/pending-approval');
    const items = raw?.submissions ?? raw?.data ?? [];
    return (items as unknown[]).map(normalizeRecord);
  },
};
