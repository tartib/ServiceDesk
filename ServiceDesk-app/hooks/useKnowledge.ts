/**
 * Knowledge Hooks - خطافات قاعدة المعرفة
 * React Query hooks for Knowledge Base API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

// Types
export enum ArticleStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum ArticleVisibility {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  TECHNICIANS = 'technicians',
}

export interface KnowledgeArticle {
  _id: string;
  article_id: string;
  title: string;
  title_ar: string;
  slug: string;
  content: string;
  content_ar: string;
  summary?: string;
  summary_ar?: string;
  category_id: string;
  subcategory_id?: string;
  tags: string[];
  status: ArticleStatus;
  visibility: ArticleVisibility;
  author: {
    id: string;
    name: string;
    email: string;
  };
  reviewer?: {
    id: string;
    name: string;
    reviewed_at: string;
    comments?: string;
  };
  linked_incidents?: string[];
  linked_problems?: string[];
  attachments: Array<{
    file_id: string;
    name: string;
    url: string;
    size: number;
    mime_type: string;
  }>;
  metrics: {
    views: number;
    helpful_count: number;
    not_helpful_count: number;
    avg_rating: number;
    rating_count: number;
  };
  version: number;
  is_featured: boolean;
  expires_at?: string;
  site_id?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface CreateArticleDTO {
  title: string;
  title_ar?: string;
  content: string;
  content_ar?: string;
  summary?: string;
  summary_ar?: string;
  category_id: string;
  subcategory_id?: string;
  tags?: string[];
  visibility?: ArticleVisibility;
  is_featured?: boolean;
}

export interface UpdateArticleDTO {
  title?: string;
  title_ar?: string;
  content?: string;
  content_ar?: string;
  summary?: string;
  summary_ar?: string;
  category_id?: string;
  subcategory_id?: string;
  tags?: string[];
  visibility?: ArticleVisibility;
  is_featured?: boolean;
  expires_at?: string;
}

export interface KnowledgeStats {
  total_articles: number;
  published_articles: number;
  draft_articles: number;
  total_views: number;
  avg_rating: number;
}

// Query Keys
export const knowledgeKeys = {
  all: ['knowledge'] as const,
  lists: () => [...knowledgeKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...knowledgeKeys.lists(), filters] as const,
  details: () => [...knowledgeKeys.all, 'detail'] as const,
  detail: (id: string) => [...knowledgeKeys.details(), id] as const,
  search: (query: string) => [...knowledgeKeys.all, 'search', query] as const,
  featured: () => [...knowledgeKeys.all, 'featured'] as const,
  popular: () => [...knowledgeKeys.all, 'popular'] as const,
  stats: () => [...knowledgeKeys.all, 'stats'] as const,
};

/**
 * الحصول على قائمة المقالات
 */
export function useKnowledgeArticles(filters?: {
  status?: ArticleStatus;
  category_id?: string;
  visibility?: ArticleVisibility;
  search?: string;
  tags?: string;
  is_featured?: boolean;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: knowledgeKeys.list(filters || {}),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.category_id) params.append('category_id', filters.category_id);
      if (filters?.visibility) params.append('visibility', filters.visibility);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.tags) params.append('tags', filters.tags);
      if (filters?.is_featured !== undefined) params.append('is_featured', String(filters.is_featured));
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));

      const response = await api.get(`/knowledge?${params.toString()}`) as {
        data?: KnowledgeArticle[];
        pagination?: { page: number; limit: number; total: number; pages: number };
      };
      return {
        articles: response.data || [],
        pagination: response.pagination,
      };
    },
  });
}

/**
 * البحث في المقالات
 */
export function useSearchArticles(query: string, options?: { category_id?: string; limit?: number }) {
  return useQuery({
    queryKey: knowledgeKeys.search(query),
    queryFn: async () => {
      const params = new URLSearchParams({ q: query });
      if (options?.category_id) params.append('category_id', options.category_id);
      if (options?.limit) params.append('limit', String(options.limit));

      const response = await api.get(`/knowledge/search?${params.toString()}`) as {
        data?: KnowledgeArticle[];
      };
      return response.data || [];
    },
    enabled: query.length >= 2,
  });
}

/**
 * الحصول على مقالة بواسطة المعرف
 */
export function useKnowledgeArticle(id: string, incrementViews = false) {
  return useQuery({
    queryKey: knowledgeKeys.detail(id),
    queryFn: async () => {
      const params = incrementViews ? '?increment_views=true' : '';
      const response = await api.get(`/knowledge/${id}${params}`) as { data?: KnowledgeArticle };
      return (response.data || response) as KnowledgeArticle;
    },
    enabled: !!id,
  });
}

/**
 * الحصول على المقالات المميزة
 */
export function useFeaturedArticles(limit = 5) {
  return useQuery({
    queryKey: knowledgeKeys.featured(),
    queryFn: async () => {
      const response = await api.get(`/knowledge/featured?limit=${limit}`) as {
        data?: KnowledgeArticle[];
      };
      return response.data || [];
    },
  });
}

/**
 * الحصول على المقالات الأكثر مشاهدة
 */
export function usePopularArticles(limit = 10) {
  return useQuery({
    queryKey: knowledgeKeys.popular(),
    queryFn: async () => {
      const response = await api.get(`/knowledge/popular?limit=${limit}`) as {
        data?: KnowledgeArticle[];
      };
      return response.data || [];
    },
  });
}

/**
 * الحصول على إحصائيات قاعدة المعرفة
 */
export function useKnowledgeStats() {
  return useQuery({
    queryKey: knowledgeKeys.stats(),
    queryFn: async () => {
      const response = await api.get('/knowledge/stats') as { data?: KnowledgeStats };
      return (response.data || response) as KnowledgeStats;
    },
  });
}

/**
 * إنشاء مقالة جديدة
 */
export function useCreateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateArticleDTO) => {
      const response = await api.post('/knowledge', data) as { data?: KnowledgeArticle };
      return (response.data || response) as KnowledgeArticle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.stats() });
    },
  });
}

/**
 * تحديث مقالة
 */
export function useUpdateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateArticleDTO }) => {
      const response = await api.put(`/knowledge/${id}`, data) as { data?: KnowledgeArticle };
      return response.data || response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.lists() });
    },
  });
}

/**
 * نشر مقالة
 */
export function usePublishArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/knowledge/${id}/publish`) as { data?: KnowledgeArticle };
      return response.data || response;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.stats() });
    },
  });
}

/**
 * أرشفة مقالة
 */
export function useArchiveArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/knowledge/${id}/archive`) as { data?: KnowledgeArticle };
      return response.data || response;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.stats() });
    },
  });
}

/**
 * حذف مقالة
 */
export function useDeleteArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/knowledge/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.stats() });
    },
  });
}

/**
 * تقديم تقييم للمقالة
 */
export function useSubmitFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, helpful, rating }: { id: string; helpful?: boolean; rating?: number }) => {
      const response = await api.post(`/knowledge/${id}/feedback`, { helpful, rating });
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.detail(variables.id) });
    },
  });
}
