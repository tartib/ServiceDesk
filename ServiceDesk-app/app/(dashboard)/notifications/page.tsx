'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNotificationStore } from '@/store/notificationStore';
import { Bell, CheckCheck } from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead } = useNotificationStore();

  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const readNotifications = notifications.filter((n) => n.isRead);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-gray-500 mt-1">
              {unreadNotifications.length} unread notification{unreadNotifications.length !== 1 ? 's' : ''}
            </p>
          </div>
          {unreadNotifications.length > 0 && (
            <Button onClick={markAllAsRead} variant="outline">
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All as Read
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No notifications yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  You&apos;ll see task reminders, alerts, and updates here
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {unreadNotifications.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Unread</h2>
                <div className="space-y-2">
                  {unreadNotifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className="hover:shadow-md transition-shadow cursor-pointer bg-blue-50"
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
                            <p className="text-sm text-gray-600">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-2">
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
                <h2 className="text-lg font-semibold mb-3">Read</h2>
                <div className="space-y-2">
                  {readNotifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className="hover:shadow-sm transition-shadow opacity-75"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium">{notification.title}</h3>
                              <Badge variant="outline" className="text-xs">
                                {notification.type.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-2">
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
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
