import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/axios';
import { IDeflectionResult, IApiResponse } from '@/types/itsm';

export const useDeflectionSuggestions = (
  title: string,
  description: string,
  options?: { category_id?: string; tags?: string[]; enabled?: boolean }
) => {
  return useQuery({
    queryKey: ['knowledge-deflect', title, description, options?.category_id],
    queryFn: async () => {
      const response = await api.post('/itsm/knowledge/deflect', {
        title,
        description,
        category_id: options?.category_id,
        tags: options?.tags,
      }) as IApiResponse<IDeflectionResult>;
      return response.data;
    },
    enabled: (options?.enabled ?? true) && title.length >= 5,
    staleTime: 30_000,
  });
};

export const useMarkHelpful = () => {
  return useMutation({
    mutationFn: async (articleId: string) => {
      await api.post(`/itsm/knowledge/deflect/${articleId}/helpful`);
    },
  });
};

export const useMarkNotHelpful = () => {
  return useMutation({
    mutationFn: async (articleId: string) => {
      await api.post(`/itsm/knowledge/deflect/${articleId}/not-helpful`);
    },
  });
};

export const useDeflectionStats = () => {
  return useQuery({
    queryKey: ['knowledge-deflect-stats'],
    queryFn: async () => {
      const response = await api.get('/itsm/knowledge/deflect/stats') as IApiResponse<{
        total_articles: number;
        total_views: number;
        total_helpful: number;
        total_not_helpful: number;
        deflection_rate: number;
        top_deflecting: { article_id: string; title: string; helpful_count: number }[];
      }>;
      return response.data;
    },
  });
};
