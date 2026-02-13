/**
 * Core Domain - Identity & Platform Management
 * 
 * Resources:
 * - /auth          : Authentication (login, register, tokens)
 * - /users         : User management
 * - /organizations : Organization management
 * - /teams         : Team management
 * - /notifications : User notifications
 */

import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import organizationRoutes from './organization.routes';
import teamRoutes from './team.routes';
import notificationRoutes from './notification.routes';

const router = Router();

// Auth routes (public + protected)
router.use('/auth', authRoutes);

// User routes (protected)
router.use('/users', userRoutes);

// Organization routes (protected)
router.use('/organizations', organizationRoutes);

// Team routes (protected)
router.use('/teams', teamRoutes);

// Notification routes (protected)
router.use('/notifications', notificationRoutes);

export default router;
