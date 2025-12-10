import app from './app';
import env from './config/env';
import connectDB from './config/database';
import logger from './utils/logger';
import { Server } from 'http';
import { startAllJobs } from './jobs/taskScheduler';

// Connect to database
connectDB();

// Start server
const server: Server = app.listen(env.PORT, () => {
  logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  logger.info(`📡 API available at http://localhost:${env.PORT}/api/${env.API_VERSION}`);
  
  // Start background jobs
  startAllJobs();
});

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
process.on('SIGTERM', () => {
  logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    logger.info('💥 Process terminated!');
  });
});

export default server;
