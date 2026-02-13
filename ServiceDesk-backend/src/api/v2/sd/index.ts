/**
 * SD Domain - Service Desk / ITSM
 * 
 * Resources:
 * - /tickets   : Incidents, Service Requests, Changes, Problems
 * - /assets    : Asset/Inventory management (renamed from inventory)
 * - /catalog   : Service catalog (renamed from categories)
 * - /slas      : SLA definitions
 */

import { Router } from 'express';
import { authenticate } from '../../../middleware/auth';

// Import existing routes
import categoryRoutes from '../../../routes/categoryRoutes';
import inventoryRoutes from '../../../routes/inventoryRoutes';

// Import ITSM v2 routes
import incidentRoutes from '../../../presentation/routes/v2/incidentRoutes';
import problemRoutes from '../../../presentation/routes/v2/problemRoutes';
import changeRoutes from '../../../presentation/routes/v2/changeRoutes';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Tickets (ITSM)
router.use('/tickets/incidents', incidentRoutes);
router.use('/tickets/problems', problemRoutes);
router.use('/tickets/changes', changeRoutes);

// Assets (renamed from inventory)
router.use('/assets', inventoryRoutes);

// Catalog (renamed from categories)
router.use('/catalog', categoryRoutes);

export default router;
