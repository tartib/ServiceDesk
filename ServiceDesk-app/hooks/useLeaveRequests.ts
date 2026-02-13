import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

export type LeaveType = 'vacation' | 'wfh' | 'sick' | 'holiday' | 'blackout';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  _id: string;
  userId: {
    _id: string;
    name?: string;
    email?: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      avatar?: string;
    };
  };
  teamId: string | { _id: string; name?: string; name_ar?: string };
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
  status: LeaveStatus;
  reviewedBy?: {
    _id: string;
    name?: string;
    email?: string;
    profile?: { firstName?: string; lastName?: string };
  };
  reviewedAt?: string;
  reviewNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeaveRequestDTO {
  teamId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface UpdateLeaveRequestDTO {
  type?: LeaveType;
  startDate?: string;
  endDate?: string;
  reason?: string;
}

export const leaveRequestKeys = {
  all: ['leaveRequests'] as const,
  lists: () => [...leaveRequestKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...leaveRequestKeys.lists(), filters] as const,
  my: () => [...leaveRequestKeys.all, 'my'] as const,
  myList: (filters: Record<string, unknown>) => [...leaveRequestKeys.my(), filters] as const,
};

export function useLeaveRequests(filters?: {
  teamId?: string;
  startDate?: string;
  endDate?: string;
  type?: LeaveType;
  status?: LeaveStatus;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: leaveRequestKeys.list(filters || {}),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.teamId) params.append('teamId', filters.teamId);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));

      const response = await api.get(`/leave-requests?${params.toString()}`) as {
        data?: {
          requests: LeaveRequest[];
          pagination: { page: number; limit: number; total: number; pages: number };
        };
      };
      return {
        requests: response.data?.requests || [],
        pagination: response.data?.pagination,
      };
    },
    enabled: !!filters?.teamId,
  });
}

export function useMyLeaveRequests(filters?: { status?: LeaveStatus; page?: number; limit?: number }) {
  return useQuery({
    queryKey: leaveRequestKeys.myList(filters || {}),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));

      const response = await api.get(`/leave-requests/my?${params.toString()}`) as {
        data?: {
          requests: LeaveRequest[];
          pagination: { page: number; limit: number; total: number; pages: number };
        };
      };
      return {
        requests: response.data?.requests || [],
        pagination: response.data?.pagination,
      };
    },
  });
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateLeaveRequestDTO) => {
      const response = await api.post('/leave-requests', data) as {
        data?: { request: LeaveRequest };
      };
      return (response.data?.request || response) as LeaveRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveRequestKeys.all });
    },
  });
}

export function useUpdateLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateLeaveRequestDTO }) => {
      const response = await api.put(`/leave-requests/${id}`, data) as {
        data?: { request: LeaveRequest };
      };
      return (response.data?.request || response) as LeaveRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveRequestKeys.all });
    },
  });
}

export function useDeleteLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/leave-requests/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveRequestKeys.all });
    },
  });
}

export function useApproveLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/leave-requests/${id}/approve`) as {
        data?: { request: LeaveRequest };
      };
      return (response.data?.request || response) as LeaveRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveRequestKeys.all });
    },
  });
}

export function useRejectLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reviewNote }: { id: string; reviewNote?: string }) => {
      const response = await api.patch(`/leave-requests/${id}/reject`, { reviewNote }) as {
        data?: { request: LeaveRequest };
      };
      return (response.data?.request || response) as LeaveRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveRequestKeys.all });
    },
  });
}
