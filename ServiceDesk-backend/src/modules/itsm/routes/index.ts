import { Router } from 'express';
import { body, param } from 'express-validator';
import * as itsmController from '../controllers';
import { itsmAuthorize, requireItsmRole } from '../../../middleware/itsmAuthorize';
import { RESOURCES } from '../../../shared/auth/permission.types';

// Sub-routers for ITSM v2 domains (migrated from presentation/)
import incidentRoutes from './incident.routes';
import changeRoutes from './change.routes';
import problemRoutes from './problem.routes';
import pirRoutes from './pir.routes';
import releaseRoutes from './release.routes';
import itsmDashboardRoutes from './itsmDashboard.routes';
import knowledgeDeflectionRoutes from './knowledgeDeflection.routes';
import knowledgeRoutes from './knowledge.routes';

const router = Router();

// ── ITSM v2 Domain Routes (migrated from presentation/routes/v2) ──
router.use('/incidents', incidentRoutes);
router.use('/changes', changeRoutes);
router.use('/problems', problemRoutes);
router.use('/pirs', pirRoutes);
router.use('/releases', releaseRoutes);
router.use('/itsm-dashboard', itsmDashboardRoutes);
router.use('/knowledge/deflect', knowledgeDeflectionRoutes);
router.use('/knowledge', knowledgeRoutes);

// ============================================================
// CMDB Routes
// ============================================================

// GET /api/v2/itsm/cmdb/stats - Get CMDB statistics
router.get('/cmdb/stats', itsmAuthorize(RESOURCES.CMDB, 'read'), itsmController.getCMDBStats);

// GET /api/v2/itsm/cmdb/types - Get CI types with counts
router.get('/cmdb/types', itsmAuthorize(RESOURCES.CMDB, 'read'), itsmController.getCITypes);

// GET /api/v2/itsm/cmdb/items - List configuration items
router.get('/cmdb/items', itsmAuthorize(RESOURCES.CMDB, 'read'), itsmController.getConfigItems);

// GET /api/v2/itsm/cmdb/items/:id - Get single configuration item
router.get('/cmdb/items/:id', itsmAuthorize(RESOURCES.CMDB, 'read'), itsmController.getConfigItem);

// POST /api/v2/itsm/cmdb/items - Create configuration item
router.post(
  '/cmdb/items',
  itsmAuthorize(RESOURCES.CMDB, 'create'),
  [
    body('name').notEmpty().withMessage('CI name is required'),
    body('ciType').notEmpty().withMessage('CI type is required'),
    body('category').notEmpty().withMessage('Category is required'),
  ],
  itsmController.createConfigItem
);

// PUT /api/v2/itsm/cmdb/items/:id - Update configuration item
router.put('/cmdb/items/:id', itsmAuthorize(RESOURCES.CMDB, 'update'), itsmController.updateConfigItem);

// DELETE /api/v2/itsm/cmdb/items/:id - Delete (retire) configuration item
router.delete('/cmdb/items/:id', itsmAuthorize(RESOURCES.CMDB, 'delete'), itsmController.deleteConfigItem);

// GET /api/v2/itsm/cmdb/items/:id/relationships - Get CI relationships
router.get('/cmdb/items/:id/relationships', itsmAuthorize(RESOURCES.CMDB, 'read'), itsmController.getRelationships);

// GET /api/v2/itsm/cmdb/items/:id/impact - Impact analysis
router.get('/cmdb/items/:id/impact', itsmAuthorize(RESOURCES.CMDB, 'read'), itsmController.getImpactAnalysis);

// POST /api/v2/itsm/cmdb/relationships - Create relationship
router.post(
  '/cmdb/relationships',
  itsmAuthorize(RESOURCES.CMDB, 'create'),
  [
    body('sourceId').notEmpty().withMessage('Source CI ID is required'),
    body('targetId').notEmpty().withMessage('Target CI ID is required'),
    body('relationshipType').notEmpty().withMessage('Relationship type is required'),
  ],
  itsmController.createRelationship
);

// DELETE /api/v2/itsm/cmdb/relationships/:id - Delete relationship
router.delete('/cmdb/relationships/:id', itsmAuthorize(RESOURCES.CMDB, 'delete'), itsmController.deleteRelationship);

// ============================================================
// Automation Rules Routes (admin/manager only)
// ============================================================

// GET /api/v2/itsm/automation/stats - Get automation statistics
router.get('/automation/stats', itsmAuthorize(RESOURCES.AUTOMATION_RULE, 'read'), itsmController.getAutomationStats);

// GET /api/v2/itsm/automation/templates - List rule templates
router.get('/automation/templates', itsmAuthorize(RESOURCES.AUTOMATION_RULE, 'read'), itsmController.getTemplates);

// GET /api/v2/itsm/automation/rules - List automation rules
router.get('/automation/rules', itsmAuthorize(RESOURCES.AUTOMATION_RULE, 'read'), itsmController.getRules);

// GET /api/v2/itsm/automation/rules/:id - Get single rule
router.get('/automation/rules/:id', itsmAuthorize(RESOURCES.AUTOMATION_RULE, 'read'), itsmController.getRule);

// POST /api/v2/itsm/automation/rules - Create automation rule
router.post(
  '/automation/rules',
  itsmAuthorize(RESOURCES.AUTOMATION_RULE, 'create'),
  [
    body('name').notEmpty().withMessage('Rule name is required'),
    body('trigger').isObject().withMessage('Trigger configuration is required'),
    body('trigger.type').notEmpty().withMessage('Trigger type is required'),
  ],
  itsmController.createRule
);

