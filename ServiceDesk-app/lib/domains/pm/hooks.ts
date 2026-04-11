/**
 * PM Domain — React Query Hooks
 *
 * Thin wrappers that wire keys + api + adapters into useQuery/useMutation.
 * These are the standard entry point for PM data in components.
 */

import { useQuery } from '@tanstack/react-query';
import { normalizeEntity } from '@/lib/api/normalize';
import { pmKeys } from './keys';
import { projectApi, taskApi, sprintApi, commentApi } from './api';
import { projectAdapters, taskAdapters, sprintAdapters, commentAdapters, mapAdapters } from './adapters';

// ── Project Hooks ──────────────────────────────────────────────

export const usePmProjects = (filters?: Record<string, unknown>) => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, Array.isArray(value) ? value.join(',') : String(value));
      }
    });
  }

  return useQuery({
    queryKey: pmKeys.projects.list(filters),
    queryFn: async () => {
      const raw = await projectApi.list(params);
      return projectAdapters.list(raw);
    },
  });
};

export const usePmProject = (id: string) => {
  return useQuery({
    queryKey: pmKeys.projects.detail(id),
    queryFn: async () => {
      const raw = await projectApi.getById(id);
      return projectAdapters.one(raw);
    },
    enabled: !!id,
  });
};

// ── Task Hooks ─────────────────────────────────────────────────

export const usePmTasks = (projectId: string, filters?: Record<string, unknown>) => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, Array.isArray(value) ? value.join(',') : String(value));
      }
    });
  }

  return useQuery({
    queryKey: pmKeys.tasks.list(projectId, filters),
    queryFn: async () => {
      const raw = await taskApi.list(projectId, params);
      return taskAdapters.list(raw);
    },
    enabled: !!projectId,
  });
};

export const usePmTask = (id: string) => {
  return useQuery({
    queryKey: pmKeys.tasks.detail(id),
    queryFn: async () => {
      const raw = await taskApi.getById(id);
      return taskAdapters.one(raw);
    },
    enabled: !!id,
  });
};

export const usePmBoard = (projectId: string) => {
  return useQuery({
    queryKey: pmKeys.tasks.board(projectId),
    queryFn: async () => {
      const raw = await taskApi.getBoard(projectId);
      return taskAdapters.board(raw);
    },
    enabled: !!projectId,
  });
};

export const usePmBacklog = (projectId: string) => {
  return useQuery({
    queryKey: pmKeys.tasks.backlog(projectId),
    queryFn: async () => {
      const raw = await taskApi.getBacklog(projectId);
      return taskAdapters.backlog(raw);
    },
    enabled: !!projectId,
  });
};

// ── Sprint Hooks ───────────────────────────────────────────────

export const usePmSprints = (projectId: string) => {
  return useQuery({
    queryKey: pmKeys.sprints.list(projectId),
    queryFn: async () => {
      const raw = await sprintApi.list(projectId);
      return sprintAdapters.list(raw);
    },
    enabled: !!projectId,
  });
};

export const usePmSprint = (id: string) => {
  return useQuery({
    queryKey: pmKeys.sprints.detail(id),
    queryFn: async () => {
      const raw = await sprintApi.getById(id);
      return sprintAdapters.one(raw);
    },
    enabled: !!id,
  });
};

export const usePmSprintInsights = (id: string) => {
  return useQuery({
    queryKey: pmKeys.sprints.insights(id),
    queryFn: async () => {
      const raw = await sprintApi.getInsights(id);
      return normalizeEntity<Record<string, unknown>>(raw);
    },
    enabled: !!id,
  });
};

// ── Comment Hooks ──────────────────────────────────────────────

export const usePmComments = (taskId: string) => {
  return useQuery({
    queryKey: pmKeys.comments.list(taskId),
    queryFn: async () => {
      const raw = await commentApi.list(taskId);
      return commentAdapters.list(raw);
    },
    enabled: !!taskId,
  });
};

// ── Map View Hook ─────────────────────────────────────────────

export const usePmMapView = (projectId: string, filters?: Record<string, unknown>) => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, Array.isArray(value) ? value.join(',') : String(value));
      }
    });
  }

  return useQuery({
    queryKey: pmKeys.map.view(projectId, filters),
    queryFn: async () => {
      const raw = await taskApi.getMapView(projectId, params);
      return mapAdapters.view(raw);
    },
    enabled: !!projectId,
  });
};
