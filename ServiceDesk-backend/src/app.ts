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
import { xssSanitizer } from './middleware/xssSanitizer';
import { correlationId } from './middleware/correlationId';
import { globalDeprecationMiddleware } from './api/v2/shared/middleware/deprecation.middleware';
import { csrfProtectionConditional } from './shared/middleware/csrf';
import { diMiddleware } from './infrastructure/di/middleware';
import { authenticate } from './middleware/auth';
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

// Rate limiting (disabled in development for hot reload)
if (env.NODE_ENV !== 'development') {
  app.use(`/api/${env.API_VERSION}`, apiLimiter);
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

// Database health check (for Kubernetes readiness probe)
app.get('/health/db', async (_req, res) => {
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

// Prometheus metrics endpoint
app.get('/metrics', async (_req, res) => {
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

// Cache statistics endpoint
app.get('/cache/stats', async (_req, res) => {
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

// API routes v1 (legacy)
import authRoutes from './routes/authRoutes';
import prepTaskRoutes from './routes/prepTaskRoutes';
import categoryRoutes from './routes/categoryRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import userRoutes from './routes/userRoutes';
import reportRoutes from './routes/reportRoutes';
import teamRoutes from './routes/teamRoutes';
import knowledgeRoutes from './routes/knowledgeRoutes';
import assetRoutes from './routes/assetRoutes';
import serviceRequestRoutes from './routes/serviceRequestRoutes';
import incidentRoutes from './presentation/routes/v2/incidentRoutes';
import problemRoutes from './presentation/routes/v2/problemRoutes';
import changeRoutes from './presentation/routes/v2/changeRoutes';
import slaRoutes from './presentation/routes/v2/slaRoutes';
import releaseRoutes from './presentation/routes/v2/releaseRoutes';
import serviceCatalogRoutes from './presentation/routes/v2/serviceCatalogRoutes';
import formTemplateRoutes from './routes/formTemplateRoutes';
import formSubmissionRoutes from './routes/formSubmissionRoutes';

// API routes v2 (ITSM) - Legacy
import v2LegacyRoutes from './presentation/routes/v2';

// API routes v2 (Domain-based architecture)
import v2DomainRoutes from './api/v2';

// Project Management routes
import pmRoutes from './routes/pm';

// File Storage routes
import fileStorageRoutes from './routes/fileStorage.routes';
import fileFolderRoutes from './routes/fileFolder.routes';

// Workflow Diagram routes
import workflowRoutes from './routes/workflow.routes';

// Leave Request routes
import leaveRequestRoutes from './routes/leaveRequest.routes';

// v1 routes (with deprecation headers)
app.use(`/api/${env.API_VERSION}`, globalDeprecationMiddleware);
app.use(`/api/${env.API_VERSION}/auth`, authRoutes);
app.use(`/api/${env.API_VERSION}/tasks`, prepTaskRoutes);
app.use(`/api/${env.API_VERSION}/categories`, categoryRoutes);
app.use(`/api/${env.API_VERSION}/inventory`, inventoryRoutes);
app.use(`/api/${env.API_VERSION}/users`, userRoutes);
app.use(`/api/${env.API_VERSION}/reports`, reportRoutes);
app.use(`/api/${env.API_VERSION}/teams`, teamRoutes);
app.use(`/api/${env.API_VERSION}/knowledge`, knowledgeRoutes);
app.use(`/api/${env.API_VERSION}/assets`, assetRoutes);
app.use(`/api/${env.API_VERSION}/service-requests`, serviceRequestRoutes);
app.use(`/api/${env.API_VERSION}/incidents`, incidentRoutes);
app.use(`/api/${env.API_VERSION}/problems`, problemRoutes);
app.use(`/api/${env.API_VERSION}/changes`, changeRoutes);
app.use(`/api/${env.API_VERSION}/slas`, slaRoutes);
app.use(`/api/${env.API_VERSION}/releases`, releaseRoutes);
app.use(`/api/${env.API_VERSION}/service-catalog`, serviceCatalogRoutes);

// v2 ITSM routes (legacy - keeping for backward compatibility)
app.use('/api/v2/itsm', v2LegacyRoutes);

// v2 Forms routes (exposed at /api/v2/forms) - require authentication
app.use('/api/v2/forms/templates', authenticate, formTemplateRoutes);
app.use('/api/v2/forms/submissions', authenticate, formSubmissionRoutes);

// v2 Domain-based API routes (new architecture)
app.use('/api/v2', v2DomainRoutes);

// Project Management routes (v1)
app.use(`/api/${env.API_VERSION}`, pmRoutes);

// File Storage routes (v1)
app.use(`/api/${env.API_VERSION}/files`, fileStorageRoutes);
app.use(`/api/${env.API_VERSION}/folders`, fileFolderRoutes);

// Workflow Diagram routes (v1)
app.use(`/api/${env.API_VERSION}/workflows`, workflowRoutes);

// Leave Request routes (v1)
app.use(`/api/${env.API_VERSION}/leave-requests`, leaveRequestRoutes);

// API Documentation
setupSwagger(app);

// 404 handler
app.use(notFound);

// Error handling
app.use(errorConverter);
app.use(errorHandler);

export default app;
