/**
 * OPS Domain - Operational Work Order Management
 * 
 * Resources:
 * - /work-orders : Real-time execution tasks (renamed from tasks/prep-tasks)
 * - /schedules   : Task scheduling
 * - /products    : Products for prep tasks
 */

import { Router } from 'express';
import workOrderRoutes from './work-order.routes';

const router = Router();

// Work Order routes
router.use('/work-orders', workOrderRoutes);

export default router;
