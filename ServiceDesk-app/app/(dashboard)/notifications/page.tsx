'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNotifications, useMarkNotificationAsRead, useMarkAllAsRead, useDeleteNotification } from '@/hooks/useNotifications';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

export default function NotificationsPage() {
 const { data: notificationsData, isLoading } = useNotifications();
 const { mutate: markAsRead } = useMarkNotificationAsRead();
 const { mutate: markAllAsRead } = useMarkAllAsRead();
 const { mutate: deleteNotification } = useDeleteNotification();
 const { t } = useLanguage();

 const notifications = notificationsData?.notifications || [];

 const unreadNotifications = notifications.filter((n) => !n.isRead);
 const readNotifications = notifications.filter((n) => n.isRead);

 return (
 <DashboardLayout>
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-3xl font-bold">{t('notifications.title')}</h1>
 <p className="text-muted-foreground mt-1">
 {unreadNotifications.length} {t('notifications.unreadCount')}
 </p>
 </div>
 {unreadNotifications.length > 0 && (
 <Button onClick={() => markAllAsRead()} variant="outline">
 <CheckCheck className="h-4 w-4 mr-2" />
 {t('notifications.markAllRead')}
 </Button>
 )}
 </div>

 {isLoading ? (
 <Card>
 <CardContent className="py-12">
 <div className="text-center">
 <div className="animate-spin h-8 w-8 border-2 border-brand border-t-transparent rounded-full mx-auto mb-4"></div>
 <p className="text-muted-foreground">{t('notifications.loading')}</p>
 </div>
 </CardContent>
 </Card>
 ) : notifications.length === 0 ? (
 <Card>
 <CardContent className="py-12">
 <div className="text-center">
 <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
 <p className="text-muted-foreground text-lg">{t('notifications.empty')}</p>
 <p className="text-sm text-muted-foreground mt-1">
 {t('notifications.emptyHint')}
 </p>
 </div>
 </CardContent>
 </Card>
 ) : (
 <div className="space-y-6">
 {unreadNotifications.length > 0 && (
 <div>
 <h2 className="text-lg font-semibold mb-3">{t('notifications.filterUnread')}</h2>
 <div className="space-y-2">
 {unreadNotifications.map((notification) => (
 <Card key={notification.id}
 className="hover:shadow-md transition-shadow cursor-pointer bg-brand-surface"
 onClick={() => notification.id && markAsRead(notification.id)}
 >
 <CardContent className="p-4">
 <div className="flex items-start justify-between">
 <div className="flex-1">
 <div className="flex items-center gap-2 mb-1">
 <h3 className="font-semibold">{notification.title}</h3>
 <Badge variant="secondary" className="text-xs">
 {notification.type.replace('_', ' ')}
 </Badge>
 </div>
 <p className="text-sm text-muted-foreground">{notification.message}</p>
 <p className="text-xs text-muted-foreground mt-2">
 {formatTimeAgo(notification.createdAt)}
 </p>
 </div>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 </div>
 )}

 {readNotifications.length > 0 && (
 <div>
 <h2 className="text-lg font-semibold mb-3">{t('notifications.read')}</h2>
 <div className="space-y-2">
 {readNotifications.map((notification) => (
 <Card key={notification.id}
 className="hover:shadow-sm transition-shadow opacity-75"
 >
 <CardContent className="p-4">
 <div className="flex items-start justify-between gap-2">
 <div className="flex-1">
 <div className="flex items-center gap-2 mb-1">
 <h3 className="font-medium">{notification.title}</h3>
 <Badge variant="outline" className="text-xs">
 {notification.type.replace('_', ' ')}
 </Badge>
 </div>
 <p className="text-sm text-muted-foreground">{notification.message}</p>
 <p className="text-xs text-muted-foreground mt-2">
 {formatTimeAgo(notification.createdAt)}
 </p>
 </div>
 <Button
 variant="ghost"
 size="icon"
 className="shrink-0 text-muted-foreground hover:text-destructive"
 onClick={(e) => {
 e.stopPropagation();
 if (notification.id) deleteNotification(notification.id);
 }}
 >
 <Trash2 className="h-4 w-4" />
 </Button>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 </div>
 )}
 </div>
 )}
 </div>
 </DashboardLayout>
 );
}
