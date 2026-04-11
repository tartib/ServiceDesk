import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import {
  IIncident,
  IIncidentStats,
  CreateIncidentDTO,
  UpdateIncidentDTO,
  IncidentStatus,
  Priority,
  MajorIncidentSeverity,
  IMajorIncidentBridge,
  IApiResponse,
  IApiListResponse,
} from '@/types/itsm';

const ITSM_BASE = '/api/v2/itsm';
const INCIDENTS_KEY = 'incidents';

// ============================================
// Query Hooks
// ============================================

export const useIncidents = (filters?: {
  status?: IncidentStatus[];
  priority?: Priority[];
  assignee?: string;
  requester?: string;
  site_id?: string;
  category_id?: string;
  is_major?: boolean;
  breached?: boolean;
  page?: number;
  limit?: number;
}) => {
  const params = new URLSearchParams();
  
  if (filters?.status?.length) params.append('status', filters.status.join(','));
  if (filters?.priority?.length) params.append('priority', filters.priority.join(','));
  if (filters?.assignee) params.append('assignee', filters.assignee);
  if (filters?.requester) params.append('requester', filters.requester);
  if (filters?.site_id) params.append('site_id', filters.site_id);
  if (filters?.category_id) params.append('category_id', filters.category_id);
  if (filters?.is_major) params.append('is_major', 'true');
  if (filters?.breached) params.append('breached', 'true');
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));

  return useQuery({
    queryKey: [INCIDENTS_KEY, 'list', filters],
    queryFn: async () => {
      const response = await api.get(`${ITSM_BASE}/incidents?${params.toString()}`) as IApiListResponse<IIncident>;
      return response;
    },
  });
};

export const useIncident = (incidentId: string) => {
  return useQuery({
    queryKey: [INCIDENTS_KEY, incidentId],
    queryFn: async () => {
      const response = await api.get(`${ITSM_BASE}/incidents/${incidentId}`) as IApiResponse<{ incident: IIncident }>;
      return response.data.incident;
    },
    enabled: !!incidentId,
  });
};

export const useIncidentStats = (siteId?: string) => {
  return useQuery({
    queryKey: [INCIDENTS_KEY, 'stats', siteId],
    queryFn: async () => {
      const params = siteId ? `?site_id=${siteId}` : '';
      const response = await api.get(`${ITSM_BASE}/incidents/stats${params}`) as IApiResponse<IIncidentStats>;
      return response.data;
    },
  });
};

export const useOpenIncidents = () => {
  return useQuery({
    queryKey: [INCIDENTS_KEY, 'open'],
    queryFn: async () => {
      const response = await api.get(`${ITSM_BASE}/incidents/open`) as IApiResponse<IIncident[]>;
      return response.data;
    },
  });
};

export const useBreachedIncidents = () => {
  return useQuery({
    queryKey: [INCIDENTS_KEY, 'breached'],
    queryFn: async () => {
      const response = await api.get(`${ITSM_BASE}/incidents/breached`) as IApiResponse<IIncident[]>;
      return response.data;
    },
  });
};

export const useUnassignedIncidents = () => {
  return useQuery({
    queryKey: [INCIDENTS_KEY, 'unassigned'],
    queryFn: async () => {
      const response = await api.get(`${ITSM_BASE}/incidents/unassigned`) as IApiResponse<IIncident[]>;
      return response.data;
    },
  });
};

export const useMajorIncidents = () => {
  return useQuery({
    queryKey: [INCIDENTS_KEY, 'major'],
    queryFn: async () => {
      const response = await api.get(`${ITSM_BASE}/incidents/major`) as IApiResponse<IIncident[]>;
      return response.data;
    },
  });
};

export const useMyIncidentRequests = (page?: number, limit?: number) => {
  return useQuery({
    queryKey: [INCIDENTS_KEY, 'my-requests', page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (page) params.append('page', String(page));
      if (limit) params.append('limit', String(limit));
      const response = await api.get(`${ITSM_BASE}/incidents/my-requests?${params.toString()}`) as IApiListResponse<IIncident>;
      return response;
    },
  });
};

export const useMyAssignedIncidents = (page?: number, limit?: number) => {
  return useQuery({
    queryKey: [INCIDENTS_KEY, 'my-assignments', page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (page) params.append('page', String(page));
      if (limit) params.append('limit', String(limit));
      const response = await api.get(`${ITSM_BASE}/incidents/my-assignments?${params.toString()}`) as IApiListResponse<IIncident>;
      return response;
    },
  });
};

export const useSearchIncidents = (query: string) => {
  return useQuery({
    queryKey: [INCIDENTS_KEY, 'search', query],
    queryFn: async () => {
      const response = await api.get(`${ITSM_BASE}/incidents/search?q=${encodeURIComponent(query)}`) as IApiResponse<IIncident[]>;
      return response.data;
    },
    enabled: query.length >= 2,
  });
};

// ============================================
// Mutation Hooks
// ============================================

