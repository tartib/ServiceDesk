/**
 * Integration Layer — Barrel Export & Initialization
 *
 * Registers all adapters and provides the init/shutdown lifecycle hooks.
 */

import { adapterRegistry } from './registry';
import { initOutboundRouter } from './router';
import logger from '../utils/logger';

// Channel adapters
import { emailAdapter } from './channels/email.adapter';
import { slackAdapter } from './channels/slack.adapter';
import { teamsAdapter } from './channels/teams.adapter';

// DevOps adapters
import { githubAdapter } from './devops/github.adapter';
import { gitlabAdapter } from './devops/gitlab.adapter';
import { cicdAdapter } from './devops/cicd.adapter';

// Monitoring adapters
import { alertWebhookAdapter } from './monitoring/alertWebhook.adapter';
import { heartbeatAdapter } from './monitoring/heartbeat.adapter';

// ---- Re-exports ----
export { adapterRegistry } from './registry';
export { initOutboundRouter } from './router';
export type {
  IntegrationAdapter,
  AdapterCategory,
  AdapterDirection,
  AdapterStatus,
  InboundPayload,
  InboundResult,
  OutboundPayload,
  OutboundResult,
  IntegrationConfig,
  OutboundRule,
} from './types';

/**
 * Register all adapters and initialize enabled ones.
 * Call this once during server startup, after the event bus is connected.
 */
export async function initIntegrations(): Promise<void> {
  logger.info('🔌 Registering integration adapters...');

  // Register all adapters (enabled or not — registry tracks them)
  adapterRegistry.register(emailAdapter);
  adapterRegistry.register(slackAdapter);
  adapterRegistry.register(teamsAdapter);
  adapterRegistry.register(githubAdapter);
  adapterRegistry.register(gitlabAdapter);
  adapterRegistry.register(cicdAdapter);
  adapterRegistry.register(alertWebhookAdapter);
  adapterRegistry.register(heartbeatAdapter);

  // Initialize only enabled adapters
  await adapterRegistry.initializeAll();

  // Start the outbound event router
  await initOutboundRouter();

  logger.info('🔌 Integration layer ready');
}

/**
 * Shut down all adapters gracefully.
 */
export async function shutdownIntegrations(): Promise<void> {
  await adapterRegistry.shutdownAll();
}
