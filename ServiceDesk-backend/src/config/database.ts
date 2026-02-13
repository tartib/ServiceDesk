import mongoose from 'mongoose';
import logger from '../utils/logger';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/prep_manager';

    const options = {
      // Connection pooling
      maxPoolSize: 10,
      minPoolSize: 5,
      
      // Timeouts
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      
      // Retry strategy
      retryWrites: true,
      retryReads: true,
      
      // Connection monitoring
      heartbeatFrequencyMS: 10000,
      
      // Automatic reconnection
      autoIndex: true,
    };

    await mongoose.connect(mongoURI, options);

    logger.info(`✅ MongoDB Connected: ${mongoose.connection.host}`);
    logger.info(`📊 Connection pool size: ${options.maxPoolSize}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected successfully');
    });

    mongoose.connection.on('fullsetup', () => {
      logger.info('MongoDB replica set fully initialized');
    });

  } catch (error) {
    logger.error(`❌ MongoDB connection failed: ${error}`);
    // Don't exit immediately - allow graceful degradation
    setTimeout(() => {
      logger.error('Failed to connect to MongoDB after timeout. Exiting...');
      process.exit(1);
    }, 30000);
  }
};

/**
 * Health check for database connectivity
 * Used by Kubernetes readiness probes
 */
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return false;
    }
    
    // Perform a simple ping
    await mongoose.connection.db?.admin().ping();
    return true;
  } catch (error) {
    logger.error(`Database health check failed: ${error}`);
    return false;
  }
};

export default connectDB;
