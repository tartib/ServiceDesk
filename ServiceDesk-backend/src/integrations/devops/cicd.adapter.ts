/**
 * Generic CI/CD Webhook Adapter (Scaffold)
 *
 * Inbound: Receive build/deploy results from Jenkins, GitHub Actions,
 *          GitLab CI, CircleCI, etc. → link to PM tasks / releases.
 */

import {
  IntegrationAdapter,
  AdapterStatus,
  InboundPayload,
  InboundResult,
} from '../types';
import eventBus from '../../shared/events/event-bus';
import { DomainEvent } from '../../shared/events/event.types';
import logger from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

interface CICDConfig {
  enabled: boolean;
  secretToken: string;
  defaultOrganizationId: string;
}

function loadConfig(): CICDConfig {
  return {
    enabled: process.env.CICD_WEBHOOK_ENABLED === 'true',
    secretToken: process.env.CICD_WEBHOOK_SECRET || '',
    defaultOrganizationId: process.env.CICD_DEFAULT_ORG || '',
  };
}

class CICDAdapter implements IntegrationAdapter {
  readonly id = 'cicd';
  readonly name = 'CI/CD (Generic)';
  readonly category = 'devops' as const;
  readonly direction = 'inbound' as const;

  private config: CICDConfig;
  private status: AdapterStatus = 'disconnected';

  constructor() {
    this.config = loadConfig();
  }

  get enabled(): boolean {
    return this.config.enabled;
  }

  async initialize(): Promise<void> {
    if (!this.config.enabled) { this.status = 'disconnected'; return; }
    this.status = 'connected';
    logger.info('CI/CD adapter initialized (generic webhook receiver)');
  }

  async shutdown(): Promise<void> { this.status = 'disconnected'; }
  getStatus(): AdapterStatus { return this.status; }

  async handleInbound(payload: InboundPayload): Promise<InboundResult> {
    if (this.config.secretToken) {
      const token =
        payload.headers['x-webhook-secret'] ||
        payload.headers['authorization']?.replace('Bearer ', '');
      if (token !== this.config.secretToken) {
        return { success: false, action: 'rejected', error: 'Invalid CI/CD webhook secret' };
      }
    }

    const body = payload.body as Record<string, any>;

    const eventId = uuidv4();
    const domainEvent: DomainEvent<Record<string, unknown>> = {
      id: eventId,
      type: 'integration.cicd.build_result',
      timestamp: new Date().toISOString(),
      version: '1.0',
      organizationId: this.config.defaultOrganizationId,
      userId: 'system',
      correlationId: eventId,
      data: {
        provider: body.provider || body.source || 'unknown',
        pipeline: body.pipeline || body.job || body.workflow || body.name,
        status: body.status || body.conclusion || body.result,
        branch: body.branch || body.ref,
        commit: body.commit || body.sha,
        url: body.url || body.build_url || body.html_url,
        duration: body.duration,
      },
    };

    await eventBus.publish(domainEvent);

    logger.info('CI/CD webhook received', {
      provider: domainEvent.data.provider,
      status: domainEvent.data.status,
    });

    return { success: true, action: 'cicd_build_result_received', entityId: eventId };
  }
}

export const cicdAdapter = new CICDAdapter();
export default cicdAdapter;
