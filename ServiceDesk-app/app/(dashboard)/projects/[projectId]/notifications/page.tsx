'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Bell,
  CheckCircle,
  MessageSquare,
  AlertCircle,
  User,
  Settings,
  Trash2,
  Check,
  Clock,
} from 'lucide-react';
import {
  ProjectHeader,
  ProjectNavTabs,
  LoadingState,
} from '@/components/projects';
import { useMethodology } from '@/hooks/useMethodology';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import {
  useNotificationsByProject,
  useMarkNotificationAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from '@/hooks/useNotifications';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Notification } from '@/types';

const typeConfig: Record<string, { icon: typeof Bell; color: string; bgColor: string }> = {
  task: { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-100' },
  comment: { icon: MessageSquare, color: 'text-purple-500', bgColor: 'bg-purple-100' },
  mention: { icon: User, color: 'text-blue-500', bgColor: 'bg-blue-100' },
  assignment: { icon: User, color: 'text-indigo-500', bgColor: 'bg-indigo-100' },
  deadline: { icon: AlertCircle, color: 'text-red-500', bgColor: 'bg-red-100' },
  system: { icon: Bell, color: 'text-gray-500', bgColor: 'bg-gray-100' },
};

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (hours < 48) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function NotificationsPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const { t } = useLanguage();
  
  const { methodology } = useMethodology(projectId);
  const { data: project } = useQuery({
    queryKey: ['pm', 'projects', projectId],
    queryFn: async () => {
      const res = await api.get<{ project?: { _id: string; name: string; key: string } }>(`/pm/projects/${projectId}`);
      return res?.project ?? null;
    },
    enabled: !!projectId,
  });
  const { data: notifData, isLoading } = useNotificationsByProject(projectId);
  const { mutate: markAsRead } = useMarkNotificationAsRead();
  const { mutate: markAllAsRead } = useMarkAllAsRead();
  const { mutate: deleteNotification } = useDeleteNotification();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const notifications = notifData?.notifications ?? [];
  const filteredNotifications = filter === 'unread' 
    ? notifications.filter((n: Notification) => !n.isRead)
    : notifications;
  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Project Header */}
      <ProjectHeader 
        projectKey={project?.key} 
        projectName={project?.name}
        projectId={projectId}
      />

      {/* Navigation Tabs */}
      <ProjectNavTabs projectId={projectId} methodology={methodology || 'scrum'} />

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">{t('notifications.title')}</h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  filter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                {t('notifications.filterAll')}
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  filter === 'unread' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                {t('notifications.filterUnread')}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => markAllAsRead()}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Check className="h-4 w-4" />
              {t('notifications.markAllRead')}
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-4">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">{t('notifications.empty')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredNotifications.map((notification: Notification) => {
                const config = typeConfig[notification.type] || typeConfig.system;
                const Icon = config.icon;

                return (
                  <div
                    key={notification.id}
                    className={`bg-white border rounded-xl p-4 transition-all hover:shadow-md ${
                      notification.isRead ? 'border-gray-200' : 'border-blue-200 bg-blue-50/30'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center shrink-0`}>
                        <Icon className={`h-5 w-5 ${config.color}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className={`text-sm ${notification.isRead ? 'text-gray-900' : 'font-semibold text-gray-900'}`}>
                              {notification.title}
                            </h3>
                            <p className="text-sm text-gray-600 mt-0.5">{notification.message}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(notification.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-3">
                          {notification.actionUrl && (
                            <button className="text-sm text-blue-600 hover:underline">
                              {t('notifications.view')}
                            </button>
                          )}
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-sm text-gray-500 hover:text-gray-700"
                            >
                              {t('notifications.markRead')}
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-sm text-gray-400 hover:text-red-600 ml-auto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Unread indicator */}
                      {!notification.isRead && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
