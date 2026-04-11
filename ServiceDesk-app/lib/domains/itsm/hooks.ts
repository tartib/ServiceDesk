/**
 * ITSM Domain — React Query Hooks
 *
 * Thin wrappers that wire keys + api + adapters into useQuery/useMutation.
 * These are the standard entry point for ITSM data in components.
 */

import { useQuery } from '@tanstack/react-query';
import { itsmKeys } from './keys';
import { incidentApi, problemApi, changeApi } from './api';
import { incidentAdapters, problemAdapters, changeAdapters } from './adapters';

// ── Incident Hooks ─────────────────────────────────────────────

export const useItsmIncidents = (filters?: Record<string, unknown>) => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, Array.isArray(value) ? value.join(',') : String(value));
      }
    });
  }

  return useQuery({
    queryKey: itsmKeys.incidents.list(filters),
    queryFn: async () => {
      const raw = await incidentApi.list(params);
      return incidentAdapters.list(raw);
    },
  });
};

export const useItsmIncident = (id: string) => {
  return useQuery({
    queryKey: itsmKeys.incidents.detail(id),
    queryFn: async () => {
      const raw = await incidentApi.getById(id);
      return incidentAdapters.one(raw);
    },
    enabled: !!id,
  });
};

export const useItsmIncidentStats = () => {
  return useQuery({
    queryKey: itsmKeys.incidents.stats(),
    queryFn: async () => {
      const raw = await incidentApi.getStats();
      return incidentAdapters.stats(raw);
    },
  });
};

// ── Problem Hooks ──────────────────────────────────────────────

export const useItsmProblems = (filters?: Record<string, unknown>) => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, Array.isArray(value) ? value.join(',') : String(value));
      }
    });
  }

  return useQuery({
    queryKey: itsmKeys.problems.list(filters),
    queryFn: async () => {
      const raw = await problemApi.list(params);
      return problemAdapters.list(raw);
    },
  });
};

export const useItsmProblem = (id: string) => {
  return useQuery({
    queryKey: itsmKeys.problems.detail(id),
    queryFn: async () => {
      const raw = await problemApi.getById(id);
      return problemAdapters.one(raw);
    },
    enabled: !!id,
  });
};

// ── Change Hooks ───────────────────────────────────────────────

export const useItsmChanges = (filters?: Record<string, unknown>) => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, Array.isArray(value) ? value.join(',') : String(value));
      }
    });
  }

  return useQuery({
    queryKey: itsmKeys.changes.list(filters),
    queryFn: async () => {
      const raw = await changeApi.list(params);
      return changeAdapters.list(raw);
    },
  });
};

export const useItsmChange = (id: string) => {
  return useQuery({
    queryKey: itsmKeys.changes.detail(id),
    queryFn: async () => {
      const raw = await changeApi.getById(id);
      return changeAdapters.one(raw);
    },
    enabled: !!id,
  });
};

export const useItsmChangeStats = () => {
  return useQuery({
    queryKey: itsmKeys.changes.stats(),
    queryFn: async () => {
      const raw = await changeApi.getStats();
      return changeAdapters.stats(raw);
    },
  });
};