export const useCreateIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateIncidentDTO) => {
      const response = await api.post(`${ITSM_BASE}/incidents`, data) as IApiResponse<{ incident: IIncident }>;
      return response.data.incident;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INCIDENTS_KEY] });
    },
  });
};

export const useUpdateIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      incidentId,
      data,
    }: {
      incidentId: string;
      data: UpdateIncidentDTO;
    }) => {
      const response = await api.patch(`${ITSM_BASE}/incidents/${incidentId}`, data) as IApiResponse<{ incident: IIncident }>;
      return response.data.incident;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [INCIDENTS_KEY] });
      queryClient.invalidateQueries({
        queryKey: [INCIDENTS_KEY, variables.incidentId],
      });
    },
  });
};

export const useUpdateIncidentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      incidentId,
      status,
      resolution,
    }: {
      incidentId: string;
      status: IncidentStatus;
      resolution?: { code: string; notes: string };
    }) => {
      const response = await api.patch(`${ITSM_BASE}/incidents/${incidentId}/status`, { status, resolution }) as IApiResponse<{ incident: IIncident }>;
      return response.data.incident;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [INCIDENTS_KEY] });
      queryClient.invalidateQueries({
        queryKey: [INCIDENTS_KEY, variables.incidentId],
      });
    },
  });
};

export const useAssignIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      incidentId,
      assignee,
    }: {
      incidentId: string;
      assignee: {
        technician_id: string;
        name: string;
        email: string;
        group_id?: string;
        group_name?: string;
      };
    }) => {
      const response = await api.patch(`${ITSM_BASE}/incidents/${incidentId}/assign`, assignee) as IApiResponse<{ incident: IIncident }>;
      return response.data.incident;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [INCIDENTS_KEY] });
      queryClient.invalidateQueries({
        queryKey: [INCIDENTS_KEY, variables.incidentId],
      });
    },
  });
};

export const useAddWorklog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      incidentId,
      worklog,
    }: {
      incidentId: string;
      worklog: {
        minutes_spent: number;
        note: string;
        is_internal?: boolean;
      };
    }) => {
      const response = await api.post(`${ITSM_BASE}/incidents/${incidentId}/worklogs`, worklog) as IApiResponse<{ incident: IIncident }>;
      return response.data.incident;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [INCIDENTS_KEY, variables.incidentId],
      });
    },
  });
};

export const useEscalateIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      incidentId,
      reason,
    }: {
      incidentId: string;
      reason: string;
    }) => {
      const response = await api.post(`${ITSM_BASE}/incidents/${incidentId}/escalate`, { reason }) as IApiResponse<{ incident: IIncident }>;
      return response.data.incident;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [INCIDENTS_KEY] });
      queryClient.invalidateQueries({
        queryKey: [INCIDENTS_KEY, variables.incidentId],
      });
    },
  });
};

export const useLinkIncidentToProblem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      incidentId,
      problemId,
    }: {
      incidentId: string;
      problemId: string;
    }) => {
      const response = await api.post(`${ITSM_BASE}/incidents/${incidentId}/link-problem`, { problem_id: problemId }) as IApiResponse<{ incident: IIncident }>;
      return response.data.incident;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [INCIDENTS_KEY, variables.incidentId],
      });
    },
  });
};

export const useDeclareMajorIncident = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      incidentId,
      severity,
      bridge,
    }: {
      incidentId: string;
      severity: MajorIncidentSeverity;
      bridge?: Partial<IMajorIncidentBridge>;
    }) => {
      const response = await api.post(`${ITSM_BASE}/incidents/${incidentId}/declare-major`, { severity, bridge }) as IApiResponse<{ incident: IIncident }>;
      return response.data.incident;
    },
    onSuccess: (_, { incidentId }) => {
      queryClient.invalidateQueries({ queryKey: [INCIDENTS_KEY, incidentId] });
      queryClient.invalidateQueries({ queryKey: [INCIDENTS_KEY, 'major'] });
    },
  });
};

export const useAddCommsUpdate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      incidentId,
      message,
      next_update_at,
    }: {
      incidentId: string;
      message: string;
      next_update_at?: string;
    }) => {
      const response = await api.post(`${ITSM_BASE}/incidents/${incidentId}/comms-update`, { message, next_update_at }) as IApiResponse<{ incident: IIncident }>;
      return response.data.incident;
    },
    onSuccess: (_, { incidentId }) => {
      queryClient.invalidateQueries({ queryKey: [INCIDENTS_KEY, incidentId] });
    },
  });
};

export const useUpdateBridge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      incidentId,
      bridge,
    }: {
      incidentId: string;
      bridge: Partial<IMajorIncidentBridge>;
    }) => {
      const response = await api.patch(`${ITSM_BASE}/incidents/${incidentId}/bridge`, bridge) as IApiResponse<{ incident: IIncident }>;
      return response.data.incident;
    },
    onSuccess: (_, { incidentId }) => {
      queryClient.invalidateQueries({ queryKey: [INCIDENTS_KEY, incidentId] });
    },
  });
};
