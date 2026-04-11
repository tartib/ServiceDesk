/**
 * Notifications Domain — React Query Key Factories
 */

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (filters?: Record<string, unknown>) => ['notifications', 'list', filters] as const,
  unread: () => ['notifications', 'unread'] as const,
  unreadCount: () => ['notifications', 'unread-count'] as const,
  critical: () => ['notifications', 'critical'] as const,
  byProject: (projectId: string, filters?: Record<string, unknown>) =>
    ['notifications', 'project', projectId, filters] as const,
} as const;
