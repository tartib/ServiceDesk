import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import path from 'path';
import env from './config/env';
import { errorConverter, errorHandler, notFound } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import logger from './utils/logger';

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));

// Compression
app.use(compression());

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  }));
}

// Rate limiting
app.use(`/api/${env.API_VERSION}`, apiLimiter);

// Serve static files (uploaded images) - before helmet to avoid CORP issues
app.use('/uploads', (_req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(process.cwd(), 'uploads')));

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import prepTaskRoutes from './routes/prepTaskRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import categoryRoutes from './routes/categoryRoutes';
import userRoutes from './routes/userRoutes';
import reportRoutes from './routes/reportRoutes';

app.use(`/api/${env.API_VERSION}/auth`, authRoutes);
app.use(`/api/${env.API_VERSION}/products`, productRoutes);
app.use(`/api/${env.API_VERSION}/tasks`, prepTaskRoutes);
app.use(`/api/${env.API_VERSION}/inventory`, inventoryRoutes);
app.use(`/api/${env.API_VERSION}/categories`, categoryRoutes);
app.use(`/api/${env.API_VERSION}/users`, userRoutes);
app.use(`/api/${env.API_VERSION}/reports`, reportRoutes);
// app.use(`/api/${env.API_VERSION}/notifications`, notificationRoutes);
// app.use(`/api/${env.API_VERSION}/logs`, auditLogRoutes);

// 404 handler
app.use(notFound);

// Error handling
app.use(errorConverter);
app.use(errorHandler);

export default app;
