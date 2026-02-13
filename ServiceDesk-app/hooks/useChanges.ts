import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import {
  IChange,
  IChangeStats,
  CreateChangeDTO,
  ChangeStatus,
  ChangeType,
  Priority,
  ApprovalStatus,
  IApiListResponse,
} from '@/types/itsm';

const CHANGES_KEY = 'changes';

// ============================================
// Query Hooks
// ============================================

export const useChanges = (filters?: {
  status?: ChangeStatus[];
  type?: ChangeType[];
  priority?: Priority[];
  requester?: string;
  owner?: string;
  site_id?: string;
  scheduled_from?: string;
  scheduled_to?: string;
  page?: number;
  limit?: number;
}) => {
  const params = new URLSearchParams();
  
  if (filters?.status?.length) params.append('status', filters.status.join(','));
  if (filters?.type?.length) params.append('type', filters.type.join(','));
  if (filters?.priority?.length) params.append('priority', filters.priority.join(','));
  if (filters?.requester) params.append('requester', filters.requester);
  if (filters?.owner) params.append('owner', filters.owner);
  if (filters?.site_id) params.append('site_id', filters.site_id);
  if (filters?.scheduled_from) params.append('scheduled_from', filters.scheduled_from);
  if (filters?.scheduled_to) params.append('scheduled_to', filters.scheduled_to);
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));

  return useQuery({
    queryKey: [CHANGES_KEY, 'list', filters],
    queryFn: async () => {
      const response = await api.get<IApiListResponse<IChange>>(
        `/changes?${params.toString()}`
      );
      return response;
    },
  });
};

export const useChange = (changeId: string) => {
  return useQuery({
    queryKey: [CHANGES_KEY, changeId],
    queryFn: async () => {
      const response = await api.get(`/changes/${changeId}`) as { data?: { change: IChange }, change?: IChange };
      // Handle both response formats: { data: { change } } or { change }
      const change = response.data?.change || response.change;
      if (!change) {
        throw new Error('Change not found');
      }
      return change;
    },
    enabled: !!changeId,
  });
};

export const useChangeStats = (siteId?: string) => {
  return useQuery({
    queryKey: [CHANGES_KEY, 'stats', siteId],
    queryFn: async () => {
      const params = siteId ? `?site_id=${siteId}` : '';
      const response = await api.get<IChangeStats>(
        `/changes/stats${params}`
      );
      return response;
    },
  });
};

export const usePendingCabApproval = () => {
  return useQuery({
    queryKey: [CHANGES_KEY, 'pending-cab'],
    queryFn: async () => {
      const response = await api.get<IChange[]>('/changes/pending-cab');
      return response;
    },
  });
};

export const useScheduledChanges = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: [CHANGES_KEY, 'scheduled', startDate, endDate],
    queryFn: async () => {
      const response = await api.get<IChange[]>(
        `/changes/scheduled?start_date=${startDate}&end_date=${endDate}`
      );
      return response;
    },
    enabled: !!startDate && !!endDate,
  });
};

export const useEmergencyChanges = () => {
  return useQuery({
    queryKey: [CHANGES_KEY, 'emergency'],
    queryFn: async () => {
      const response = await api.get<IChange[]>('/changes/emergency');
      return response;
    },
  });
};

export const useMyChangeRequests = (page?: number, limit?: number) => {
  return useQuery({
    queryKey: [CHANGES_KEY, 'my-requests', page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (page) params.append('page', String(page));
      if (limit) params.append('limit', String(limit));
      const response = await api.get<IApiListResponse<IChange>>(
        `/changes/my-requests?${params.toString()}`
      );
      return response;
    },
  });
};

// ============================================
// Mutation Hooks
// ============================================

export const useCreateChange = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateChangeDTO) => {
      const response = await api.post<{ data: { change: IChange } }>(
        '/changes',
        data
      );
      return response.data.change;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CHANGES_KEY] });
    },
  });
};

export const useUpdateChange = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      changeId,
      data,
    }: {
      changeId: string;
      data: Partial<CreateChangeDTO>;
    }) => {
      const response = await api.patch<{ data: { change: IChange } }>(
        `/changes/${changeId}`,
        data
      );
      return response.data.change;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CHANGES_KEY] });
      queryClient.invalidateQueries({
        queryKey: [CHANGES_KEY, variables.changeId],
      });
    },
  });
};

export const useSubmitChangeForApproval = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (changeId: string) => {
      const response = await api.post<{ data: { change: IChange } }>(
        `/changes/${changeId}/submit`
      );
      return response.data.change;
    },
    onSuccess: (_, changeId) => {
      queryClient.invalidateQueries({ queryKey: [CHANGES_KEY] });
      queryClient.invalidateQueries({ queryKey: [CHANGES_KEY, changeId] });
    },
  });
};

export const useAddCabApproval = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      changeId,
      decision,
      comments,
      role,
    }: {
      changeId: string;
      decision: ApprovalStatus;
      comments?: string;
      role?: string;
    }) => {
      const response = await api.post<{ data: { change: IChange } }>(
        `/changes/${changeId}/cab/approve`,
        { decision, comments, role }
      );
      return response.data.change;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CHANGES_KEY] });
      queryClient.invalidateQueries({
        queryKey: [CHANGES_KEY, variables.changeId],
      });
    },
  });
};

export const useScheduleChange = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      changeId,
      schedule,
    }: {
      changeId: string;
      schedule: {
        planned_start: string;
        planned_end: string;
        maintenance_window?: string;
      };
    }) => {
      const response = await api.post<{ data: { change: IChange } }>(
        `/changes/${changeId}/schedule`,
        schedule
      );
      return response.data.change;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CHANGES_KEY] });
      queryClient.invalidateQueries({
        queryKey: [CHANGES_KEY, variables.changeId],
      });
    },
  });
};

export const useStartImplementation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (changeId: string) => {
      const response = await api.post<{ data: { change: IChange } }>(
        `/changes/${changeId}/implement`
      );
      return response.data.change;
    },
    onSuccess: (_, changeId) => {
      queryClient.invalidateQueries({ queryKey: [CHANGES_KEY] });
      queryClient.invalidateQueries({ queryKey: [CHANGES_KEY, changeId] });
    },
  });
};

export const useCompleteChange = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      changeId,
      success,
      notes,
    }: {
      changeId: string;
      success: boolean;
      notes: string;
    }) => {
      const response = await api.post<{ data: { change: IChange } }>(
        `/changes/${changeId}/complete`,
        { success, notes }
      );
      return response.data.change;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CHANGES_KEY] });
      queryClient.invalidateQueries({
        queryKey: [CHANGES_KEY, variables.changeId],
      });
    },
  });
};

export const useCancelChange = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      changeId,
      reason,
    }: {
      changeId: string;
      reason: string;
    }) => {
      const response = await api.post<{ data: { change: IChange } }>(
        `/changes/${changeId}/cancel`,
        { reason }
      );
      return response.data.change;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CHANGES_KEY] });
      queryClient.invalidateQueries({
        queryKey: [CHANGES_KEY, variables.changeId],
      });
    },
  });
};
