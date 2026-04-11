/**
 * Gamification React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gamificationKeys, profileApi, leaderboardApi, achievementApi, adminApi, analyticsApi } from '@/lib/domains/gamification';

// ── Profile Hooks ────────────────────────────────────────────

export function useMyGamificationProfile() {
  return useQuery({
    queryKey: gamificationKeys.profile.me(),
    queryFn: () => profileApi.getMe(),
  });
}

export function useUserGamificationProfile(userId: string) {
  return useQuery({
    queryKey: gamificationKeys.profile.user(userId),
    queryFn: () => profileApi.getUser(userId),
    enabled: !!userId,
  });
}

// ── Leaderboard Hooks ────────────────────────────────────────

export function useLeaderboard(params?: Record<string, string>) {
  return useQuery({
    queryKey: gamificationKeys.leaderboard.list(params),
    queryFn: () => leaderboardApi.list(params),
  });
}

export function useMyRank(period?: string) {
  return useQuery({
    queryKey: gamificationKeys.leaderboard.myRank(period),
    queryFn: () => leaderboardApi.getMyRank(period),
  });
}

export function useTeamLeaderboard(period?: string) {
  return useQuery({
    queryKey: gamificationKeys.leaderboard.team(period),
    queryFn: () => leaderboardApi.getTeam(period),
  });
}

// ── Achievement Hooks ────────────────────────────────────────

export function useMyAchievements() {
  return useQuery({
    queryKey: gamificationKeys.achievements.me(),
    queryFn: () => achievementApi.getMe(),
  });
}

export function useUserAchievements(userId: string) {
  return useQuery({
    queryKey: gamificationKeys.achievements.user(userId),
    queryFn: () => achievementApi.getUser(userId),
    enabled: !!userId,
  });
}

export function useAchievementDefinitions() {
  return useQuery({
    queryKey: gamificationKeys.achievements.definitions(),
    queryFn: () => achievementApi.getDefinitions(),
  });
}

// ── Admin Hooks ──────────────────────────────────────────────

export function useGamificationRules() {
  return useQuery({
    queryKey: gamificationKeys.admin.rules(),
    queryFn: () => adminApi.listRules(),
  });
}

export function useCreateRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.createRule(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: gamificationKeys.admin.rules() }),
  });
}

export function useUpdateRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => adminApi.updateRule(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: gamificationKeys.admin.rules() }),
  });
}

export function useDeleteRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteRule(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: gamificationKeys.admin.rules() }),
  });
}

export function useGamificationAchievementDefs() {
  return useQuery({
    queryKey: gamificationKeys.admin.achievementDefs(),
    queryFn: () => adminApi.listAchievementDefs(),
  });
}

export function useCreateAchievementDef() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.createAchievementDef(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: gamificationKeys.admin.achievementDefs() }),
  });
}

export function useGrowthStates() {
  return useQuery({
    queryKey: gamificationKeys.admin.growthStates(),
    queryFn: () => adminApi.listGrowthStates(),
  });
}

export function useOrgGamificationConfig() {
  return useQuery({
    queryKey: gamificationKeys.admin.orgConfig(),
    queryFn: () => adminApi.getOrgConfig(),
  });
}

export function useUpdateOrgGamificationConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.updateOrgConfig(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: gamificationKeys.admin.orgConfig() }),
  });
}

export function useGamificationAuditLog(params?: Record<string, string>) {
  return useQuery({
    queryKey: gamificationKeys.admin.auditLog(params),
    queryFn: () => adminApi.getAuditLog(params),
  });
}

// ── Analytics Hooks ──────────────────────────────────────────

export function usePointsOverTime(days?: number) {
  return useQuery({
    queryKey: gamificationKeys.analytics.pointsOverTime(days),
    queryFn: () => analyticsApi.pointsOverTime(days),
  });
}

export function useStreakAnalytics() {
  return useQuery({
    queryKey: gamificationKeys.analytics.streaks(),
    queryFn: () => analyticsApi.streaks(),
  });
}

export function useEngagementAnalytics(days?: number) {
  return useQuery({
    queryKey: gamificationKeys.analytics.engagement(days),
    queryFn: () => analyticsApi.engagement(days),
  });
}

export function useAchievementsUnlocked(days?: number) {
  return useQuery({
    queryKey: gamificationKeys.analytics.achievementsUnlocked(days),
    queryFn: () => analyticsApi.achievementsUnlocked(days),
  });
}
