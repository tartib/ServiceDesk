/**
 * Workflow Engine Domain — React Query Hooks
 *
 * Thin wrappers that wire keys + api + adapters into useQuery/useMutation.
 * These are the standard entry point for Workflow data in components.
 */

import { useQuery } from '@tanstack/react-query';
import { workflowKeys } from './keys';
import { definitionApi, instanceApi, externalTaskApi } from './api';
import { definitionAdapters, instanceAdapters, externalTaskAdapters } from './adapters';

// ── Definition Hooks ───────────────────────────────────────────

export const useWfDefinitions = (filters?: Record<string, unknown>) => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, Array.isArray(value) ? value.join(',') : String(value));
      }
    });
  }

  return useQuery({
    queryKey: workflowKeys.definitions.list(filters),
    queryFn: async () => {
      const raw = await definitionApi.list(params);
      return definitionAdapters.list(raw);
    },
  });
};

export const useWfDefinition = (id: string) => {
  return useQuery({
    queryKey: workflowKeys.definitions.detail(id),
    queryFn: async () => {
      const raw = await definitionApi.getById(id);
      return definitionAdapters.one(raw);
    },
    enabled: !!id,
  });
};

export const useWfDefinitionVersions = (id: string) => {
  return useQuery({
    queryKey: workflowKeys.definitions.versions(id),
    queryFn: async () => {
      const raw = await definitionApi.getVersions(id);
      return definitionAdapters.versions(raw);
    },
    enabled: !!id,
  });
};

// ── Instance Hooks ─────────────────────────────────────────────

export const useWfInstances = (filters?: Record<string, unknown>) => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, Array.isArray(value) ? value.join(',') : String(value));
      }
    });
  }

  return useQuery({
    queryKey: workflowKeys.instances.list(filters),
    queryFn: async () => {
      const raw = await instanceApi.list(params);
      return instanceAdapters.list(raw);
    },
  });
};

export const useWfInstance = (id: string) => {
  return useQuery({
    queryKey: workflowKeys.instances.detail(id),
    queryFn: async () => {
      const raw = await instanceApi.getById(id);
      return instanceAdapters.one(raw);
    },
    enabled: !!id,
  });
};

export const useWfInstanceEvents = (id: string) => {
  return useQuery({
    queryKey: workflowKeys.instances.events(id),
    queryFn: async () => {
      const raw = await instanceApi.getEvents(id);
      return instanceAdapters.events(raw);
    },
    enabled: !!id,
  });
};

// ── External Task Hooks ────────────────────────────────────────

export const useWfExternalTasks = (filters?: Record<string, unknown>) => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, Array.isArray(value) ? value.join(',') : String(value));
      }
    });
  }

  return useQuery({
    queryKey: workflowKeys.externalTasks.list(filters),
    queryFn: async () => {
      const raw = await externalTaskApi.list(params);
      return externalTaskAdapters.list(raw);
    },
  });
};

export const useWfExternalTask = (id: string) => {
  return useQuery({
    queryKey: workflowKeys.externalTasks.detail(id),
    queryFn: async () => {
      const raw = await externalTaskApi.getById(id);
      return externalTaskAdapters.one(raw);
    },
    enabled: !!id,
  });
};
