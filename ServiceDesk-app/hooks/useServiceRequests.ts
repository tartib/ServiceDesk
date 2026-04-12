import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

export enum ServiceRequestStatus {
  SUBMITTED = 'submitted',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  FULFILLED = 'fulfilled',
  CANCELLED = 'cancelled',
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ServiceRequest {
  _id: string;
  request_id: string;
  service_id: string;
  service_name: string;
  status: ServiceRequestStatus;
  priority: Priority;
  requester: {
    id: string;
    name: string;
    email: string;
    department: string;
  };
  form_data: Record<string, unknown>;
  approval_status: {
    current_step: number;
    total_steps: number;
    approvals: Array<{
      step: number;
      approver_id: string;
      approver_name: string;
      status: string;
      decision_at?: string;
      comments?: string;
    }>;
  };
  assigned_to?: {
    technician_id: string;
    name: string;
    email: string;
  };
  sla: {
    sla_id: string;
    response_due: string;
    resolution_due: string;
    breach_flag: boolean;
  };
  fulfillment?: {
    fulfilled_by?: string;
    fulfilled_by_name?: string;
    fulfilled_at?: string;
    notes?: string;
  };
  timeline: Array<{
    event: string;
    by: string;
    by_name?: string;
    time: string;
    details?: Record<string, unknown>;
  }>;
  created_at: string;
  updated_at: string;
  closed_at?: string;
}

export interface ServiceRequestStats {
  total: number;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  pending_approval: number;
  breached_sla: number;
  recent_requests: ServiceRequest[];
}

export interface CreateServiceRequestDTO {
  service_id: string;
  service_name: string;
  priority?: Priority;
  requester: {
    id: string;
    name: string;
    email: string;
    department: string;
  };
  form_data?: Record<string, unknown>;
  site_id: string;
}

export interface ServiceRequestFilters {
  page?: number;
  limit?: number;
  status?: ServiceRequestStatus;
  priority?: Priority;
  service_id?: string;
  requester_id?: string;
  assigned_to?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

const ITSM_BASE = '/api/v2/itsm';

export const requestKeys = {
  all: ['service-requests'] as const,
  lists: () => [...requestKeys.all, 'list'] as const,
  list: (filters: ServiceRequestFilters) => [...requestKeys.lists(), filters] as const,
  details: () => [...requestKeys.all, 'detail'] as const,
  detail: (id: string) => [...requestKeys.details(), id] as const,
  stats: () => [...requestKeys.all, 'stats'] as const,
  myRequests: (userId: string) => [...requestKeys.all, 'my', userId] as const,
};

export function useServiceRequests(filters: ServiceRequestFilters = {}) {
  return useQuery({
    queryKey: requestKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
      const response = await api.get(`${ITSM_BASE}/service-requests?${params.toString()}`) as {
        data?: ServiceRequest[];
        pagination?: { total: number; pages: number; page: number };
      };
      return response;
    },
  });
}

export function useServiceRequest(id: string) {
  return useQuery({
    queryKey: requestKeys.detail(id),
    queryFn: async () => {
      const response = await api.get(`${ITSM_BASE}/service-requests/${id}`) as { data?: ServiceRequest };
      return (response.data || response) as ServiceRequest;
    },
    enabled: !!id,
  });
}

export function useServiceRequestStats() {
  return useQuery({
    queryKey: requestKeys.stats(),
    queryFn: async () => {
      const response = await api.get(`${ITSM_BASE}/service-requests/stats`) as { data?: ServiceRequestStats };
      return (response.data || response) as ServiceRequestStats;
    },
  });
}

export function useMyServiceRequests(userId: string, filters: { page?: number; limit?: number; status?: ServiceRequestStatus } = {}) {
  return useQuery({
    queryKey: requestKeys.myRequests(userId),
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
      const response = await api.get(`${ITSM_BASE}/service-requests/my/${userId}?${params.toString()}`) as {
        data?: ServiceRequest[];
        pagination?: { total: number; pages: number; page: number };
      };
      return response;
    },
    enabled: !!userId,
  });
}

