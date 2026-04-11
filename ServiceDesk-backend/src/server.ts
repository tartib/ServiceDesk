import app from './app';
import env from './config/env';
import connectDB from './config/database';
import logger from './utils/logger';
import { createServer, Server } from 'http';
import { startAllJobs } from './jobs/taskScheduler';
import { initializeSocket } from './config/socket';
import { startWorkflowTimerJob, stopWorkflowTimerJob } from './jobs/workflowTimerJob';
import { eventBus } from './shared/events/event-bus';
import { initNotificationConsumer } from './modules/notifications/consumers/notification.consumer';
import { initAnalyticsConsumer } from './modules/analytics/consumers/analytics.consumer';
import { initSLAMonitorConsumer } from './shared/events/consumers/sla-monitor.consumer';
import { initSlaConsumer } from './modules/sla/consumers/sla.consumer';
import { startSlaSchedulerJob, stopSlaSchedulerJob } from './modules/sla/jobs/slaSchedulerJob';
import { initGamificationConsumer } from './modules/gamification/consumers/gamification.consumer';
import { startGamificationJobs, stopGamificationJobs } from './modules/gamification/jobs/gamificationJobs';
import { initIntegrations, shutdownIntegrations } from './integrations';
import FeatureFlagService from './shared/feature-flags/FeatureFlagService';
import { isPostgresRequired, connectPostgres, disconnectPostgres } from './shared/database';

// Create HTTP server
const httpServer: Server = createServer(app);
const server = httpServer;

// Initialize WebSocket
initializeSocket(httpServer);

// Boot sequence: connect DBs first, then listen
(async () => {
  // Connect to MongoDB (must complete before accepting requests)
  await connectDB();

  // Connect to PostgreSQL (only if any module strategy requires it)
  if (isPostgresRequired()) {
    if (!env.POSTGRES_URL) {
      logger.error('POSTGRES_URL is required when a module uses postgresql strategy');
      process.exit(1);
    }
    await connectPostgres(env.POSTGRES_URL).catch((err) => {
      logger.error('Failed to connect to PostgreSQL', { error: err });
      process.exit(1);
    });
  }

  httpServer.listen(env.PORT, async () => {
    logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    logger.info(`📡 API available at http://localhost:${env.PORT}/api/${env.API_VERSION}`);
    logger.info(`🔌 WebSocket server ready`);

    // Initialize feature flags (seeds defaults into DB)
    await FeatureFlagService.getInstance().initialize();

    // Start background jobs
    startAllJobs();

    // Start workflow timer job (every 60 seconds)
    startWorkflowTimerJob(60_000);
    logger.info('⏱️ Workflow timer job started');

    // Connect event bus (Kafka / Redpanda or in-memory fallback)
    try {
      await eventBus.connect();
      // Initialize event consumers after bus is connected
      await initNotificationConsumer();
      await initAnalyticsConsumer();
      await initSLAMonitorConsumer();
      await initSlaConsumer();
      await initGamificationConsumer();
      logger.info('📨 Event bus and consumers initialized');

      // Start SLA scheduler job (every 30 seconds)
      startSlaSchedulerJob(30_000);
      logger.info('⏱️ SLA scheduler job started');

      // Start gamification jobs (streak break check every 60s, reminders every 5min)
      startGamificationJobs(60_000, 300_000);
      logger.info('🎮 Gamification jobs started');

      // Initialize integration adapters (after event bus is ready)
      await initIntegrations();
    } catch (error) {
      logger.error('Failed to initialize event bus', { error });
      // Non-fatal — server continues without event bus
    }
  });
})();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
  stopWorkflowTimerJob();
  stopSlaSchedulerJob();
  stopGamificationJobs();
  await shutdownIntegrations();
  await eventBus.disconnect();
  await disconnectPostgres();
  server.close(() => {
    logger.info('💥 Process terminated!');
  });
});

export default server;
