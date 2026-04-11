import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import path from 'path';
import env from './config/env';
import { errorConverter, errorHandler, notFound } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { authenticate, authorize } from './middleware/auth';
import { xssSanitizer } from './middleware/xssSanitizer';
import { correlationId } from './middleware/correlationId';
import { csrfProtectionConditional } from './shared/middleware/csrf';
import { diMiddleware } from './infrastructure/di/middleware';
import logger from './utils/logger';
import { setupSwagger } from './config/swagger';

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(cors({ 
  origin: (origin, callback) => {
    const allowedOrigins = [env.CORS_ORIGIN, 'http://localhost:3000'];
    // Allow requests with no origin (mobile apps, curl, etc.) or matching origins
    // In development, also allow any local network origin on port 3000
    if (!origin || allowedOrigins.includes(origin) || 
        (env.NODE_ENV === 'development' && origin.endsWith(':3000'))) {
      callback(null, origin || true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }, 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Organization-ID', 'X-CSRF-Token'],
  exposedHeaders: ['Content-Disposition', 'Content-Type', 'X-CSRF-Token'],
  maxAge: 86400,
}));

// Compression
app.use(compression());

// Cookie parser
app.use(cookieParser());

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// XSS Sanitization
app.use(xssSanitizer);

// Correlation ID for request tracing
app.use(correlationId);

// Dependency Injection
app.use(diMiddleware);

// Logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  }));
}

// Rate limiting — covers both /api/v1 and /api/v2 (disabled in development for hot reload)
if (env.NODE_ENV !== 'development') {
  app.use('/api', apiLimiter);
}

// CSRF Protection (conditional - skipped for API tokens, required for form submissions)
app.use(csrfProtectionConditional);

// Serve static files (uploaded images) - before helmet to avoid CORP issues
app.use('/uploads', (_req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(process.cwd(), 'uploads')));

// Root route - API information
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'ServiceDesk API',
    version: '1.0.0',
    environment: env.NODE_ENV,
    endpoints: {
      health: '/health',
      healthDb: '/health/db',
      metrics: '/metrics',
      cacheStats: '/cache/stats',
      api: `/api/${env.API_VERSION}`,
      documentation: `/api/docs`,
    },
    timestamp: new Date().toISOString(),
  });
});

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Database health check (for Kubernetes readiness probe — admin only)
app.get('/health/db', authenticate, authorize('admin'), async (_req, res) => {
  try {
    const { checkDatabaseHealth } = await import('./config/database');
    const isHealthy = await checkDatabaseHealth();
    
    if (isHealthy) {
      res.status(200).json({
        success: true,
        message: 'Database is healthy',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        success: false,
        message: 'Database is not responding',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Database health check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// Prometheus metrics endpoint (admin only)
app.get('/metrics', authenticate, authorize('admin'), async (_req, res) => {
  try {
    const { getPrometheusMetrics } = await import('./utils/metrics');
    const metrics = getPrometheusMetrics();
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(metrics);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve metrics',
      timestamp: new Date().toISOString(),
    });
  }
});

// Cache statistics endpoint (admin only)
app.get('/cache/stats', authenticate, authorize('admin'), async (_req, res) => {
  try {
    const { getCacheStats } = await import('./middleware/caching');
    const stats = getCacheStats();
    res.status(200).json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cache statistics',
      timestamp: new Date().toISOString(),
    });
  }
});

// Module registry (ITSM, PM, Workflow Engine, Core, Ops, Analytics, etc.)
import { registerModules } from './modules';

// v1 catch-all blocker — returns 410 Gone for any legacy v1 endpoint
import { v1BlockMiddleware } from './shared/middleware/v1-block.middleware';

// ── Catch-all: block any v1 endpoint with 410 Gone ──
app.use('/api/v1', v1BlockMiddleware);

// ── Domain Modules ──
registerModules(app);

// Feature Flags admin routes
import featureFlagRoutes from './shared/feature-flags/featureFlag.routes';
app.use('/api/v2/admin/feature-flags', featureFlagRoutes);

// Integration routes (webhooks from external systems — no auth, adapters verify signatures)
import integrationRoutes from './integrations/integration.routes';
app.use('/api/v2/integrations', integrationRoutes);

// Event Bus health endpoint (admin only)
app.get('/api/v2/events/health', authenticate, authorize('admin'), async (_req, res) => {
  try {
    const { eventBus } = await import('./shared/events/event-bus');
    const status = eventBus.getStatus();
    res.status(status.connected ? 200 : 503).json({
      success: status.connected,
      data: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve event bus status',
      timestamp: new Date().toISOString(),
    });
  }
});

// API Documentation
setupSwagger(app);

// 404 handler
app.use(notFound);

// Error handling
app.use(errorConverter);
app.use(errorHandler);

export default app;
