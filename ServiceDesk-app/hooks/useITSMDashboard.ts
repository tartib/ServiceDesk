import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import {
  ITSMDashboardData,
  IITSMIncidentKPIs,
  IITSMProblemKPIs,
  IITSMChangeKPIs,
  ISLACompliancePoint,
  IIncidentTrendPoint,
  IApiResponse,
} from '@/types/itsm';

const ITSM_BASE = '/itsm';
const DASH_KEY = 'itsm-dashboard';

export const useITSMDashboard = (siteId?: string) => {
  const params = siteId ? `?site_id=${siteId}` : '';
  return useQuery({
    queryKey: [DASH_KEY, 'summary', siteId],
    queryFn: async () => {
      const response = await api.get(`${ITSM_BASE}/itsm-dashboard${params}`) as IApiResponse<ITSMDashboardData>;
      return response.data;
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
};

export const useITSMIncidentKPIs = (siteId?: string) => {
  const params = siteId ? `?site_id=${siteId}` : '';
  return useQuery({
    queryKey: [DASH_KEY, 'incidents', siteId],
    queryFn: async () => {
      const response = await api.get(`${ITSM_BASE}/itsm-dashboard/incidents${params}`) as IApiResponse<IITSMIncidentKPIs>;
      return response.data;
    },
    staleTime: 60_000,
  });
};

export const useITSMProblemKPIs = (siteId?: string) => {
  const params = siteId ? `?site_id=${siteId}` : '';
  return useQuery({
    queryKey: [DASH_KEY, 'problems', siteId],
    queryFn: async () => {
      const response = await api.get(`${ITSM_BASE}/itsm-dashboard/problems${params}`) as IApiResponse<IITSMProblemKPIs>;
      return response.data;
    },
    staleTime: 60_000,
  });
};

export const useITSMChangeKPIs = (siteId?: string) => {
  const params = siteId ? `?site_id=${siteId}` : '';
  return useQuery({
    queryKey: [DASH_KEY, 'changes', siteId],
    queryFn: async () => {
      const response = await api.get(`${ITSM_BASE}/itsm-dashboard/changes${params}`) as IApiResponse<IITSMChangeKPIs>;
      return response.data;
    },
    staleTime: 60_000,
  });
};

export const useSLACompliance = (days = 7, siteId?: string) => {
  const params = new URLSearchParams({ days: String(days) });
  if (siteId) params.append('site_id', siteId);
  return useQuery({
    queryKey: [DASH_KEY, 'sla-compliance', days, siteId],
    queryFn: async () => {
      const response = await api.get(`${ITSM_BASE}/itsm-dashboard/sla-compliance?${params}`) as IApiResponse<ISLACompliancePoint[]>;
      return response.data;
    },
    staleTime: 120_000,
  });
};

export const useIncidentTrend = (days = 14, siteId?: string) => {
  const params = new URLSearchParams({ days: String(days) });
  if (siteId) params.append('site_id', siteId);
  return useQuery({
    queryKey: [DASH_KEY, 'incident-trend', days, siteId],
    queryFn: async () => {
      const response = await api.get(`${ITSM_BASE}/itsm-dashboard/incident-trend?${params}`) as IApiResponse<IIncidentTrendPoint[]>;
      return response.data;
    },
    staleTime: 120_000,
  });
};
