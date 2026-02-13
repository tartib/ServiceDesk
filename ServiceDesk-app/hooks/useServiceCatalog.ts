import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

export interface IServiceCatalogItem {
  _id: string;
  service_id: string;
  category: string;
  name: string;
  name_ar?: string;
  description: string;
  description_ar?: string;
  icon?: string;
  image?: string;
  form: Array<{
    field_id: string;
    label: string;
    label_ar?: string;
    type: string;
    required: boolean;
    placeholder?: string;
    default_value?: unknown;
    options?: Array<{ value: string; label: string; label_ar?: string }>;
    order: number;
  }>;
  workflow: {
    approval_chain: Array<{
      step: number;
      approver_type: string;
      approver_id: string;
      approver_name: string;
      is_optional: boolean;
      auto_approve_after_hours?: number;
    }>;
    auto_assign_group?: string;
    auto_assign_user?: string;
    sla_id: string;
    notification_template?: string;
  };
  fulfillment: {
    type: string;
    automation_script?: string;
    estimated_hours: number;
  };
  pricing?: {
    cost: number;
    currency: string;
    billing_type: 'one_time' | 'recurring' | 'free';
  };
  availability: {
    is_active: boolean;
    available_to: string[];
    blackout_dates?: string[];
    requires_approval: boolean;
  };
  metrics: {
    total_requests: number;
    avg_fulfillment_hours: number;
    satisfaction_score: number;
  };
  tags?: string[];
  order: number;
  site_id?: string;
  created_at: string;
  updated_at: string;
}

export interface IServiceCatalogStats {
  total: number;
  active: number;
  inactive: number;
  byCategory: Record<string, number>;
}

const SERVICE_CATALOG_KEY = 'service-catalog';

export const useServiceCatalog = (filters?: {
  category?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}) => {
  const params = new URLSearchParams();
  if (filters?.category) params.append('category', filters.category);
  if (filters?.is_active !== undefined) params.append('is_active', String(filters.is_active));
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));

  return useQuery({
    queryKey: [SERVICE_CATALOG_KEY, 'list', filters],
    queryFn: async () => {
      const response = await api.get<{
        success: boolean;
        data: IServiceCatalogItem[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`/service-catalog?${params.toString()}`);
      return response;
    },
  });
};

export const useServiceCatalogItem = (serviceId: string) => {
  return useQuery({
    queryKey: [SERVICE_CATALOG_KEY, serviceId],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: { service: IServiceCatalogItem } }>(`/service-catalog/${serviceId}`);
      return response.data.service;
    },
    enabled: !!serviceId,
  });
};

export const useServiceCatalogStats = () => {
  return useQuery({
    queryKey: [SERVICE_CATALOG_KEY, 'stats'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: IServiceCatalogStats }>('/service-catalog/stats');
      return response.data;
    },
  });
};

export const useCreateServiceCatalogItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<IServiceCatalogItem>) => {
      return api.post<{ success: boolean; data: { service: IServiceCatalogItem } }>('/service-catalog', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SERVICE_CATALOG_KEY] });
    },
  });
};

export const useUpdateServiceCatalogItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<IServiceCatalogItem> }) => {
      return api.patch<{ success: boolean; data: { service: IServiceCatalogItem } }>(`/service-catalog/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SERVICE_CATALOG_KEY] });
    },
  });
};

export const useDeleteServiceCatalogItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return api.delete<{ success: boolean }>(`/service-catalog/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SERVICE_CATALOG_KEY] });
    },
  });
};
