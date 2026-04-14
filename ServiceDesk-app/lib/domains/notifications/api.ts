/**
 * Notifications Domain — API Functions
 *
 * Typed wrappers around the unified /api/v2/notifications endpoints.
 * The `api` instance returns unwrapped data (response interceptor strips AxiosResponse).
 * The backend sends `{ success, data: { notifications, count, unreadCount } }` — the
 * interceptor returns the inner object directly.
 */

import api from '@/lib/axios';
import { Notification } from '@/types';
import { normalizeNotification, normalizeNotificationList } from './adapters';

interface RawListResponse {
  notifications?: unknown[];
  data?: unknown[];
  count?: number;
  unreadCount?: number;
  pagination?: { page: number; limit: number };
}

interface RawCountResponse {
  unreadCount?: number;
}

interface RawMutateResponse {
  modifiedCount?: number;
}

export interface NotificationListResponse {
  notifications: Notification[];
  count: number;
  unreadCount: number;
  pagination?: { page: number; limit: number };
}

export interface NotificationListParams {
  isRead?: boolean;
  source?: string;
  projectId?: string;
  limit?: number;
  page?: number;
}

export const notificationApi = {
  list: async (params?: NotificationListParams): Promise<NotificationListResponse> => {
    const raw = await api.get<RawListResponse>('/notifications', { params });
    const notifications = normalizeNotificationList(raw?.notifications ?? raw?.data ?? []);
    return {
      notifications,
      count: raw?.count ?? notifications.length,
      unreadCount: raw?.unreadCount ?? 0,
      pagination: raw?.pagination,
    };
  },

  unread: async (): Promise<Notification[]> => {
    const raw = await api.get<RawListResponse>('/notifications/unread');
    return normalizeNotificationList(raw?.notifications ?? raw?.data ?? []);
  },

  unreadCount: async (): Promise<number> => {
    const raw = await api.get<RawCountResponse>('/notifications/unread-count');
    return raw?.unreadCount ?? 0;
  },

  critical: async (): Promise<Notification[]> => {
    const raw = await api.get<RawListResponse>('/notifications/critical');
    return normalizeNotificationList(raw?.notifications ?? raw?.data ?? []);
  },

  markAsRead: async (notificationId: string): Promise<Notification> => {
    const raw = await api.put<unknown>(`/notifications/${notificationId}/read`);
    return normalizeNotification(raw);
  },

  markAllAsRead: async (): Promise<{ modifiedCount: number }> => {
    const raw = await api.put<RawMutateResponse>('/notifications/read-all');
    return { modifiedCount: raw?.modifiedCount ?? 0 };
  },

  deleteNotification: async (notificationId: string): Promise<void> => {
    await api.delete(`/notifications/${notificationId}`);
  },
};
