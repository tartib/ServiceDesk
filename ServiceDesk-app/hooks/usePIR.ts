import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { IPIR, PIRStatus, RCAMethod, IPIRFollowUpAction, IApiResponse, IApiListResponse } from '@/types/itsm';

const ITSM_BASE = '/itsm';
const PIR_KEY = 'pirs';

export const usePIRs = (filters?: { status?: PIRStatus; page?: number; limit?: number }) => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));

  return useQuery({
    queryKey: [PIR_KEY, 'list', filters],
    queryFn: async () => {
      const response = await api.get(`${ITSM_BASE}/pirs?${params.toString()}`) as IApiListResponse<IPIR>;
      return response;
    },
  });
};

export const usePIR = (pirId: string) => {
  return useQuery({
    queryKey: [PIR_KEY, pirId],
    queryFn: async () => {
      const response = await api.get(`${ITSM_BASE}/pirs/${pirId}`) as IApiResponse<{ pir: IPIR }>;
      return response.data.pir;
    },
    enabled: !!pirId,
  });
};

export const usePIRByIncident = (incidentId: string) => {
  return useQuery({
    queryKey: [PIR_KEY, 'incident', incidentId],
    queryFn: async () => {
      const response = await api.get(`${ITSM_BASE}/pirs?incident_id=${incidentId}`) as IApiListResponse<IPIR>;
      return response.data?.[0] ?? null;
    },
    enabled: !!incidentId,
  });
};

export const useCreatePIR = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      incident_id: string;
      rca_method?: RCAMethod;
      participants?: Array<{ id: string; name: string; role?: string }>;
      review_date?: string;
    }) => {
      const response = await api.post(`${ITSM_BASE}/pirs`, data) as IApiResponse<{ pir: IPIR }>;
      return response.data.pir;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PIR_KEY] });
    },
  });
};

export const useUpdatePIR = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ pirId, data }: {
      pirId: string;
      data: Partial<Pick<IPIR, 'rca_method' | 'rca_findings' | 'root_cause' | 'contributing_factors' | 'timeline_of_events' | 'impact_summary' | 'what_went_well' | 'what_went_wrong' | 'review_date'>>;
    }) => {
      const response = await api.patch(`${ITSM_BASE}/pirs/${pirId}`, data) as IApiResponse<{ pir: IPIR }>;
      return response.data.pir;
    },
    onSuccess: (_data, { pirId }) => {
      queryClient.invalidateQueries({ queryKey: [PIR_KEY, pirId] });
      queryClient.invalidateQueries({ queryKey: [PIR_KEY, 'list'] });
    },
  });
};

export const useAddFollowUpAction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ pirId, action }: {
      pirId: string;
      action: { description: string; owner_id?: string; owner_name?: string; due_date?: string };
    }) => {
      const response = await api.post(`${ITSM_BASE}/pirs/${pirId}/follow-up`, action) as IApiResponse<{ pir: IPIR }>;
      return response.data.pir;
    },
    onSuccess: (_data, { pirId }) => {
      queryClient.invalidateQueries({ queryKey: [PIR_KEY, pirId] });
    },
  });
};

export const useCompleteFollowUpAction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ pirId, actionId }: { pirId: string; actionId: string }) => {
      const response = await api.patch(`${ITSM_BASE}/pirs/${pirId}/follow-up/${actionId}/complete`) as IApiResponse<{ pir: IPIR }>;
      return response.data.pir;
    },
    onSuccess: (_data, { pirId }) => {
      queryClient.invalidateQueries({ queryKey: [PIR_KEY, pirId] });
    },
  });
};

export const useSubmitPIR = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pirId: string) => {
      const response = await api.post(`${ITSM_BASE}/pirs/${pirId}/submit`) as IApiResponse<{ pir: IPIR }>;
      return response.data.pir;
    },
    onSuccess: (_data, pirId) => {
      queryClient.invalidateQueries({ queryKey: [PIR_KEY, pirId] });
      queryClient.invalidateQueries({ queryKey: [PIR_KEY, 'list'] });
    },
  });
};

export const useCompletePIR = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pirId: string) => {
      const response = await api.post(`${ITSM_BASE}/pirs/${pirId}/complete`) as IApiResponse<{ pir: IPIR }>;
      return response.data.pir;
    },
    onSuccess: (_data, pirId) => {
      queryClient.invalidateQueries({ queryKey: [PIR_KEY, pirId] });
      queryClient.invalidateQueries({ queryKey: [PIR_KEY, 'list'] });
    },
  });
};
