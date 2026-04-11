import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Category } from '@/types';
import { normalizeList, normalizeEntity } from '@/lib/api/normalize';

interface CategoriesResponse {
  success: boolean;
  data: {
    categories: Category[];
  };
}

interface CategoryResponse {
  success: boolean;
  data: {
    category: Category & { _id?: string };
  };
}

interface CreateCategoryInput {
  name: string;
  nameAr?: string;
  description?: string;
}

interface UpdateCategoryInput {
  name?: string;
  nameAr?: string;
  description?: string;
}

// Get all categories
export function useCategories(isActiveOnly = false) {
  return useQuery<Category[]>({
    queryKey: ['categories', isActiveOnly],
    queryFn: async () => {
      const url = isActiveOnly ? '/ops/categories?isActive=true' : '/ops/categories';
      const response = await api.get(url);
      const apiResponse = response as unknown as CategoriesResponse;
      const categories = apiResponse.data?.categories || [];
      return normalizeList<Category>(categories);
    },
  });
}

// Get category by ID
export function useCategory(id: string) {
  return useQuery<Category>({
    queryKey: ['categories', id],
    queryFn: async () => {
      const response = await api.get(`/ops/categories/${id}`);
      const apiResponse = response as unknown as CategoryResponse;
      return normalizeEntity<Category>(apiResponse.data?.category);
    },
    enabled: !!id,
  });
}

// Create category
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCategoryInput) => {
      const response = await api.post('/ops/categories', data);
      const apiResponse = response as unknown as CategoryResponse;
      return normalizeEntity<Category>(apiResponse.data?.category);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

// Update category
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCategoryInput }) => {
      const response = await api.put(`/ops/categories/${id}`, data);
      const apiResponse = response as unknown as CategoryResponse;
      return normalizeEntity<Category>(apiResponse.data?.category);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

// Soft delete (deactivate) category
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/ops/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

// Permanent delete category
export function usePermanentDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/categories/${id}/permanent`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
