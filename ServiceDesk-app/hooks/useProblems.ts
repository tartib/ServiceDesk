import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import {
  IProblem,
  IProblemStats,
  CreateProblemDTO,
  ProblemStatus,
  Priority,
  RCAMethod,
  IApiResponse,
  IApiListResponse,
} from '@/types/itsm';
import { incidentKeys } from '@/hooks/useIncidents';

const ITSM_BASE = '/itsm';
const PROBLEMS_KEY = 'problems';

export const problemKeys = {
  all: [PROBLEMS_KEY] as const,
  lists: () => [...problemKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...problemKeys.lists(), filters] as const,
  details: () => [...problemKeys.all, 'detail'] as const,
  detail: (id: string) => [PROBLEMS_KEY, id] as const,
  stats: (siteId?: string) => [PROBLEMS_KEY, 'stats', siteId] as const,
  open: () => [PROBLEMS_KEY, 'open'] as const,
  knownErrors: () => [PROBLEMS_KEY, 'known-errors'] as const,
  recurring: () => [PROBLEMS_KEY, 'recurring'] as const,
};

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
        `${ITSM_BASE}/problems?${params.toString()}`
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
        `${ITSM_BASE}/problems/${problemId}`
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
        `${ITSM_BASE}/problems/stats${params}`
      );
      return response.data;
    },
  });
};

export const useOpenProblems = () => {
  return useQuery({
    queryKey: [PROBLEMS_KEY, 'open'],
    queryFn: async () => {
      const response = await api.get<IApiResponse<IProblem[]>>(`${ITSM_BASE}/problems/open`);
      return response.data;
    },
  });
};

export const useKnownErrors = () => {
  return useQuery({
    queryKey: [PROBLEMS_KEY, 'known-errors'],
    queryFn: async () => {
      const response = await api.get<IApiResponse<IProblem[]>>(`${ITSM_BASE}/problems/known-errors`);
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
        `${ITSM_BASE}/problems`,
        data
      );
      return response.data.problem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: problemKeys.lists() });
      queryClient.invalidateQueries({ queryKey: problemKeys.stats() });
      queryClient.invalidateQueries({ queryKey: problemKeys.open() });
    },
  });
};

export const useCreateProblemFromIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (incidentId: string) => {
      const response = await api.post<IApiResponse<{ problem: IProblem }>>(
        `${ITSM_BASE}/problems/from-incident/${incidentId}`
      );
      return response.data.problem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: problemKeys.lists() });
      queryClient.invalidateQueries({ queryKey: problemKeys.stats() });
      queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
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
        `${ITSM_BASE}/problems/${problemId}`,
        data
      );
      return response.data.problem;
    },
    onSuccess: (updatedProblem, variables) => {
      queryClient.setQueryData(problemKeys.detail(variables.problemId), updatedProblem);
      queryClient.invalidateQueries({ queryKey: problemKeys.lists() });
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
        `${ITSM_BASE}/problems/${problemId}/rca`,
        { root_cause, workaround }
      );
      return response.data.problem;
    },
    onSuccess: (updatedProblem, variables) => {
      queryClient.setQueryData(problemKeys.detail(variables.problemId), updatedProblem);
      queryClient.invalidateQueries({ queryKey: problemKeys.lists() });
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
        `${ITSM_BASE}/problems/${problemId}/known-error`,
        knownError
      );
      return response.data.problem;
    },
    onSuccess: (updatedProblem, variables) => {
      queryClient.setQueryData(problemKeys.detail(variables.problemId), updatedProblem);
      queryClient.invalidateQueries({ queryKey: problemKeys.lists() });
      queryClient.invalidateQueries({ queryKey: problemKeys.knownErrors() });
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
        `${ITSM_BASE}/problems/${problemId}/link-incident`,
        { incident_id: incidentId }
      );
      return response.data.problem;
    },
    onSuccess: (updatedProblem, variables) => {
      queryClient.setQueryData(problemKeys.detail(variables.problemId), updatedProblem);
      queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
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
        `${ITSM_BASE}/problems/${problemId}/status`,
        { status }
      );
      return response.data.problem;
    },
    onSuccess: (updatedProblem, variables) => {
      queryClient.setQueryData(problemKeys.detail(variables.problemId), updatedProblem);
      queryClient.invalidateQueries({ queryKey: problemKeys.lists() });
      queryClient.invalidateQueries({ queryKey: problemKeys.stats() });
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
        `${ITSM_BASE}/problems/${problemId}/resolve`,
        { permanent_fix }
      );
      return response.data.problem;
    },
    onSuccess: (updatedProblem, variables) => {
      queryClient.setQueryData(problemKeys.detail(variables.problemId), updatedProblem);
      queryClient.invalidateQueries({ queryKey: problemKeys.lists() });
      queryClient.invalidateQueries({ queryKey: problemKeys.stats() });
      queryClient.invalidateQueries({ queryKey: problemKeys.open() });
    },
  });
};

export const useStartRCA = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ problemId, rca_method }: { problemId: string; rca_method: RCAMethod }) => {
      const response = await api.post<IApiResponse<{ problem: IProblem }>>(
        `${ITSM_BASE}/problems/${problemId}/start-rca`,
        { rca_method }
      );
      return response.data.problem;
    },
    onSuccess: (updatedProblem, { problemId }) => {
      queryClient.setQueryData(problemKeys.detail(problemId), updatedProblem);
      queryClient.invalidateQueries({ queryKey: problemKeys.lists() });
    },
  });
};

export const useCompleteRCA = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      problemId,
      rca_findings,
      root_cause,
      contributing_factors,
    }: {
      problemId: string;
      rca_findings: string;
      root_cause: string;
      contributing_factors?: string[];
    }) => {
      const response = await api.post<IApiResponse<{ problem: IProblem }>>(
        `${ITSM_BASE}/problems/${problemId}/complete-rca`,
        { rca_findings, root_cause, contributing_factors }
      );
      return response.data.problem;
    },
    onSuccess: (updatedProblem, { problemId }) => {
      queryClient.setQueryData(problemKeys.detail(problemId), updatedProblem);
      queryClient.invalidateQueries({ queryKey: problemKeys.lists() });
    },
  });
};

export const usePublishKnownError = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      problemId,
      title,
      symptoms,
      workaround,
    }: {
      problemId: string;
      title: string;
      symptoms: string;
      workaround: string;
    }) => {
      const response = await api.post<IApiResponse<{ problem: IProblem }>>(
        `${ITSM_BASE}/problems/${problemId}/publish-known-error`,
        { title, symptoms, workaround }
      );
      return response.data.problem;
    },
    onSuccess: (updatedProblem, { problemId }) => {
      queryClient.setQueryData(problemKeys.detail(problemId), updatedProblem);
      queryClient.invalidateQueries({ queryKey: problemKeys.knownErrors() });
    },
  });
};

export const useDetectRecurring = () => {
  return useQuery({
    queryKey: [PROBLEMS_KEY, 'recurring'],
    queryFn: async () => {
      const response = await api.get<IApiResponse<{ suggestions: Array<{ incident_ids: string[]; count: number; title: string }> }>>(
        `${ITSM_BASE}/problems/detect-recurring`
      );
      return response.data;
    },
    staleTime: 300_000,
  });
};
