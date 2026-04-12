/**
 * Gamification Domain — API Functions
 */

import api from '@/lib/axios';

const BASE = '/gamification';

// ── Profile ──────────────────────────────────────────────────

export const profileApi = {
  getMe: () => api.get(`${BASE}/profile/me`),
  getUser: (userId: string) => api.get(`${BASE}/profile/${userId}`),
};

// ── Leaderboard ──────────────────────────────────────────────

export const leaderboardApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get(`${BASE}/leaderboard${qs}`);
  },
  getMyRank: (period?: string) =>
    api.get(`${BASE}/leaderboard/my-rank${period ? `?period=${period}` : ''}`),
  getTeam: (period?: string) =>
    api.get(`${BASE}/leaderboard/team${period ? `?period=${period}` : ''}`),
};

// ── Achievements ─────────────────────────────────────────────

export const achievementApi = {
  getMe: () => api.get(`${BASE}/achievements/me`),
  getUser: (userId: string) => api.get(`${BASE}/achievements/${userId}`),
  getDefinitions: () => api.get(`${BASE}/achievements/definitions`),
};

// ── Admin ────────────────────────────────────────────────────

export const adminApi = {
  listRules: () => api.get(`${BASE}/admin/rules`),
  createRule: (data: Record<string, unknown>) => api.post(`${BASE}/admin/rules`, data),
  updateRule: (id: string, data: Record<string, unknown>) => api.patch(`${BASE}/admin/rules/${id}`, data),
  deleteRule: (id: string) => api.delete(`${BASE}/admin/rules/${id}`),

  listAchievementDefs: () => api.get(`${BASE}/admin/achievements`),
  createAchievementDef: (data: Record<string, unknown>) => api.post(`${BASE}/admin/achievements`, data),
  updateAchievementDef: (id: string, data: Record<string, unknown>) => api.patch(`${BASE}/admin/achievements/${id}`, data),
  deleteAchievementDef: (id: string) => api.delete(`${BASE}/admin/achievements/${id}`),

  listGrowthStates: () => api.get(`${BASE}/admin/growth-states`),
  upsertGrowthStates: (states: unknown[]) => api.put(`${BASE}/admin/growth-states`, { states }),

  getOrgConfig: () => api.get(`${BASE}/admin/org-config`),
  updateOrgConfig: (data: Record<string, unknown>) => api.put(`${BASE}/admin/org-config`, data),

  getAuditLog: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get(`${BASE}/admin/audit-log${qs}`);
  },
};

// ── Analytics ────────────────────────────────────────────────

export const analyticsApi = {
  pointsOverTime: (days?: number) =>
    api.get(`${BASE}/analytics/points-over-time${days ? `?days=${days}` : ''}`),
  streaks: () => api.get(`${BASE}/analytics/streaks`),
  engagement: (days?: number) =>
    api.get(`${BASE}/analytics/engagement${days ? `?days=${days}` : ''}`),
  achievementsUnlocked: (days?: number) =>
    api.get(`${BASE}/analytics/achievements-unlocked${days ? `?days=${days}` : ''}`),
};
