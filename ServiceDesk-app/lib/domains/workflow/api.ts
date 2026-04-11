/**
 * Workflow Engine Domain — API Functions
 *
 * All Workflow API calls go through the unified axios client.
 */

import api from '@/lib/axios';

const BASE = '/workflow-engine';

// ── Definitions ────────────────────────────────────────────────

export const definitionApi = {
  list: (params?: URLSearchParams) =>
    api.get(`${BASE}/definitions${params ? `?${params}` : ''}`),
  getById: (id: string) =>
    api.get(`${BASE}/definitions/${id}`),
  create: (data: Record<string, unknown>) =>
    api.post(`${BASE}/definitions`, data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`${BASE}/definitions/${id}`, data),
  delete: (id: string) =>
    api.delete(`${BASE}/definitions/${id}`),
  publish: (id: string) =>
    api.post(`${BASE}/definitions/${id}/publish`),
  deprecate: (id: string) =>
    api.post(`${BASE}/definitions/${id}/deprecate`),
  getVersions: (id: string) =>
    api.get(`${BASE}/definitions/${id}/versions`),
};

// ── Instances ──────────────────────────────────────────────────

export const instanceApi = {
  list: (params?: URLSearchParams) =>
    api.get(`${BASE}/instances${params ? `?${params}` : ''}`),
  getById: (id: string) =>
    api.get(`${BASE}/instances/${id}`),
  start: (data: Record<string, unknown>) =>
    api.post(`${BASE}/instances`, data),
  transition: (id: string, data: Record<string, unknown>) =>
    api.post(`${BASE}/instances/${id}/transition`, data),
  cancel: (id: string) =>
    api.post(`${BASE}/instances/${id}/cancel`),
  suspend: (id: string) =>
    api.post(`${BASE}/instances/${id}/suspend`),
  resume: (id: string) =>
    api.post(`${BASE}/instances/${id}/resume`),
  getEvents: (id: string) =>
    api.get(`${BASE}/instances/${id}/events`),
};

// ── External Tasks ─────────────────────────────────────────────

export const externalTaskApi = {
  list: (params?: URLSearchParams) =>
    api.get(`${BASE}/external-tasks${params ? `?${params}` : ''}`),
  getById: (id: string) =>
    api.get(`${BASE}/external-tasks/${id}`),
  fetchAndLock: (data: Record<string, unknown>) =>
    api.post(`${BASE}/external-tasks/fetch-and-lock`, data),
  complete: (id: string, data: Record<string, unknown>) =>
    api.post(`${BASE}/external-tasks/${id}/complete`, data),
  fail: (id: string, data: Record<string, unknown>) =>
    api.post(`${BASE}/external-tasks/${id}/fail`, data),
  extendLock: (id: string, data: Record<string, unknown>) =>
    api.post(`${BASE}/external-tasks/${id}/extend-lock`, data),
};
