import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Category } from '@/types';

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
      const url = isActiveOnly ? '/categories?isActive=true' : '/categories';
      const response = await api.get(url);
      // Axios interceptor unwraps response.data, so response is the API response body
      const apiResponse = response as unknown as CategoriesResponse;
      const categories = apiResponse.data?.categories || [];
      
      // Transform _id to id for frontend compatibility
      return categories.map((cat: Category & { _id?: string }) => ({
        ...cat,
        id: cat._id || cat.id,
      }));
    },
  });
}

// Get category by ID
export function useCategory(id: string) {
  return useQuery<Category>({
    queryKey: ['categories', id],
    queryFn: async () => {
      const response = await api.get(`/categories/${id}`);
      const apiResponse = response as unknown as CategoryResponse;
      const category = apiResponse.data?.category;
      return {
        ...category,
        id: category._id || category.id,
      };
    },
    enabled: !!id,
  });
}

// Create category
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCategoryInput) => {
      const response = await api.post('/categories', data);
      const apiResponse = response as unknown as CategoryResponse;
      const category = apiResponse.data?.category;
      return {
        ...category,
        id: category._id || category.id,
      };
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
      const response = await api.put(`/categories/${id}`, data);
      const apiResponse = response as unknown as CategoryResponse;
      const category = apiResponse.data?.category;
      return {
        ...category,
        id: category._id || category.id,
      };
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
      await api.delete(`/categories/${id}`);
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
