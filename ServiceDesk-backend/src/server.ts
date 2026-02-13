import app from './app';
import env from './config/env';
import connectDB from './config/database';
import logger from './utils/logger';
import { createServer, Server } from 'http';
import { startAllJobs } from './jobs/taskScheduler';
import { initializeSocket } from './config/socket';

// Connect to database
connectDB();

// Create HTTP server
const httpServer: Server = createServer(app);

// Initialize WebSocket
initializeSocket(httpServer);

// Start server
httpServer.listen(env.PORT, () => {
  logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  logger.info(`📡 API available at http://localhost:${env.PORT}/api/${env.API_VERSION}`);
  logger.info(`🔌 WebSocket server ready`);
  
  // Start background jobs
  startAllJobs();
});

const server = httpServer;

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
