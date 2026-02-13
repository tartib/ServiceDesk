import { Router } from 'express';
import incidentRoutes from './incidentRoutes';
import problemRoutes from './problemRoutes';
import changeRoutes from './changeRoutes';
import slaRoutes from './slaRoutes';
import releaseRoutes from './releaseRoutes';
import serviceCatalogRoutes from './serviceCatalogRoutes';
import formTemplateRoutes from '../../../routes/formTemplateRoutes';
import formSubmissionRoutes from '../../../routes/formSubmissionRoutes';

const router = Router();

// API v2 Routes
router.use('/incidents', incidentRoutes);
router.use('/problems', problemRoutes);
router.use('/changes', changeRoutes);
router.use('/slas', slaRoutes);
router.use('/releases', releaseRoutes);
router.use('/service-catalog', serviceCatalogRoutes);

// Smart Forms routes
router.use('/forms/templates', formTemplateRoutes);
router.use('/forms/submissions', formSubmissionRoutes);

// Health check for v2
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    version: 'v2',
    timestamp: new Date().toISOString(),
    modules: ['incidents', 'problems', 'changes', 'slas', 'releases', 'service-catalog', 'forms'],
  });
});

export default router;
