import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Notification, ApiResponse } from '@/types';

export const useNotifications = (isRead?: boolean) => {
  return useQuery({
    queryKey: ['notifications', isRead],
    queryFn: async () => {
      const params = isRead !== undefined ? `?isRead=${isRead}` : '';
      const response: ApiResponse<Notification[]> = await api.get(`/notifications${params}`);
      return {
        data: response.data || [],
        count: response.count || 0,
        unreadCount: response.unreadCount || 0,
      };
    },
  });
};

export const useUnreadNotifications = () => {
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => {
      const response: ApiResponse<Notification[]> = await api.get('/notifications/unread');
      return response.data || [];
    },
  });
};

export const useCriticalNotifications = () => {
  return useQuery({
    queryKey: ['notifications', 'critical'],
    queryFn: async () => {
      const response: ApiResponse<Notification[]> = await api.get('/notifications/critical');
      return response.data || [];
    },
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response: ApiResponse<Notification> = await api.put(
        `/notifications/${notificationId}/read`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response: ApiResponse<{ modifiedCount: number }> = await api.put(
        '/notifications/read-all'
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
