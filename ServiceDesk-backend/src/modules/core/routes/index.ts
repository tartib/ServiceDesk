/**
 * Core Module — Route Index
 *
 * Mounts auth, user, organization, and team sub-routers.
 */

import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import organizationRoutes from './organization.routes';
import teamRoutes from './team.routes';
import employeeRoutes from './employee.routes';
import leaveRequestRoutes from './leaveRequest.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/organizations', organizationRoutes);
router.use('/teams', teamRoutes);
router.use('/employees', employeeRoutes);
router.use('/leave-requests', leaveRequestRoutes);

export default router;
