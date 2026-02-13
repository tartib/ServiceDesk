import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { InventoryItem, InventoryFormData, ApiResponse } from '@/types';

export interface InventoryFormDataWithImage extends InventoryFormData {
  imageFile?: File;
}

export const useInventory = () => {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const response = await api.get('/inventory') as { data?: { items?: InventoryItem[] }; items?: InventoryItem[] } | InventoryItem[];
      // Handle nested structure: response.data.items
      if (!Array.isArray(response) && response.data?.items && Array.isArray(response.data.items)) {
        // Transform _id to id for frontend compatibility
        return response.data.items.map((item: InventoryItem & { _id?: string }) => ({
          ...item,
          id: item._id || item.id,
        }));
      }
      if (Array.isArray(response)) return response;
      return response.data?.items || [];
    },
  });
};

export const useLowStockItems = () => {
  return useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: async () => {
      const response = await api.get('/inventory/low-stock') as { data?: { items?: InventoryItem[] }; items?: InventoryItem[] } | InventoryItem[];
      // Handle nested structure: response.data.items
      if (!Array.isArray(response) && response.data?.items && Array.isArray(response.data.items)) {
        // Transform _id to id for frontend compatibility
        return response.data.items.map((item: InventoryItem & { _id?: string }) => ({
          ...item,
          id: item._id || item.id,
        }));
      }
      if (Array.isArray(response)) return response;
      return response.data?.items || [];
    },
  });
};

export const useInventoryItem = (itemId: string) => {
  return useQuery({
    queryKey: ['inventory', itemId],
    queryFn: async () => {
      const response = await api.get(`/v1/inventory/${itemId}`);
      console.log('🔍 Inventory Item API Response:', response);
      // Handle nested structure: response.data.item or response.item
      const responseData = response as { data?: { item?: InventoryItem; data?: InventoryItem }; item?: InventoryItem };
      const item = (responseData.data?.item || responseData.item || responseData.data?.data || responseData.data || responseData) as InventoryItem & { _id?: string };
      console.log('🔍 Inventory Item:', item);
      // Transform _id to id for frontend compatibility
      if (item && typeof item === 'object') {
        return {
          ...item,
          id: item._id || item.id,
        };
      }
      return item;
    },
    enabled: !!itemId,
  });
};

export const useCreateInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InventoryFormDataWithImage) => {
      const { imageFile, ...itemData } = data;
      
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('name', itemData.name);
        if (itemData.nameAr) formData.append('nameAr', itemData.nameAr);
        formData.append('category', itemData.category);
        formData.append('unit', itemData.unit);
        formData.append('currentQuantity', String(itemData.currentQuantity));
        formData.append('minThreshold', String(itemData.minThreshold));
        formData.append('maxThreshold', String(itemData.maxThreshold));
        if (itemData.supplier) formData.append('supplier', itemData.supplier);
        if (itemData.cost !== undefined) formData.append('cost', String(itemData.cost));
        
        const res = await api.post('/inventory', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res as ApiResponse<InventoryItem>;
      }
      
      const res = await api.post('/inventory', itemData);
      return res as ApiResponse<InventoryItem>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};

export const useUpdateInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, data }: { itemId: string; data: Partial<InventoryFormDataWithImage> }) => {
      const { imageFile, ...itemData } = data;
      
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        if (itemData.name) formData.append('name', itemData.name);
        if (itemData.nameAr) formData.append('nameAr', itemData.nameAr);
        if (itemData.category) formData.append('category', itemData.category);
        if (itemData.unit) formData.append('unit', itemData.unit);
        if (itemData.currentQuantity !== undefined) formData.append('currentQuantity', String(itemData.currentQuantity));
        if (itemData.minThreshold !== undefined) formData.append('minThreshold', String(itemData.minThreshold));
        if (itemData.maxThreshold !== undefined) formData.append('maxThreshold', String(itemData.maxThreshold));
        if (itemData.supplier) formData.append('supplier', itemData.supplier);
        if (itemData.cost !== undefined) formData.append('cost', String(itemData.cost));
        
        const res = await api.patch(`/v1/inventory/${itemId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res as ApiResponse<InventoryItem>;
      }
      
      const res = await api.patch(`/v1/inventory/${itemId}`, itemData);
      return res as ApiResponse<InventoryItem>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};

export const useRestockInventory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const response = await api.patch(`/v1/inventory/${itemId}/restock`, { quantity });
      return response as ApiResponse<InventoryItem>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};

export const useAdjustStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      itemId, 
      quantity, 
      movementType, 
      reason, 
      notes 
    }: { 
      itemId: string; 
      quantity: number; 
      movementType: string; 
      reason?: string; 
      notes?: string;
    }) => {
      const response = await api.patch(
        `/v1/inventory/${itemId}/adjust`, 
        { quantity, movementType, reason, notes }
      );
      return response as ApiResponse<InventoryItem>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};

export const useStockHistory = (itemId: string) => {
  return useQuery({
    queryKey: ['inventory', itemId, 'history'],
    queryFn: async () => {
      const response = await api.get(`/v1/inventory/${itemId}/history`) as { data?: { history?: unknown[] }; history?: unknown[] } | unknown[];
      if (!Array.isArray(response) && response.data?.history && Array.isArray(response.data.history)) {
        return response.data.history;
      }
      if (Array.isArray(response)) return response;
      return response.data?.history || [];
    },
    enabled: !!itemId,
  });
};
