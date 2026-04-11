/**
 * Event Consumers - Export all consumers
 *
 * Note: initNotificationConsumer and initAnalyticsConsumer have moved to their
 * owning modules (notifications, analytics). Import them directly from there.
 */

export { initSLAMonitorConsumer } from './sla-monitor.consumer';
export { initWebSocketConsumer } from './websocket.consumer';
