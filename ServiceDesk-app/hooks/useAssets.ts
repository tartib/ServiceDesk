import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

export enum AssetType {
  HARDWARE = 'hardware',
  SOFTWARE = 'software',
  NETWORK = 'network',
  CLOUD = 'cloud',
  VIRTUAL = 'virtual',
  PERIPHERAL = 'peripheral',
  MOBILE = 'mobile',
  OTHER = 'other',
}

export enum AssetStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  IN_STOCK = 'in_stock',
  IN_MAINTENANCE = 'in_maintenance',
  RETIRED = 'retired',
  DISPOSED = 'disposed',
  LOST = 'lost',
  RESERVED = 'reserved',
}

export enum AssetCondition {
  NEW = 'new',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  DAMAGED = 'damaged',
}

export interface Asset {
  _id: string;
  asset_id: string;
  name: string;
  name_ar?: string;
  description?: string;
  type: AssetType;
  status: AssetStatus;
  condition: AssetCondition;
  serial_number?: string;
  barcode?: string;
  asset_model?: string;
  manufacturer?: string;
  category_id?: string;
  tags?: string[];
  location?: {
    building?: string;
    floor?: string;
    room?: string;
  };
  assigned_to?: {
    user_id?: string;
    user_name?: string;
    department?: string;
    assigned_date?: string;
  };
  purchase_info?: {
    vendor?: string;
    purchase_date?: string;
    purchase_price?: number;
    currency?: string;
  };
  warranty?: {
    end_date?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface AssetStats {
  total_assets: number;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
  by_department: Record<string, number>;
  recent_assets: Asset[];
  warranty_expiring_soon: number;
}

export interface CreateAssetDTO {
  name: string;
  name_ar?: string;
  description?: string;
  type: AssetType;
  status?: AssetStatus;
  condition?: AssetCondition;
  serial_number?: string;
  barcode?: string;
  asset_model?: string;
  manufacturer?: string;
  category_id?: string;
  tags?: string[];
  location?: {
    building?: string;
    floor?: string;
    room?: string;
  };
  purchase_info?: {
    vendor?: string;
    purchase_date?: string;
    purchase_price?: number;
    currency?: string;
  };
  warranty?: {
    start_date?: string;
    end_date?: string;
  };
}

export interface AssetsFilters {
  page?: number;
  limit?: number;
  type?: AssetType;
  status?: AssetStatus;
  category_id?: string;
  department?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

const assetKeys = {
  all: ['assets'] as const,
  lists: () => [...assetKeys.all, 'list'] as const,
  list: (filters: AssetsFilters) => [...assetKeys.lists(), filters] as const,
  details: () => [...assetKeys.all, 'detail'] as const,
  detail: (id: string) => [...assetKeys.details(), id] as const,
  stats: () => [...assetKeys.all, 'stats'] as const,
  userAssets: (userId: string) => [...assetKeys.all, 'user', userId] as const,
};

export function useAssets(filters: AssetsFilters = {}) {
  return useQuery({
    queryKey: assetKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
      const response = await api.get(`/assets?${params.toString()}`) as {
        data?: Asset[];
        pagination?: { total: number; pages: number; page: number };
      };
      return response;
    },
  });
}

export function useAsset(id: string) {
  return useQuery({
    queryKey: assetKeys.detail(id),
    queryFn: async () => {
      const response = await api.get(`/assets/${id}`) as { data?: Asset };
      return (response.data || response) as Asset;
    },
    enabled: !!id,
  });
}

export function useAssetStats() {
  return useQuery({
    queryKey: assetKeys.stats(),
    queryFn: async () => {
      const response = await api.get('/assets/stats') as { data?: AssetStats };
      return (response.data || response) as AssetStats;
    },
  });
}

export function useUserAssets(userId: string) {
  return useQuery({
    queryKey: assetKeys.userAssets(userId),
    queryFn: async () => {
      const response = await api.get(`/assets/user/${userId}`) as { data?: Asset[] };
      return (response.data || response) as Asset[];
    },
    enabled: !!userId,
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAssetDTO) => {
      const response = await api.post('/assets', data) as { data?: Asset };
      return (response.data || response) as Asset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.stats() });
    },
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateAssetDTO> }) => {
      const response = await api.put(`/assets/${id}`, data) as { data?: Asset };
      return (response.data || response) as Asset;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: assetKeys.stats() });
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/assets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.stats() });
    },
  });
}

export function useAssignAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, user_id, user_name, department }: {
      id: string;
      user_id: string;
      user_name: string;
      department?: string;
    }) => {
      const response = await api.post(`/assets/${id}/assign`, {
        user_id,
        user_name,
        department,
      }) as { data?: Asset };
      return (response.data || response) as Asset;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: assetKeys.stats() });
    },
  });
}

export function useUnassignAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/assets/${id}/unassign`) as { data?: Asset };
      return (response.data || response) as Asset;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: assetKeys.stats() });
    },
  });
}

export function useChangeAssetStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AssetStatus }) => {
      const response = await api.post(`/assets/${id}/status`, { status }) as { data?: Asset };
      return (response.data || response) as Asset;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: assetKeys.stats() });
    },
  });
}
