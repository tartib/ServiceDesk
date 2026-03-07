/**
 * Slack Integration Adapter
 *
 * Outbound: Post messages / blocks to Slack channels via Bot API.
 * Inbound:  Receive slash commands and interactive payloads → create tickets.
 */

import {
  IntegrationAdapter,
  AdapterStatus,
  InboundPayload,
  InboundResult,
  OutboundPayload,
  OutboundResult,
} from '../types';
import logger from '../../utils/logger';
import crypto from 'crypto';

// ============================================================
// ENV CONFIG
// ============================================================

interface SlackConfig {
  enabled: boolean;
  botToken: string;
  signingSecret: string;
  defaultChannel: string;
  alertChannel: string;
}

function loadConfig(): SlackConfig {
  return {
    enabled: process.env.SLACK_ENABLED === 'true',
    botToken: process.env.SLACK_BOT_TOKEN || '',
    signingSecret: process.env.SLACK_SIGNING_SECRET || '',
    defaultChannel: process.env.SLACK_DEFAULT_CHANNEL || '#servicedesk',
    alertChannel: process.env.SLACK_ALERT_CHANNEL || '#servicedesk-alerts',
  };
}

// ============================================================
// ADAPTER
// ============================================================

class SlackAdapter implements IntegrationAdapter {
  readonly id = 'slack';
  readonly name = 'Slack';
  readonly category = 'channel' as const;
  readonly direction = 'bidirectional' as const;

  private config: SlackConfig;
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

    if (!this.config.botToken) {
      this.status = 'error';
      logger.error('Slack adapter: SLACK_BOT_TOKEN is required');
      return;
    }

