import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

// Types
export type WorkflowStatus = 'draft' | 'published' | 'archived';

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
  width?: number;
  height?: number;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
  animated?: boolean;
  label?: string;
  style?: Record<string, unknown>;
}

export interface WorkflowDiagram {
  _id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  status: WorkflowStatus;
  createdBy: {
    _id: string;
    name?: string;
    email?: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      avatar?: string;
    };
  };
  organizationId?: string;
  thumbnail?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkflowDTO {
  name: string;
  description?: string;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
  tags?: string[];
}

export interface UpdateWorkflowDTO {
  name?: string;
  description?: string;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
  tags?: string[];
  thumbnail?: string;
}

// Query Keys
export const workflowKeys = {
  all: ['workflows'] as const,
  lists: () => [...workflowKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...workflowKeys.lists(), filters] as const,
  details: () => [...workflowKeys.all, 'detail'] as const,
  detail: (id: string) => [...workflowKeys.details(), id] as const,
};

// List workflows
export function useWorkflows(filters?: {
  status?: WorkflowStatus;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: workflowKeys.list(filters || {}),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));

      const response = await api.get(`/workflows?${params.toString()}`) as {
        data?: {
          workflows: WorkflowDiagram[];
          pagination: { page: number; limit: number; total: number; pages: number };
        };
      };
      return {
        workflows: response.data?.workflows || [],
        pagination: response.data?.pagination,
      };
    },
  });
}

// Get single workflow
export function useWorkflow(id: string) {
  return useQuery({
    queryKey: workflowKeys.detail(id),
    queryFn: async () => {
      const response = await api.get(`/workflows/${id}`) as {
        data?: { workflow: WorkflowDiagram };
      };
      return (response.data?.workflow || response) as WorkflowDiagram;
    },
    enabled: !!id,
  });
}

// Create workflow
export function useCreateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateWorkflowDTO) => {
      const response = await api.post('/workflows', data) as {
        data?: { workflow: WorkflowDiagram };
      };
      return (response.data?.workflow || response) as WorkflowDiagram;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
    },
  });
}

// Update workflow
export function useUpdateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateWorkflowDTO }) => {
      const response = await api.put(`/workflows/${id}`, data) as {
        data?: { workflow: WorkflowDiagram };
      };
      return (response.data?.workflow || response) as WorkflowDiagram;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
    },
  });
}

// Delete workflow
export function useDeleteWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/workflows/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
    },
  });
}

// Publish workflow
export function usePublishWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/workflows/${id}/publish`) as {
        data?: { workflow: WorkflowDiagram };
      };
      return (response.data?.workflow || response) as WorkflowDiagram;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
    },
  });
}

// Archive workflow
export function useArchiveWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/workflows/${id}/archive`) as {
        data?: { workflow: WorkflowDiagram };
      };
      return (response.data?.workflow || response) as WorkflowDiagram;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
    },
  });
}
