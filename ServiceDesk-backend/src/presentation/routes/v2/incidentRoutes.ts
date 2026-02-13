import { Router } from 'express';
import incidentController from '../../controllers/IncidentController';
import { authenticate, authorize } from '../../../middleware/auth';
import { validate } from '../../../shared/middleware/validate';
import { createIncidentSchema, updateIncidentSchema } from '../../../shared/validation/schemas';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Technician role constants for authorization
const TECH_ROLES = ['supervisor', 'manager'] as const;
const MANAGER_ROLES = ['manager'] as const;

// Static routes MUST come before parameterized routes
router.get('/stats', authorize(...TECH_ROLES), incidentController.getStats);
router.get('/open', authorize(...TECH_ROLES), incidentController.getOpenIncidents);
router.get('/breached', authorize(...TECH_ROLES), incidentController.getBreachedIncidents);
router.get('/unassigned', authorize(...TECH_ROLES), incidentController.getUnassignedIncidents);
router.get('/major', authorize(...TECH_ROLES), incidentController.getMajorIncidents);
router.get('/my-assignments', authorize(...TECH_ROLES), incidentController.getMyAssignments);
router.get('/my-requests', incidentController.getMyRequests);
router.get('/search', incidentController.searchIncidents);

// List and create
router.get('/', authorize(...TECH_ROLES), incidentController.getIncidents);
router.post('/', validate(createIncidentSchema), incidentController.createIncident);

// Parameterized routes MUST come last
router.get('/:id', incidentController.getIncident);
router.patch('/:id', validate(updateIncidentSchema), authorize(...TECH_ROLES), incidentController.updateIncident);
router.patch('/:id/status', authorize(...TECH_ROLES), incidentController.updateStatus);
router.patch('/:id/assign', authorize(...MANAGER_ROLES), incidentController.assignIncident);
router.post('/:id/worklogs', authorize(...TECH_ROLES), incidentController.addWorklog);
router.post('/:id/escalate', authorize(...TECH_ROLES), incidentController.escalateIncident);
router.post('/:id/link-problem', authorize(...TECH_ROLES), incidentController.linkToProblem);

export default router;
