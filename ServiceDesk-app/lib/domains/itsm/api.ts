/**
 * ITSM Domain — API Functions
 *
 * All ITSM API calls go through the unified axios client.
 * These functions are consumed by the domain hooks.
 */

import api from '@/lib/axios';

const BASE = '/itsm';

// ── Incidents ──────────────────────────────────────────────────

export const incidentApi = {
  list: (params?: URLSearchParams) =>
    api.get(`${BASE}/incidents${params ? `?${params}` : ''}`),
  getById: (id: string) =>
    api.get(`${BASE}/incidents/${id}`),
  create: (data: Record<string, unknown>) =>
    api.post(`${BASE}/incidents`, data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`${BASE}/incidents/${id}`, data),
  updateStatus: (id: string, data: Record<string, unknown>) =>
    api.patch(`${BASE}/incidents/${id}/status`, data),
  assign: (id: string, data: Record<string, unknown>) =>
    api.patch(`${BASE}/incidents/${id}/assign`, data),
  escalate: (id: string, data: Record<string, unknown>) =>
    api.post(`${BASE}/incidents/${id}/escalate`, data),
  addWorklog: (id: string, data: Record<string, unknown>) =>
    api.post(`${BASE}/incidents/${id}/worklogs`, data),
  linkToProblem: (id: string, data: Record<string, unknown>) =>
    api.post(`${BASE}/incidents/${id}/link-problem`, data),
  getStats: () =>
    api.get(`${BASE}/incidents/stats`),
  getOpen: () =>
    api.get(`${BASE}/incidents/open`),
  getBreached: () =>
    api.get(`${BASE}/incidents/breached`),
  getMajor: () =>
    api.get(`${BASE}/incidents/major`),
  getMyAssignments: () =>
    api.get(`${BASE}/incidents/my-assignments`),
  getMyRequests: () =>
    api.get(`${BASE}/incidents/my-requests`),
  search: (params?: URLSearchParams) =>
    api.get(`${BASE}/incidents/search${params ? `?${params}` : ''}`),
};

// ── Problems ───────────────────────────────────────────────────

export const problemApi = {
  list: (params?: URLSearchParams) =>
    api.get(`${BASE}/problems${params ? `?${params}` : ''}`),
  getById: (id: string) =>
    api.get(`${BASE}/problems/${id}`),
  create: (data: Record<string, unknown>) =>
    api.post(`${BASE}/problems`, data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`${BASE}/problems/${id}`, data),
  getStats: () =>
    api.get(`${BASE}/problems/stats`),
  getKnownErrors: () =>
    api.get(`${BASE}/problems/known-errors`),
};

// ── Changes ────────────────────────────────────────────────────

export const changeApi = {
  list: (params?: URLSearchParams) =>
    api.get(`${BASE}/changes${params ? `?${params}` : ''}`),
  getById: (id: string) =>
    api.get(`${BASE}/changes/${id}`),
  create: (data: Record<string, unknown>) =>
    api.post(`${BASE}/changes`, data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`${BASE}/changes/${id}`, data),
  getStats: () =>
    api.get(`${BASE}/changes/stats`),
  getCalendar: (params?: URLSearchParams) =>
    api.get(`${BASE}/changes/calendar${params ? `?${params}` : ''}`),
};

// ── Releases ───────────────────────────────────────────────────

export const releaseApi = {
  list: (params?: URLSearchParams) =>
    api.get(`${BASE}/releases${params ? `?${params}` : ''}`),
  getById: (id: string) =>
    api.get(`${BASE}/releases/${id}`),
  create: (data: Record<string, unknown>) =>
    api.post(`${BASE}/releases`, data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`${BASE}/releases/${id}`, data),
  delete: (id: string) =>
    api.delete(`${BASE}/releases/${id}`),
  getStats: () =>
    api.get(`${BASE}/releases/stats`),
};

// ── PIRs ───────────────────────────────────────────────────────

export const pirApi = {
  list: () =>
    api.get(`${BASE}/pirs`),
  getById: (pirId: string) =>
    api.get(`${BASE}/pirs/${pirId}`),
  update: (pirId: string, data: Record<string, unknown>) =>
    api.patch(`${BASE}/pirs/${pirId}`, data),
  createForIncident: (incidentId: string, data: Record<string, unknown>) =>
    api.post(`${BASE}/incidents/${incidentId}/pir`, data),
  getByIncident: (incidentId: string) =>
    api.get(`${BASE}/incidents/${incidentId}/pir`),
};

// ── Service Catalog ────────────────────────────────────────────

export const serviceCatalogApi = {
  list: (params?: URLSearchParams) =>
    api.get(`${BASE}/services${params ? `?${params}` : ''}`),
  getById: (id: string) =>
    api.get(`${BASE}/services/${id}`),
  create: (data: Record<string, unknown>) =>
    api.post(`${BASE}/services`, data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`${BASE}/services/${id}`, data),
  delete: (id: string) =>
    api.delete(`${BASE}/services/${id}`),
  getCategories: () =>
    api.get(`${BASE}/services/categories`),
  getFeatured: () =>
    api.get(`${BASE}/services/featured`),
};

// ── Service Requests ───────────────────────────────────────────

export const serviceRequestApi = {
  list: (params?: URLSearchParams) =>
    api.get(`${BASE}/requests${params ? `?${params}` : ''}`),
  getById: (id: string) =>
    api.get(`${BASE}/requests/${id}`),
  create: (data: Record<string, unknown>) =>
    api.post(`${BASE}/requests`, data),
  approve: (id: string) =>
    api.post(`${BASE}/requests/${id}/approve`),
  reject: (id: string, data: Record<string, unknown>) =>
    api.post(`${BASE}/requests/${id}/reject`, data),
  cancel: (id: string) =>
    api.post(`${BASE}/requests/${id}/cancel`),
  assign: (id: string, data: Record<string, unknown>) =>
    api.post(`${BASE}/requests/${id}/assign`, data),
  addComment: (id: string, data: Record<string, unknown>) =>
    api.post(`${BASE}/requests/${id}/comments`, data),
};

// ── Dashboard ──────────────────────────────────────────────────

export const itsmDashboardApi = {
  getSummary: () =>
    api.get(`${BASE}/itsm-dashboard`),
  getIncidentKPIs: () =>
    api.get(`${BASE}/itsm-dashboard/incidents`),
  getProblemKPIs: () =>
    api.get(`${BASE}/itsm-dashboard/problems`),
  getChangeKPIs: () =>
    api.get(`${BASE}/itsm-dashboard/changes`),
  getSLACompliance: () =>
    api.get(`${BASE}/itsm-dashboard/sla-compliance`),
  getIncidentTrend: () =>
    api.get(`${BASE}/itsm-dashboard/incident-trend`),
};

// ── Knowledge Deflection ───────────────────────────────────────

export const knowledgeDeflectionApi = {
  suggest: (data: Record<string, unknown>) =>
    api.post(`${BASE}/knowledge/deflect`, data),
  markHelpful: (articleId: string) =>
    api.post(`${BASE}/knowledge/deflect/${articleId}/helpful`),
  markNotHelpful: (articleId: string) =>
    api.post(`${BASE}/knowledge/deflect/${articleId}/not-helpful`),
  getStats: () =>
    api.get(`${BASE}/knowledge/deflect/stats`),
};
