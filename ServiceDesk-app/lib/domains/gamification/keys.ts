/**
 * Gamification Domain — React Query Key Factories
 */

export const gamificationKeys = {
  all: ['gamification'] as const,

  profile: {
    all: ['gamification', 'profile'] as const,
    me: () => ['gamification', 'profile', 'me'] as const,
    user: (userId: string) => ['gamification', 'profile', userId] as const,
  },

  leaderboard: {
    all: ['gamification', 'leaderboard'] as const,
    list: (filters?: Record<string, unknown>) => ['gamification', 'leaderboard', 'list', filters] as const,
    myRank: (period?: string) => ['gamification', 'leaderboard', 'my-rank', period] as const,
    team: (period?: string) => ['gamification', 'leaderboard', 'team', period] as const,
  },

  achievements: {
    all: ['gamification', 'achievements'] as const,
    me: () => ['gamification', 'achievements', 'me'] as const,
    user: (userId: string) => ['gamification', 'achievements', userId] as const,
    definitions: () => ['gamification', 'achievements', 'definitions'] as const,
  },

  admin: {
    all: ['gamification', 'admin'] as const,
    rules: () => ['gamification', 'admin', 'rules'] as const,
    achievementDefs: () => ['gamification', 'admin', 'achievements'] as const,
    growthStates: () => ['gamification', 'admin', 'growth-states'] as const,
    orgConfig: () => ['gamification', 'admin', 'org-config'] as const,
    auditLog: (filters?: Record<string, unknown>) => ['gamification', 'admin', 'audit-log', filters] as const,
  },

  analytics: {
    all: ['gamification', 'analytics'] as const,
    pointsOverTime: (days?: number) => ['gamification', 'analytics', 'points-over-time', days] as const,
    streaks: () => ['gamification', 'analytics', 'streaks'] as const,
    engagement: (days?: number) => ['gamification', 'analytics', 'engagement', days] as const,
    achievementsUnlocked: (days?: number) => ['gamification', 'analytics', 'achievements-unlocked', days] as const,
  },
} as const;
