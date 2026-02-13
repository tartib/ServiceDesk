import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { 
  DashboardData, 
  DashboardKPIs, 
  TeamPerformance, 
  CriticalAlert, 
  ApiResponse 
} from '@/types';

interface DashboardParams {
  dateFrom?: string;
  dateTo?: string;
}

export const useDashboard = (params?: DashboardParams) => {
  return useQuery({
    queryKey: ['dashboard', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
      
      const url = `/dashboard${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response: ApiResponse<DashboardData> = await api.get(url);
      return response.data;
    },
  });
};

export const useDashboardKPIs = (params?: DashboardParams) => {
  return useQuery({
    queryKey: ['dashboard', 'kpis', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
      
      const url = `/dashboard/kpis${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response: ApiResponse<DashboardKPIs> = await api.get(url);
      return response.data;
    },
  });
};

export const useTeamPerformance = () => {
  return useQuery({
    queryKey: ['dashboard', 'team-performance'],
    queryFn: async () => {
      const response: ApiResponse<TeamPerformance> = await api.get('/dashboard/team-performance');
      return response.data;
    },
  });
};

export const useCriticalAlerts = () => {
  return useQuery({
    queryKey: ['dashboard', 'alerts'],
    queryFn: async () => {
      const response: ApiResponse<CriticalAlert[]> = await api.get('/dashboard/alerts');
      return response.data || [];
    },
  });
};
