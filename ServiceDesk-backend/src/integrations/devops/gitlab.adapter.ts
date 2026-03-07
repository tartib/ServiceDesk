/**
 * GitLab Integration Adapter (Scaffold)
 *
 * Inbound: Receive push/MR/issue/pipeline webhooks → link to PM tasks.
 * Outbound: Future — create issues, post comments via GitLab API.
 */

import crypto from 'crypto';
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

interface GitLabConfig {
  enabled: boolean;
  webhookSecret: string;
  defaultOrganizationId: string;
}

function loadConfig(): GitLabConfig {
  return {
    enabled: process.env.GITLAB_ENABLED === 'true',
    webhookSecret: process.env.GITLAB_WEBHOOK_SECRET || '',
    defaultOrganizationId: process.env.GITLAB_DEFAULT_ORG || '',
  };
}

class GitLabAdapter implements IntegrationAdapter {
  readonly id = 'gitlab';
  readonly name = 'GitLab';
  readonly category = 'devops' as const;
  readonly direction = 'inbound' as const;

  private config: GitLabConfig;
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
    logger.info('GitLab adapter initialized (webhook receiver)');
  }

  async shutdown(): Promise<void> { this.status = 'disconnected'; }
  getStatus(): AdapterStatus { return this.status; }

  async handleInbound(payload: InboundPayload): Promise<InboundResult> {
    // Verify secret token
    if (this.config.webhookSecret) {
      const token = payload.headers['x-gitlab-token'];
      if (token !== this.config.webhookSecret) {
        return { success: false, action: 'rejected', error: 'Invalid GitLab token' };
      }
    }

    const glEvent = payload.headers['x-gitlab-event'] || 'unknown';
    const body = payload.body as Record<string, any>;

    logger.info('GitLab webhook received', { event: glEvent });

    const eventId = uuidv4();
    const domainEvent: DomainEvent<Record<string, unknown>> = {
      id: eventId,
      type: `integration.gitlab.${glEvent.toLowerCase().replace(/ /g, '_')}`,
      timestamp: new Date().toISOString(),
      version: '1.0',
      organizationId: this.config.defaultOrganizationId,
      userId: 'system',
      correlationId: eventId,
      data: {
        event: glEvent,
        project: body.project ? { name: body.project.path_with_namespace, url: body.project.web_url } : {},
        user: body.user ? { name: body.user.name, username: body.user.username } : {},
        objectKind: body.object_kind,
        action: body.object_attributes?.action,
      },
    };

    await eventBus.publish(domainEvent);

    return { success: true, action: `gitlab_${glEvent}_received`, entityId: eventId };
  }
}

export const gitlabAdapter = new GitLabAdapter();
export default gitlabAdapter;
