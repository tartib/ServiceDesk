/**
 * GitHub Integration Adapter
 *
 * Inbound: Receive push/PR/issue webhooks → link to PM tasks, update CMDB.
 * Outbound: Future — create issues, post comments via GitHub API.
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

// ============================================================
// ENV CONFIG
// ============================================================

interface GitHubConfig {
  enabled: boolean;
  webhookSecret: string;
  defaultOrganizationId: string;
}

function loadConfig(): GitHubConfig {
  return {
    enabled: process.env.GITHUB_ENABLED === 'true',
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET || '',
    defaultOrganizationId: process.env.GITHUB_DEFAULT_ORG || '',
  };
}

// ============================================================
// ADAPTER
// ============================================================

class GitHubAdapter implements IntegrationAdapter {
  readonly id = 'github';
  readonly name = 'GitHub';
  readonly category = 'devops' as const;
  readonly direction = 'inbound' as const;

  private config: GitHubConfig;
  private status: AdapterStatus = 'disconnected';

  constructor() {
    this.config = loadConfig();
  }

  get enabled(): boolean {
    return this.config.enabled;
  }

  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      this.status = 'disconnected';
      return;
    }
    this.status = 'connected';
    logger.info('GitHub adapter initialized (webhook receiver)');
  }

  async shutdown(): Promise<void> {
    this.status = 'disconnected';
  }

  getStatus(): AdapterStatus {
    return this.status;
  }

  async handleInbound(payload: InboundPayload): Promise<InboundResult> {
    // Verify HMAC signature
    if (this.config.webhookSecret && !this.verifySignature(payload)) {
      return { success: false, action: 'rejected', error: 'Invalid GitHub signature' };
    }

    const ghEvent = payload.headers['x-github-event'];
    const deliveryId = payload.headers['x-github-delivery'];

    if (!ghEvent) {
      return { success: false, action: 'ignored', error: 'Missing x-github-event header' };
    }

    logger.info('GitHub webhook received', { event: ghEvent, delivery: deliveryId });

    const body = payload.body as Record<string, any>;

    const eventId = uuidv4();
    const domainEvent: DomainEvent<Record<string, unknown>> = {
      id: eventId,
      type: `integration.github.${ghEvent}`,
      timestamp: new Date().toISOString(),
      version: '1.0',
      organizationId: this.config.defaultOrganizationId,
      userId: 'system',
      correlationId: deliveryId || eventId,
      data: this.extractRelevantData(ghEvent, body),
    };

    await eventBus.publish(domainEvent);

    return {
      success: true,
      action: `github_${ghEvent}_received`,
      entityId: eventId,
    };
  }

  // ---- PRIVATE HELPERS ----

  private verifySignature(payload: InboundPayload): boolean {
    const signature = payload.headers['x-hub-signature-256'];
    if (!signature) return false;

    const rawBody = JSON.stringify(payload.body);
    const expected = 'sha256=' + crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(rawBody)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(expected),
        Buffer.from(signature)
      );
    } catch {
      return false;
    }
  }

  private extractRelevantData(event: string, body: Record<string, any>): Record<string, unknown> {
    const repo = body.repository
      ? { name: body.repository.full_name, url: body.repository.html_url }
      : {};

    const sender = body.sender
      ? { login: body.sender.login, avatar: body.sender.avatar_url }
      : {};

    switch (event) {
      case 'push':
        return {
          ...repo,
          sender,
          ref: body.ref,
          commits: (body.commits || []).length,
          headCommit: body.head_commit
            ? { message: body.head_commit.message, url: body.head_commit.url }
            : null,
        };

      case 'pull_request':
        return {
          ...repo,
          sender,
          action: body.action,
          number: body.pull_request?.number,
          title: body.pull_request?.title,
          url: body.pull_request?.html_url,
          state: body.pull_request?.state,
          merged: body.pull_request?.merged,
        };

      case 'issues':
        return {
          ...repo,
          sender,
          action: body.action,
          number: body.issue?.number,
          title: body.issue?.title,
          url: body.issue?.html_url,
          state: body.issue?.state,
          labels: (body.issue?.labels || []).map((l: any) => l.name),
        };

      case 'release':
        return {
          ...repo,
          sender,
          action: body.action,
          tag: body.release?.tag_name,
          name: body.release?.name,
          url: body.release?.html_url,
          prerelease: body.release?.prerelease,
        };

      case 'workflow_run':
        return {
          ...repo,
          sender,
          action: body.action,
          workflowName: body.workflow_run?.name,
          conclusion: body.workflow_run?.conclusion,
          branch: body.workflow_run?.head_branch,
          url: body.workflow_run?.html_url,
        };

      default:
        return { ...repo, sender, action: body.action };
    }
  }
}

export const githubAdapter = new GitHubAdapter();
export default githubAdapter;
