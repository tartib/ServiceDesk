'use client';

import { API_URL } from '@/lib/api/config';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

interface Notification {
  id: string;
  type: 'task' | 'comment' | 'mention' | 'assignment' | 'deadline' | 'system';
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  actionUrl?: string;
}

interface Project {
  _id: string;
  name: string;
  key: string;
}

interface BackendNotification {
  _id: string;
  type: Notification['type'];
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

const mapNotification = (n: BackendNotification): Notification => ({
  id: n._id,
  type: n.type || 'system',
  title: n.title,
  message: n.message,
  read: n.read,
  timestamp: n.createdAt,
  actionUrl: n.actionUrl,
});

const typeConfig = {
  task: { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-100' },
  comment: { icon: MessageSquare, color: 'text-purple-500', bgColor: 'bg-purple-100' },
  mention: { icon: User, color: 'text-blue-500', bgColor: 'bg-blue-100' },
  assignment: { icon: User, color: 'text-indigo-500', bgColor: 'bg-indigo-100' },
  deadline: { icon: AlertCircle, color: 'text-red-500', bgColor: 'bg-red-100' },
  system: { icon: Bell, color: 'text-gray-500', bgColor: 'bg-gray-100' },
};

export default function NotificationsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  
  const { methodology } = useMethodology(projectId);

  const [project, setProject] = useState<Project | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const getToken = () => localStorage.getItem('token') || localStorage.getItem('accessToken');

  const fetchData = useCallback(async (token: string) => {
    try {
      const [projRes, notifRes] = await Promise.all([
        fetch(`${API_URL}/pm/projects/${projectId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/pm/projects/${projectId}/notifications`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const projData = await projRes.json();
      if (projData.success) setProject(projData.data.project);
      const notifData = await notifRes.json();
      if (notifData.success) setNotifications((notifData.data.notifications || []).map(mapNotification));
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push('/login'); return; }
    fetchData(token);
  }, [projectId, router, fetchData]);

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

  const handleMarkAsRead = async (id: string) => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/pm/notifications/${id}/read`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) { console.error('Failed to mark as read:', error); }
  };

  const handleMarkAllAsRead = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/pm/projects/${projectId}/notifications/read-all`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) { console.error('Failed to mark all as read:', error); }
  };

  const handleDelete = async (id: string) => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/pm/notifications/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) { console.error('Failed to delete notification:', error); }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

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
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
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
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  filter === 'unread' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                Unread
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Check className="h-4 w-4" />
              Mark all as read
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
              <p className="text-gray-500">No notifications</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredNotifications.map((notification) => {
                const config = typeConfig[notification.type];
                const Icon = config.icon;

                return (
                  <div
                    key={notification.id}
                    className={`bg-white border rounded-xl p-4 transition-all hover:shadow-md ${
                      notification.read ? 'border-gray-200' : 'border-blue-200 bg-blue-50/30'
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
                            <h3 className={`text-sm ${notification.read ? 'text-gray-900' : 'font-semibold text-gray-900'}`}>
                              {notification.title}
                            </h3>
                            <p className="text-sm text-gray-600 mt-0.5">{notification.message}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(notification.timestamp)}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-3">
                          {notification.actionUrl && (
                            <button className="text-sm text-blue-600 hover:underline">
                              View
                            </button>
                          )}
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="text-sm text-gray-500 hover:text-gray-700"
                            >
                              Mark as read
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(notification.id)}
                            className="text-sm text-gray-400 hover:text-red-600 ml-auto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Unread indicator */}
                      {!notification.read && (
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
