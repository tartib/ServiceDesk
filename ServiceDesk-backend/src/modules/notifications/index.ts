/**
 * Notifications Module — Entry Point
 *
 * Exports the Express router and the consumer bootstrap.
 */

export { default as notificationRoutes } from './routes';
export { initNotificationConsumer } from './consumers/notification.consumer';
export { NotificationsApiImpl } from './contracts';
export { notificationService } from './services/NotificationService';
export { notificationDispatcher } from './services/NotificationDispatcher';
