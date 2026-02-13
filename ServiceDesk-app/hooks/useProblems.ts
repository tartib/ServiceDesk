import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import {
  IProblem,
  IProblemStats,
  CreateProblemDTO,
  ProblemStatus,
  Priority,
  IApiResponse,
  IApiListResponse,
} from '@/types/itsm';

const PROBLEMS_KEY = 'problems';

// ============================================
// Query Hooks
// ============================================

export const useProblems = (filters?: {
  status?: ProblemStatus[];
  priority?: Priority[];
  owner?: string;
  site_id?: string;
  category_id?: string;
  page?: number;
  limit?: number;
}) => {
  const params = new URLSearchParams();
  
  if (filters?.status?.length) params.append('status', filters.status.join(','));
  if (filters?.priority?.length) params.append('priority', filters.priority.join(','));
  if (filters?.owner) params.append('owner', filters.owner);
  if (filters?.site_id) params.append('site_id', filters.site_id);
  if (filters?.category_id) params.append('category_id', filters.category_id);
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));

  return useQuery({
    queryKey: [PROBLEMS_KEY, 'list', filters],
    queryFn: async () => {
      const response = await api.get<IApiListResponse<IProblem>>(
        `/problems?${params.toString()}`
      );
      return response;
    },
  });
};

export const useProblem = (problemId: string) => {
  return useQuery({
    queryKey: [PROBLEMS_KEY, problemId],
    queryFn: async () => {
      const response = await api.get<IApiResponse<{ problem: IProblem }>>(
        `/problems/${problemId}`
      );
      return response.data.problem;
    },
    enabled: !!problemId,
  });
};

export const useProblemStats = (siteId?: string) => {
  return useQuery({
    queryKey: [PROBLEMS_KEY, 'stats', siteId],
    queryFn: async () => {
      const params = siteId ? `?site_id=${siteId}` : '';
      const response = await api.get<IApiResponse<IProblemStats>>(
        `/problems/stats${params}`
      );
      return response.data;
    },
  });
};

export const useOpenProblems = () => {
  return useQuery({
    queryKey: [PROBLEMS_KEY, 'open'],
    queryFn: async () => {
      const response = await api.get<IApiResponse<IProblem[]>>('/problems/open');
      return response.data;
    },
  });
};

export const useKnownErrors = () => {
  return useQuery({
    queryKey: [PROBLEMS_KEY, 'known-errors'],
    queryFn: async () => {
      const response = await api.get<IApiResponse<IProblem[]>>('/problems/known-errors');
      return response.data;
    },
  });
};

// ============================================
// Mutation Hooks
// ============================================

export const useCreateProblem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProblemDTO) => {
      const response = await api.post<IApiResponse<{ problem: IProblem }>>(
        '/problems',
        data
      );
      return response.data.problem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROBLEMS_KEY] });
    },
  });
};

export const useCreateProblemFromIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (incidentId: string) => {
      const response = await api.post<IApiResponse<{ problem: IProblem }>>(
        `/problems/from-incident/${incidentId}`
      );
      return response.data.problem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROBLEMS_KEY] });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
};

export const useUpdateProblem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      problemId,
      data,
    }: {
      problemId: string;
      data: Partial<CreateProblemDTO>;
    }) => {
      const response = await api.patch<IApiResponse<{ problem: IProblem }>>(
        `/problems/${problemId}`,
        data
      );
      return response.data.problem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PROBLEMS_KEY] });
      queryClient.invalidateQueries({
        queryKey: [PROBLEMS_KEY, variables.problemId],
      });
    },
  });
};

export const useUpdateRootCause = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      problemId,
      root_cause,
      workaround,
    }: {
      problemId: string;
      root_cause: string;
      workaround: string;
    }) => {
      const response = await api.patch<IApiResponse<{ problem: IProblem }>>(
        `/problems/${problemId}/rca`,
        { root_cause, workaround }
      );
      return response.data.problem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PROBLEMS_KEY] });
      queryClient.invalidateQueries({
        queryKey: [PROBLEMS_KEY, variables.problemId],
      });
    },
  });
};

export const useMarkAsKnownError = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      problemId,
      knownError,
    }: {
      problemId: string;
      knownError: {
        title: string;
        symptoms: string;
        root_cause: string;
        workaround: string;
      };
    }) => {
      const response = await api.post<IApiResponse<{ problem: IProblem }>>(
        `/problems/${problemId}/known-error`,
        knownError
      );
      return response.data.problem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PROBLEMS_KEY] });
      queryClient.invalidateQueries({
        queryKey: [PROBLEMS_KEY, variables.problemId],
      });
    },
  });
};

export const useLinkIncidentToProblem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      problemId,
      incidentId,
    }: {
      problemId: string;
      incidentId: string;
    }) => {
      const response = await api.post<IApiResponse<{ problem: IProblem }>>(
        `/problems/${problemId}/link-incident`,
        { incident_id: incidentId }
      );
      return response.data.problem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [PROBLEMS_KEY, variables.problemId],
      });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
};

export const useUpdateProblemStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      problemId,
      status,
    }: {
      problemId: string;
      status: ProblemStatus;
    }) => {
      const response = await api.patch<IApiResponse<{ problem: IProblem }>>(
        `/problems/${problemId}/status`,
        { status }
      );
      return response.data.problem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PROBLEMS_KEY] });
      queryClient.invalidateQueries({
        queryKey: [PROBLEMS_KEY, variables.problemId],
      });
    },
  });
};

export const useResolveProblem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      problemId,
      permanent_fix,
    }: {
      problemId: string;
      permanent_fix: string;
    }) => {
      const response = await api.post<IApiResponse<{ problem: IProblem }>>(
        `/problems/${problemId}/resolve`,
        { permanent_fix }
      );
      return response.data.problem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PROBLEMS_KEY] });
      queryClient.invalidateQueries({
        queryKey: [PROBLEMS_KEY, variables.problemId],
      });
    },
  });
};
