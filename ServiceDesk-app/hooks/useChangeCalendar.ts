import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import {
  IChangeCalendarEvent,
  IChangeRiskScore,
  IScheduleValidation,
  IApprovalRouting,
  ChangeCalendarEventType,
  IApiResponse,
  IApiListResponse,
} from '@/types/itsm';

const ITSM_BASE = '/api/v2/itsm';
const CAL_KEY = 'change-calendar';

export const useCalendarEvents = (filters?: {
  start_date?: string;
  end_date?: string;
  type?: ChangeCalendarEventType;
  site_id?: string;
}) => {
  const params = new URLSearchParams();
  if (filters?.start_date) params.append('start_date', filters.start_date);
  if (filters?.end_date) params.append('end_date', filters.end_date);
  if (filters?.type) params.append('type', filters.type);
  if (filters?.site_id) params.append('site_id', filters.site_id);

  return useQuery({
    queryKey: [CAL_KEY, 'list', filters],
    queryFn: async () => {
      const response = await api.get(`${ITSM_BASE}/changes/calendar?${params.toString()}`) as IApiListResponse<IChangeCalendarEvent>;
      return response;
    },
  });
};

export const useCreateCalendarEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      type: ChangeCalendarEventType;
      title: string;
      description?: string;
      start_date: string;
      end_date: string;
      site_id?: string;
    }) => {
      const response = await api.post(`${ITSM_BASE}/changes/calendar`, data) as IApiResponse<{ event: IChangeCalendarEvent }>;
      return response.data.event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CAL_KEY] });
    },
  });
};

export const useDeleteCalendarEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: string) => {
      await api.delete(`${ITSM_BASE}/changes/calendar/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CAL_KEY] });
    },
  });
};

export const useValidateSchedule = () => {
  return useMutation({
    mutationFn: async (data: {
      change_id?: string;
      planned_start: string;
      planned_end: string;
      site_id?: string;
    }) => {
      const response = await api.post(`${ITSM_BASE}/changes/validate-schedule`, data) as IApiResponse<IScheduleValidation>;
      return response.data;
    },
  });
};

export const useComputeRiskScore = () => {
  return useMutation({
    mutationFn: async (data: {
      change_id?: string;
      impact?: string;
      type?: string;
      affected_cis?: string[];
      rollback_plan?: string;
    }) => {
      const response = await api.post(`${ITSM_BASE}/changes/risk-score`, data) as IApiResponse<IChangeRiskScore>;
      return response.data;
    },
  });
};

export const useApprovalRouting = (changeId: string) => {
  return useQuery({
    queryKey: ['change-approval-routing', changeId],
    queryFn: async () => {
      const response = await api.get(`${ITSM_BASE}/changes/${changeId}/approval-routing`) as IApiResponse<IApprovalRouting>;
      return response.data;
    },
    enabled: !!changeId,
  });
};