export function useCreateServiceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateServiceRequestDTO) => {
      const response = await api.post(`${ITSM_BASE}/service-requests`, data) as { data?: ServiceRequest };
      return (response.data || response) as ServiceRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: requestKeys.stats() });
    },
  });
}

export function useUpdateServiceRequestStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, notes, user_id, user_name }: {
      id: string;
      status: ServiceRequestStatus;
      notes?: string;
      user_id?: string;
      user_name?: string;
    }) => {
      const response = await api.post(`${ITSM_BASE}/service-requests/${id}/status`, {
        status,
        notes,
        user_id,
        user_name,
      }) as { data?: ServiceRequest };
      return (response.data || response) as ServiceRequest;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: requestKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: requestKeys.stats() });
    },
  });
}

export function useApproveServiceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, decision, approver_id, approver_name, comments }: {
      id: string;
      decision: 'approve' | 'reject';
      approver_id: string;
      approver_name: string;
      comments?: string;
    }) => {
      const response = await api.post(`${ITSM_BASE}/service-requests/${id}/approve`, {
        decision,
        approver_id,
        approver_name,
        comments,
      }) as { data?: ServiceRequest };
      return (response.data || response) as ServiceRequest;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: requestKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: requestKeys.stats() });
    },
  });
}

export function useAssignServiceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, technician_id, name, email, group_id, assigned_by, assigned_by_name }: {
      id: string;
      technician_id: string;
      name: string;
      email: string;
      group_id?: string;
      assigned_by?: string;
      assigned_by_name?: string;
    }) => {
      const response = await api.post(`${ITSM_BASE}/service-requests/${id}/assign`, {
        technician_id,
        name,
        email,
        group_id,
        assigned_by,
        assigned_by_name,
      }) as { data?: ServiceRequest };
      return (response.data || response) as ServiceRequest;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: requestKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: requestKeys.stats() });
    },
  });
}

export function useFulfillServiceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, fulfilled_by, fulfilled_by_name, notes }: {
      id: string;
      fulfilled_by: string;
      fulfilled_by_name: string;
      notes?: string;
    }) => {
      const response = await api.post(`${ITSM_BASE}/service-requests/${id}/fulfill`, {
        fulfilled_by,
        fulfilled_by_name,
        notes,
      }) as { data?: ServiceRequest };
      return (response.data || response) as ServiceRequest;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: requestKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: requestKeys.stats() });
    },
  });
}

// Helper functions
export function getStatusColor(status: ServiceRequestStatus): string {
  const colors: Record<ServiceRequestStatus, string> = {
    [ServiceRequestStatus.SUBMITTED]: 'bg-brand-soft text-brand',
    [ServiceRequestStatus.PENDING_APPROVAL]: 'bg-warning-soft text-warning',
    [ServiceRequestStatus.APPROVED]: 'bg-success-soft text-success',
    [ServiceRequestStatus.REJECTED]: 'bg-destructive-soft text-destructive',
    [ServiceRequestStatus.IN_PROGRESS]: 'bg-info-soft text-info',
    [ServiceRequestStatus.ON_HOLD]: 'bg-muted text-foreground',
    [ServiceRequestStatus.FULFILLED]: 'bg-success-soft text-success',
    [ServiceRequestStatus.CANCELLED]: 'bg-destructive-soft text-destructive',
  };
  return colors[status] || 'bg-muted text-foreground';
}

export function getPriorityColor(priority: Priority): string {
  const colors: Record<Priority, string> = {
    [Priority.LOW]: 'bg-muted text-foreground',
    [Priority.MEDIUM]: 'bg-brand-soft text-brand',
    [Priority.HIGH]: 'bg-warning-soft text-warning',
    [Priority.CRITICAL]: 'bg-destructive-soft text-destructive',
  };
  return colors[priority] || 'bg-muted text-foreground';
}
