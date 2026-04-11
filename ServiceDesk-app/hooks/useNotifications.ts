import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationKeys, notificationApi } from '@/lib/domains/notifications';
import type { NotificationListParams } from '@/lib/domains/notifications';

export const useNotifications = (params?: NotificationListParams) => {
  return useQuery({
    queryKey: notificationKeys.list(params as Record<string, unknown>),
    queryFn: () => notificationApi.list(params),
  });
};

export const useNotificationsByProject = (projectId: string) => {
  return useQuery({
    queryKey: notificationKeys.byProject(projectId),
    queryFn: () => notificationApi.list({ projectId }),
    enabled: !!projectId,
  });
};

export const useUnreadNotifications = () => {
  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: () => notificationApi.unread(),
  });
};

export const useUnreadCount = () => {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationApi.unreadCount(),
    refetchInterval: 30_000,
  });
};

export const useCriticalNotifications = () => {
  return useQuery({
    queryKey: notificationKeys.critical(),
    queryFn: () => notificationApi.critical(),
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationApi.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationApi.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};
