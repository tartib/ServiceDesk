/**
 * Gamification Domain Interfaces
 *
 * Pure domain entity interfaces and enums for the Gamification module.
 * These define the shape of domain objects without coupling to the database.
 */

// ── Enums ────────────────────────────────────────────────────

export enum GrowthState {
  SEED = 'seed',
  SPROUT = 'sprout',
  BUD = 'bud',
  BLOOM = 'bloom',
  FULL_BLOOM = 'full_bloom',
}

export enum LeaderboardScope {
  ORGANIZATION = 'organization',
  TEAM = 'team',
  PROJECT = 'project',
}

export enum LeaderboardPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ALL_TIME = 'all_time',
}

export enum AchievementCategory {
  STREAK = 'streak',
  PRODUCTIVITY = 'productivity',
  TEAMWORK = 'teamwork',
  MILESTONE = 'milestone',
}

export enum RuleEffect {
  BONUS = 'bonus',
  PENALTY = 'penalty',
  BASE = 'base',
}

export enum GamificationEventType {
  POINTS_AWARDED = 'gamification.points.awarded',
  LEVEL_CHANGED = 'gamification.level.changed',
  GROWTH_STATE_CHANGED = 'gamification.growth_state.changed',
  ACHIEVEMENT_UNLOCKED = 'gamification.achievement.unlocked',
  STREAK_UPDATED = 'gamification.streak.updated',
  STREAK_BROKEN = 'gamification.streak.broken',
  TEAM_MILESTONE = 'gamification.team.milestone',
}

// ── Reason Codes ─────────────────────────────────────────────

export type ReasonCode =
  | 'task_completed'
  | 'work_order_completed'
  | 'sprint_completed'
  | 'bug_fixed'
  | 'critical_task_completed'
  | 'early_completion_bonus'
  | 'streak_bonus_7'
  | 'streak_bonus_30'
  | 'team_sprint_bonus'
  | 'first_task_bonus'
  | 'overdue_penalty'
  | 'reopen_penalty'
  | 'admin_adjustment'
  | string; // extensible for custom org rules

// ── Trigger Types ────────────────────────────────────────────

export type RuleTrigger =
  | 'pm.work_item.transitioned'
  | 'pm.sprint.completed'
  | 'ops.work_order.completed'
  | 'ops.work_order.overdue'
  | 'manual'
  | string; // extensible

// ── Entity Interfaces ────────────────────────────────────────

export interface IGamificationProfile {
  _id?: string;
  userId: string;
  organizationId: string;
  totalPoints: number;
  currentLevel: number;
  growthState: GrowthState;
  currentStreak: number;
  longestStreak: number;
  lastQualifiedActivityAt?: Date;
  dailyPointsEarned: number;
  dailyPointsDate?: string; // YYYY-MM-DD
  achievementCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPointsLedger {
  _id?: string;
  userId: string;
  organizationId: string;
  pointsDelta: number;
  reasonCode: ReasonCode;
  sourceModule: string;
  sourceEntityType: string;
  sourceEntityId: string;
  eventId: string;
  ruleId?: string;
  balanceAfter: number;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
}

export interface IRuleCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'exists';
  value: unknown;
}

export interface IGamificationRule {
  _id?: string;
  code: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  trigger: RuleTrigger;
  conditions: IRuleCondition[];
  effect: RuleEffect;
  pointsDelta: number;
  enabled: boolean;
  priority: number;
  validFrom?: Date;
  validTo?: Date;
  dailyCap?: number;
  reopenAbuseWindowMs?: number; // e.g., 300000 = 5 min
  organizationId?: string; // null = global
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAchievementCondition {
  type: 'total_points' | 'current_level' | 'current_streak' | 'tasks_completed' | 'sprints_completed' | 'custom';
  operator: 'gte' | 'eq' | 'lte';
  value: number;
  customField?: string;
}

export interface IAchievementDefinition {
  _id?: string;
  code: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  category: AchievementCategory;
  conditions: IAchievementCondition[];
  icon: string;
  hidden: boolean;
  repeatable: boolean;
  organizationId?: string; // null = global
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserAchievement {
  _id?: string;
  userId: string;
  organizationId: string;
  achievementCode: string;
  unlockedAt: Date;
  progress?: number; // 0–100 for progressive achievements
  notified: boolean;
}

export interface IGrowthStateConfig {
  _id?: string;
  state: GrowthState;
  minPoints: number;
  minLevel: number;
  icon: string;
  label: string;
  labelAr?: string;
  organizationId?: string;
}

export interface IOrgGamificationConfig {
  _id?: string;
  organizationId: string;
  pointsEnabled: boolean;
  streaksEnabled: boolean;
  leaderboardEnabled: boolean;
  achievementsEnabled: boolean;
  celebrationsEnabled: boolean;
  dailyPointsCap: number;
  streakMinDailyActivity: number;
  streakCutoffHour: number; // hour in org timezone (e.g., 0 = midnight)
  timezone: string; // IANA timezone (e.g., 'Asia/Riyadh')
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IStreakReminderLog {
  _id?: string;
  userId: string;
  date: string; // YYYY-MM-DD
  sent: boolean;
}

// ── Event Payloads ───────────────────────────────────────────

export interface PointsAwardedPayload {
  userId: string;
  organizationId: string;
  pointsDelta: number;
  reasonCode: ReasonCode;
  newTotal: number;
  sourceEntityId: string;
}

export interface LevelChangedPayload {
  userId: string;
  organizationId: string;
  previousLevel: number;
  newLevel: number;
  newGrowthState: GrowthState;
}

export interface GrowthStateChangedPayload {
  userId: string;
  organizationId: string;
  previousState: GrowthState;
  newState: GrowthState;
}

export interface AchievementUnlockedPayload {
  userId: string;
  organizationId: string;
  achievementCode: string;
  achievementName: string;
  category: AchievementCategory;
}

export interface StreakUpdatedPayload {
  userId: string;
  organizationId: string;
  currentStreak: number;
  longestStreak: number;
}

export interface StreakBrokenPayload {
  userId: string;
  organizationId: string;
  previousStreak: number;
}

export interface TeamMilestonePayload {
  organizationId: string;
  teamId?: string;
  milestone: string;
  description: string;
}

// ── Service Interfaces ───────────────────────────────────────

export interface LevelChangeResult {
  levelChanged: boolean;
  growthStateChanged: boolean;
  previousLevel: number;
  newLevel: number;
  previousGrowthState: GrowthState;
  newGrowthState: GrowthState;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName?: string;
  avatarUrl?: string;
  totalPoints: number;
  currentLevel: number;
  growthState: GrowthState;
  currentStreak: number;
}

export interface LeaderboardOptions {
  scope: LeaderboardScope;
  period: LeaderboardPeriod;
  teamId?: string;
  projectId?: string;
  limit?: number;
  page?: number;
}

export interface TeamLeaderboardEntry {
  rank: number;
  teamId: string;
  teamName?: string;
  totalPoints: number;
  memberCount: number;
  averagePoints: number;
}
