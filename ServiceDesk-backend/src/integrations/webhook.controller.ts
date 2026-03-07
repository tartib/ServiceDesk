/**
 * Integration Webhook Controller
 *
 * Generic inbound webhook endpoint.
 * Each provider's adapter verifies the signature and processes the payload.
 */

import { Request, Response } from 'express';
import { adapterRegistry } from './registry';
import { InboundPayload } from './types';
import logger from '../utils/logger';

/**
 * POST /api/v2/integrations/:provider/webhook
 *
 * Receives inbound webhooks from external systems (GitHub, Slack,
 * Prometheus, etc.) and dispatches to the matching adapter.
 */
export async function handleInboundWebhook(req: Request, res: Response): Promise<void> {
  const { provider } = req.params;

  const adapter = adapterRegistry.get(provider);

  if (!adapter) {
    res.status(404).json({ success: false, error: `Unknown integration provider: ${provider}` });
    return;
  }

  if (!adapter.enabled) {
    res.status(503).json({ success: false, error: `Integration '${provider}' is disabled` });
    return;
  }

  if (!adapter.handleInbound) {
    res.status(405).json({ success: false, error: `Integration '${provider}' does not accept inbound webhooks` });
    return;
  }

  const payload: InboundPayload = {
    provider,
    headers: req.headers as Record<string, string>,
    body: req.body,
    signature:
      (req.headers['x-hub-signature-256'] as string) ||
      (req.headers['x-slack-signature'] as string) ||
      (req.headers['x-webhook-signature'] as string) ||
      undefined,
    receivedAt: new Date().toISOString(),
  };

  try {
    const result = await adapter.handleInbound(payload);

    if (result.success) {
      logger.info(`Inbound webhook processed: ${provider} → ${result.action}`, {
        entityId: result.entityId,
      });
      res.status(200).json({ success: true, action: result.action, entityId: result.entityId });
    } else {
      logger.warn(`Inbound webhook failed: ${provider}`, { error: result.error });
      res.status(422).json({ success: false, error: result.error });
    }
  } catch (err) {
    logger.error(`Inbound webhook error: ${provider}`, { error: err });
    res.status(500).json({ success: false, error: 'Internal webhook processing error' });
  }
}

/**
 * GET /api/v2/integrations
 *
 * List all registered integration adapters and their status.
 */
export async function listIntegrations(_req: Request, res: Response): Promise<void> {
  const health = adapterRegistry.healthCheck();
  res.json({ success: true, data: health });
}

/**
 * GET /api/v2/integrations/:provider/health
 *
 * Health check for a specific adapter.
 */
export async function getAdapterHealth(req: Request, res: Response): Promise<void> {
  const { provider } = req.params;
  const adapter = adapterRegistry.get(provider);

  if (!adapter) {
    res.status(404).json({ success: false, error: `Unknown integration provider: ${provider}` });
    return;
  }

  res.json({
    success: true,
    data: {
      id: adapter.id,
      name: adapter.name,
      category: adapter.category,
      enabled: adapter.enabled,
      status: adapter.enabled ? adapter.getStatus() : 'disconnected',
    },
  });
}
