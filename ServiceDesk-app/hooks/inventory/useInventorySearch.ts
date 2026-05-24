'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import api from '@/lib/axios';
import type { InventoryItem } from '@/types';

const BASE = '/inventory/items';

export const itemSearchKeys = {
  all: ['inv-item-search'] as const,
  search: (query: string, filters?: Record<string, unknown>) =>
    [...itemSearchKeys.all, query, filters] as const,
};

interface SearchResponse {
  statusCode: number;
  message: string;
  data: {
    items: InventoryItem[];
    pagination?: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    };
  };
}

interface UseInventorySearchOptions {
  pageSize?: number;
  status?: string;
  groupName?: string;
  enabled?: boolean;
}

/**
 * Server-side search hook for inventory items with debounce support.
 * Used by InventoryItemPicker and other search-enabled components.
 */
export function useInventorySearch(options: UseInventorySearchOptions = {}) {
  const { pageSize = 20, status = 'active', groupName, enabled = true } = options;
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const filters = useMemo(
    () => ({ search: searchTerm, status, groupName, page, pageSize }),
    [searchTerm, status, groupName, page, pageSize],
  );

  const query = useQuery({
    queryKey: itemSearchKeys.search(searchTerm, filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (status) params.set('status', status);
      if (groupName) params.set('groupName', groupName);
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      params.set('sortBy', 'partNo');
      params.set('sortOrder', 'asc');
      const res = await api.get<SearchResponse>(`${BASE}?${params.toString()}`);
      return res;
    },
    enabled: enabled && searchTerm.length >= 0,
    staleTime: 30_000,
  });

  const items: InventoryItem[] = useMemo(() => {
    const data = query.data as SearchResponse | undefined;
    return data?.data?.items ?? [];
  }, [query.data]);

  const pagination = useMemo(() => {
    const data = query.data as SearchResponse | undefined;
    return data?.data?.pagination ?? { page: 1, pageSize, totalItems: 0, totalPages: 1 };
  }, [query.data, pageSize]);

  return {
    items,
    pagination,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    searchTerm,
    setSearchTerm: (term: string) => {
      setSearchTerm(term);
      setPage(1);
    },
    page,
    setPage,
  };
}