    // Verify the token by calling auth.test
    try {
      const res = await fetch('https://slack.com/api/auth.test', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.botToken}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json() as any;

      if (data.ok) {
        this.status = 'connected';
        logger.info(`Slack adapter connected as: ${data.user} in workspace ${data.team}`);
      } else {
        this.status = 'error';
        logger.error('Slack auth.test failed', { error: data.error });
      }
    } catch (err) {
      this.status = 'error';
      logger.error('Slack adapter initialization failed', { error: err });
    }
  }

  async shutdown(): Promise<void> {
    this.status = 'disconnected';
  }

  getStatus(): AdapterStatus {
    return this.status;
  }

  // ---- INBOUND (slash commands, interactive payloads) ----

  async handleInbound(payload: InboundPayload): Promise<InboundResult> {
    // Verify Slack request signature
    if (!this.verifySignature(payload)) {
      return { success: false, action: 'rejected', error: 'Invalid Slack signature' };
    }

    const body = payload.body;

    // Slash command (e.g. /servicedesk create-ticket ...)
    if (body.command) {
      return this.handleSlashCommand(body);
    }

    // Interactive payload (button click, modal submit)
    if (body.payload) {
      const interactivePayload = typeof body.payload === 'string'
        ? JSON.parse(body.payload as string)
        : body.payload;
      return this.handleInteractive(interactivePayload);
    }

    // Events API (message events, app_mention)
    if (body.type === 'url_verification') {
      // Slack URL verification challenge
      return { success: true, action: 'challenge', entityId: body.challenge as string };
    }

    if (body.event) {
      return this.handleEvent(body.event as Record<string, unknown>);
    }

    return { success: false, action: 'ignored', error: 'Unrecognized Slack payload type' };
  }

  // ---- OUTBOUND (post messages) ----

  async handleOutbound(payload: OutboundPayload): Promise<OutboundResult> {
    if (this.status !== 'connected') {
      return { success: false, error: 'Slack adapter not connected' };
    }

    const start = Date.now();
    const { action, data } = payload;
    const eventType = data.eventType as string || '';
    const eventData = data.eventData as Record<string, unknown> || {};

    try {
      const channel = this.resolveChannel(payload.target);
      const blocks = this.buildBlocks(eventType, eventData);

      const res = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel,
          text: this.buildFallbackText(eventType, eventData),
          blocks,
        }),
      });

      const result = await res.json() as any;

      if (result.ok) {
        return {
          success: true,
          externalId: result.ts,
          duration: Date.now() - start,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Slack API error',
          duration: Date.now() - start,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Slack send failed',
        duration: Date.now() - start,
      };
    }
  }

  // ---- PRIVATE HELPERS ----

  private verifySignature(payload: InboundPayload): boolean {
    if (!this.config.signingSecret || !payload.signature) return true; // skip if not configured

    const timestamp = payload.headers['x-slack-request-timestamp'];
    if (!timestamp) return false;

    // Prevent replay attacks (5 min window)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp, 10)) > 300) return false;

    const rawBody = JSON.stringify(payload.body);
    const sigBasestring = `v0:${timestamp}:${rawBody}`;
    const mySignature = 'v0=' + crypto
      .createHmac('sha256', this.config.signingSecret)
      .update(sigBasestring)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(mySignature),
      Buffer.from(payload.signature)
    );
  }

  private async handleSlashCommand(body: Record<string, unknown>): Promise<InboundResult> {
    const command = body.command as string;
    const text = (body.text as string || '').trim();

    logger.info('Slack slash command received', { command, text });

    // TODO: Parse command and create service request / incident
    // For now, acknowledge receipt
    return {
      success: true,
      action: 'command_received',
      entityId: undefined,
    };
  }

  private async handleInteractive(payload: Record<string, unknown>): Promise<InboundResult> {
    logger.info('Slack interactive payload received', { type: payload.type });
    return { success: true, action: 'interactive_received' };
  }

  private async handleEvent(event: Record<string, unknown>): Promise<InboundResult> {
    logger.info('Slack event received', { type: event.type });
    return { success: true, action: 'event_received' };
  }

  private resolveChannel(target: string): string {
    if (target === '${config.defaultChannel}' || !target) {
      return this.config.defaultChannel;
    }
    if (target === '${config.alertChannel}') {
      return this.config.alertChannel;
    }
    return target;
  }

  private buildFallbackText(eventType: string, data: Record<string, unknown>): string {
    const map: Record<string, string> = {
      'itsm.service_request.created': `📋 New Service Request: ${data.serviceName || data.requestId || ''}`,
      'itsm.service_request.status_changed': `🔄 Request ${data.requestId || ''} → ${data.newStatus || ''}`,
      'itsm.service_request.approved': `✅ Request ${data.requestId || ''} Approved`,
      'itsm.service_request.cancelled': `❌ Request ${data.requestId || ''} Cancelled`,
      'itsm.ci.retired': `⚠️ CI Retired: ${data.name || data.ciId || ''}`,
      'wf.instance.started': `▶️ Workflow Started: ${data.definitionName || ''}`,
      'wf.instance.completed': `✔️ Workflow Completed: ${data.definitionName || data.instanceId || ''}`,
      'ops.work_order.overdue': `🔴 Work Order Overdue: ${data.workOrderId || ''}`,
    };
    return map[eventType] || `📡 ServiceDesk Event: ${eventType}`;
  }

  private buildBlocks(eventType: string, data: Record<string, unknown>): object[] {
    const text = this.buildFallbackText(eventType, data);
    const fields = Object.entries(data)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .slice(0, 10)
      .map(([k, v]) => ({
        type: 'mrkdwn',
        text: `*${k}:* ${String(v)}`,
      }));

    return [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*${text}*` },
      },
      ...(fields.length > 0
        ? [{
            type: 'section',
            fields,
          }]
        : []),
      {
        type: 'context',
        elements: [
          { type: 'mrkdwn', text: `Event: \`${eventType}\` | ${new Date().toISOString()}` },
        ],
      },
    ];
  }
}

export const slackAdapter = new SlackAdapter();
export default slackAdapter;
