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
 task: { icon: CheckCircle, color: 'text-success', bgColor: 'bg-success-soft' },
 comment: { icon: MessageSquare, color: 'text-info', bgColor: 'bg-info-soft' },
 mention: { icon: User, color: 'text-brand', bgColor: 'bg-brand-soft' },
 assignment: { icon: User, color: 'text-info', bgColor: 'bg-info-soft' },
 deadline: { icon: AlertCircle, color: 'text-destructive', bgColor: 'bg-destructive-soft' },
 system: { icon: Bell, color: 'text-muted-foreground', bgColor: 'bg-muted' },
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
 <div className="flex flex-col h-full bg-muted/50">
 {/* Project Header */}
 <ProjectHeader 
 projectKey={project?.key} 
 projectName={project?.name}
 projectId={projectId}
 />

 {/* Navigation Tabs */}
 <ProjectNavTabs projectId={projectId} methodology={methodology || 'scrum'} />

 {/* Toolbar */}
 <div className="bg-background border-b border-border px-4 py-3">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4">
 <div className="flex items-center gap-2">
 <Bell className="h-5 w-5 text-brand" />
 <h2 className="text-lg font-semibold text-foreground">{t('notifications.title')}</h2>
 {unreadCount > 0 && (
 <span className="px-2 py-0.5 bg-destructive text-destructive-foreground text-xs font-medium rounded-full">
 {unreadCount}
 </span>
 )}
 </div>
 <div className="flex items-center bg-muted rounded-lg p-1">
 <button
 onClick={() => setFilter('all')}
 className={`px-3 py-1 text-sm rounded-md transition-colors ${
 filter === 'all' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
 }`}
 >
 {t('notifications.filterAll')}
 </button>
 <button
 onClick={() => setFilter('unread')}
 className={`px-3 py-1 text-sm rounded-md transition-colors ${
 filter === 'unread' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
 }`}
 >
 {t('notifications.filterUnread')}
 </button>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <button
 onClick={() => markAllAsRead()}
 className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted rounded-lg transition-colors"
 >
 <Check className="h-4 w-4" />
 {t('notifications.markAllRead')}
 </button>
 <button className="p-2 text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded-lg transition-colors">
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
 <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
 <p className="text-muted-foreground">{t('notifications.empty')}</p>
 </div>
 ) : (
 <div className="space-y-2">
 {filteredNotifications.map((notification: Notification) => {
 const config = typeConfig[notification.type] || typeConfig.system;
 const Icon = config.icon;

 return (
 <div
 key={notification.id}
 className={`bg-background border rounded-xl p-4 transition-all hover:shadow-md ${
 notification.isRead ? 'border-border' : 'border-brand-border bg-brand-surface'
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
 <h3 className={`text-sm ${notification.isRead ? 'text-foreground' : 'font-semibold text-foreground'}`}>
 {notification.title}
 </h3>
 <p className="text-sm text-muted-foreground mt-0.5">{notification.message}</p>
 </div>
 <div className="flex items-center gap-2 shrink-0">
 <span className="text-xs text-muted-foreground flex items-center gap-1">
 <Clock className="h-3 w-3" />
 {formatTime(notification.createdAt)}
 </span>
 </div>
 </div>

 {/* Actions */}
 <div className="flex items-center gap-2 mt-3">
 {notification.actionUrl && (
 <button className="text-sm text-brand hover:underline">
 {t('notifications.view')}
 </button>
 )}
 {!notification.isRead && (
 <button
 onClick={() => markAsRead(notification.id)}
 className="text-sm text-muted-foreground hover:text-foreground"
 >
 {t('notifications.markRead')}
 </button>
 )}
 <button
 onClick={() => deleteNotification(notification.id)}
 className="text-sm text-muted-foreground hover:text-destructive ml-auto"
 >
 <Trash2 className="h-4 w-4" />
 </button>
 </div>
 </div>

 {/* Unread indicator */}
 {!notification.isRead && (
 <div className="w-2 h-2 rounded-full bg-brand shrink-0 mt-2" />
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
