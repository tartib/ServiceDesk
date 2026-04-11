/**
 * Integration Routes
 */

import { Router } from 'express';
import {
  handleInboundWebhook,
  listIntegrations,
  getAdapterHealth,
} from './webhook.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// List all integrations and their status (admin only)
router.get('/', authenticate, authorize('admin'), listIntegrations);

// Health check for a specific adapter (admin only)
router.get('/:provider/health', authenticate, authorize('admin'), getAdapterHealth);

// Inbound webhook endpoint (no auth — each adapter verifies its own signature)
router.post('/:provider/webhook', handleInboundWebhook);

export default router;
