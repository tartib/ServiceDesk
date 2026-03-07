/**
 * Workflow Engine Client Factory
 *
 * Returns the appropriate IWorkflowApi implementation based on
 * WORKFLOW_ENGINE_MODE environment variable.
 *
 * - 'local'  → WorkflowEngineLocalClient (in-process, default)
 * - 'remote' → Future: WorkflowEngineRemoteClient (HTTP/gRPC)
 */

import { IWorkflowApi } from '../../../shared/internal-api/types';
import { WorkflowEngineLocalClient } from './WorkflowEngineLocalClient';
import logger from '../../../utils/logger';

let clientInstance: IWorkflowApi | null = null;

export function getWorkflowEngineClient(): IWorkflowApi {
  if (!clientInstance) {
    const mode = process.env.WORKFLOW_ENGINE_MODE || 'local';

    switch (mode) {
      case 'remote':
        // Future: return new WorkflowEngineRemoteClient(process.env.WORKFLOW_ENGINE_URL);
        logger.warn('[workflow-engine] remote mode requested but not yet implemented — falling back to local');
        clientInstance = new WorkflowEngineLocalClient();
        break;

      case 'local':
      default:
        clientInstance = new WorkflowEngineLocalClient();
        break;
    }

    logger.info(`[workflow-engine] client initialized in '${mode}' mode`);
  }

  return clientInstance;
}

/**
 * Reset the client instance (useful for testing)
 */
export function resetWorkflowEngineClient(): void {
  clientInstance = null;
}