// PUT /api/v2/itsm/automation/rules/:id - Update automation rule
router.put('/automation/rules/:id', itsmAuthorize(RESOURCES.AUTOMATION_RULE, 'update'), itsmController.updateRule);

// DELETE /api/v2/itsm/automation/rules/:id - Delete (deprecate) rule
router.delete('/automation/rules/:id', itsmAuthorize(RESOURCES.AUTOMATION_RULE, 'delete'), itsmController.deleteRule);

// POST /api/v2/itsm/automation/rules/:id/activate - Activate rule
router.post('/automation/rules/:id/activate', itsmAuthorize(RESOURCES.AUTOMATION_RULE, 'update'), itsmController.activateRule);

// POST /api/v2/itsm/automation/rules/:id/deactivate - Deactivate rule
router.post('/automation/rules/:id/deactivate', itsmAuthorize(RESOURCES.AUTOMATION_RULE, 'update'), itsmController.deactivateRule);

// GET /api/v2/itsm/automation/rules/:id/logs - Get rule execution logs
router.get('/automation/rules/:id/logs', itsmAuthorize(RESOURCES.AUTOMATION_RULE, 'read'), itsmController.getRuleLogs);

// POST /api/v2/itsm/automation/rules/from-template/:templateId - Create rule from template
router.post('/automation/rules/from-template/:templateId', itsmAuthorize(RESOURCES.AUTOMATION_RULE, 'create'), itsmController.createRuleFromTemplate);

// ============================================================
// Service Catalog Routes
// ============================================================

// GET /api/v2/itsm/services - List all services (all roles can browse)
router.get('/services', itsmAuthorize(RESOURCES.CATALOG, 'read'), itsmController.getServices);

// GET /api/v2/itsm/services/featured - Get featured services
router.get('/services/featured', itsmAuthorize(RESOURCES.CATALOG, 'read'), itsmController.getFeaturedServices);

// GET /api/v2/itsm/services/categories - Get all categories with counts
router.get('/services/categories', itsmAuthorize(RESOURCES.CATALOG, 'read'), itsmController.getCategories);

// GET /api/v2/itsm/services/:id - Get single service
router.get('/services/:id', itsmAuthorize(RESOURCES.CATALOG, 'read'), itsmController.getService);

// POST /api/v2/itsm/services - Create new service (service_owner only)
router.post(
  '/services',
  itsmAuthorize(RESOURCES.CATALOG, 'create'),
  [
    body('name').notEmpty().withMessage('Service name is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('category').notEmpty().withMessage('Category is required'),
  ],
  itsmController.createService
);

// PUT /api/v2/itsm/services/:id - Update service (service_owner only)
router.put('/services/:id', itsmAuthorize(RESOURCES.CATALOG, 'update'), itsmController.updateService);

// DELETE /api/v2/itsm/services/:id - Delete service (service_owner only)
router.delete('/services/:id', itsmAuthorize(RESOURCES.CATALOG, 'delete'), itsmController.deleteService);

// ============================================================
// Service Request Routes
// ============================================================

// POST /api/v2/itsm/requests - Submit new service request (all roles can submit)
router.post(
  '/requests',
  itsmAuthorize(RESOURCES.SERVICE_REQUEST, 'create'),
  [
    body('serviceId').notEmpty().withMessage('Service ID is required'),
    body('formData').isObject().withMessage('Form data is required'),
  ],
  itsmController.createRequest
);

// GET /api/v2/itsm/requests - List service requests (scoped by role)
router.get('/requests', itsmAuthorize(RESOURCES.SERVICE_REQUEST, 'read'), itsmController.getRequests);

// GET /api/v2/itsm/requests/:id - Get single request
router.get('/requests/:id', itsmAuthorize(RESOURCES.SERVICE_REQUEST, 'read'), itsmController.getRequest);

// POST /api/v2/itsm/requests/:id/approve - Approve request (analyst+ only)
router.post(
  '/requests/:id/approve',
  itsmAuthorize(RESOURCES.SERVICE_REQUEST, 'transition'),
  itsmController.approveRequest
);

// POST /api/v2/itsm/requests/:id/reject - Reject request (analyst+ only)
router.post(
  '/requests/:id/reject',
  itsmAuthorize(RESOURCES.SERVICE_REQUEST, 'transition'),
  itsmController.rejectRequest
);

// POST /api/v2/itsm/requests/:id/cancel - Cancel request
router.post(
  '/requests/:id/cancel',
  itsmAuthorize(RESOURCES.SERVICE_REQUEST, 'transition'),
  itsmController.cancelRequest
);

// POST /api/v2/itsm/requests/:id/assign - Assign request (analyst+ only)
router.post(
  '/requests/:id/assign',
  itsmAuthorize(RESOURCES.SERVICE_REQUEST, 'assign'),
  itsmController.assignRequest
);

// POST /api/v2/itsm/requests/:id/comments - Add comment (any authenticated)
router.post(
  '/requests/:id/comments',
  itsmAuthorize(RESOURCES.SERVICE_REQUEST, 'read'),
  [body('message').notEmpty().withMessage('Comment message is required')],
  itsmController.addComment
);

export default router;
