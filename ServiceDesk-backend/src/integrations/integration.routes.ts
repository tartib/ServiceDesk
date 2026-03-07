/**
 * Integration Routes
 */

import { Router } from 'express';
import {
  handleInboundWebhook,
  listIntegrations,
  getAdapterHealth,
} from './webhook.controller';

const router = Router();

// List all integrations and their status
router.get('/', listIntegrations);

// Health check for a specific adapter
router.get('/:provider/health', getAdapterHealth);

// Inbound webhook endpoint (no auth — each adapter verifies its own signature)
router.post('/:provider/webhook', handleInboundWebhook);

export default router;
