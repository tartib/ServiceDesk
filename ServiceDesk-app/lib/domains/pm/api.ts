/**
 * PM Domain — API Functions
 *
 * All PM API calls go through the unified axios client.
 */

import api from '@/lib/axios';

// ── Projects ───────────────────────────────────────────────────

export const projectApi = {
  list: (params?: URLSearchParams) =>
    api.get(`/pm/projects${params ? `?${params}` : ''}`),
  getById: (id: string) =>
    api.get(`/pm/projects/${id}`),
  create: (data: Record<string, unknown>) =>
    api.post('/pm/projects', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/pm/projects/${id}`, data),
  delete: (id: string) =>
    api.delete(`/pm/projects/${id}`),
  archive: (id: string) =>
    api.post(`/pm/projects/${id}/archive`),
  getLabels: (id: string) =>
    api.get(`/pm/projects/${id}/labels`),
  getMembers: (id: string) =>
    api.get(`/pm/projects/${id}/members`),
  inviteMember: (id: string, data: Record<string, unknown>) =>
    api.post(`/pm/projects/${id}/members/invite`, data),
};

// ── Tasks ──────────────────────────────────────────────────────

export const taskApi = {
  list: (projectId: string, params?: URLSearchParams) =>
    api.get(`/pm/projects/${projectId}/tasks${params ? `?${params}` : ''}`),
  getById: (id: string) =>
    api.get(`/pm/tasks/${id}`),
  create: (projectId: string, data: Record<string, unknown>) =>
    api.post(`/pm/projects/${projectId}/tasks`, data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/pm/tasks/${id}`, data),
  delete: (id: string) =>
    api.delete(`/pm/tasks/${id}`),
  transition: (id: string, data: Record<string, unknown>) =>
    api.post(`/pm/tasks/${id}/transition`, data),
  move: (id: string, data: Record<string, unknown>) =>
    api.post(`/pm/tasks/${id}/move`, data),
  getBoard: (projectId: string) =>
    api.get(`/pm/projects/${projectId}/board`),
  getBacklog: (projectId: string) =>
    api.get(`/pm/projects/${projectId}/backlog`),
};

// ── Sprints ────────────────────────────────────────────────────

export const sprintApi = {
  list: (projectId: string) =>
    api.get(`/pm/projects/${projectId}/sprints`),
  getById: (id: string) =>
    api.get(`/pm/sprints/${id}`),
  create: (projectId: string, data: Record<string, unknown>) =>
    api.post(`/pm/projects/${projectId}/sprints`, data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/pm/sprints/${id}`, data),
  delete: (id: string) =>
    api.delete(`/pm/sprints/${id}`),
  start: (id: string) =>
    api.post(`/pm/sprints/${id}/start`),
  complete: (id: string, data?: Record<string, unknown>) =>
    api.post(`/pm/sprints/${id}/complete`, data),
  getInsights: (id: string) =>
    api.get(`/pm/sprints/${id}/insights`),
};

// ── Comments ───────────────────────────────────────────────────

export const commentApi = {
  list: (taskId: string) =>
    api.get(`/pm/tasks/${taskId}/comments`),
  create: (taskId: string, data: Record<string, unknown>) =>
    api.post(`/pm/tasks/${taskId}/comments`, data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/pm/comments/${id}`, data),
  delete: (id: string) =>
    api.delete(`/pm/comments/${id}`),
  react: (id: string, data: Record<string, unknown>) =>
    api.post(`/pm/comments/${id}/reactions`, data),
};
