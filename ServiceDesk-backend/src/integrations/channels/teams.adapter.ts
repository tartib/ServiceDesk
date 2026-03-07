/**
 * Microsoft Teams Integration Adapter
 *
 * Outbound: Post adaptive cards to Teams channels via incoming webhook.
 * Inbound:  Future — Bot Framework for bidirectional messaging.
 */

import {
  IntegrationAdapter,
  AdapterStatus,
  OutboundPayload,
  OutboundResult,
} from '../types';
import logger from '../../utils/logger';

// ============================================================
// ENV CONFIG
// ============================================================

interface TeamsConfig {
  enabled: boolean;
  webhookUrl: string;
}

function loadConfig(): TeamsConfig {
  return {
    enabled: process.env.TEAMS_ENABLED === 'true',
    webhookUrl: process.env.TEAMS_WEBHOOK_URL || '',
  };
}

// ============================================================
// ADAPTER
// ============================================================

class TeamsAdapter implements IntegrationAdapter {
  readonly id = 'teams';
  readonly name = 'Microsoft Teams';
  readonly category = 'channel' as const;
  readonly direction = 'outbound' as const;

  private config: TeamsConfig;
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

    if (!this.config.webhookUrl) {
      this.status = 'error';
      logger.error('Teams adapter: TEAMS_WEBHOOK_URL is required');
      return;
    }

    this.status = 'connected';
    logger.info('Teams adapter initialized (outbound webhook)');
  }

  async shutdown(): Promise<void> {
    this.status = 'disconnected';
  }

  getStatus(): AdapterStatus {
    return this.status;
  }

  async handleOutbound(payload: OutboundPayload): Promise<OutboundResult> {
    if (this.status !== 'connected') {
      return { success: false, error: 'Teams adapter not connected' };
    }

    const start = Date.now();
    const eventType = payload.data.eventType as string || '';
    const eventData = payload.data.eventData as Record<string, unknown> || {};

    try {
      const card = this.buildAdaptiveCard(eventType, eventData);

      const res = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(card),
      });

      if (res.ok) {
        return { success: true, duration: Date.now() - start };
      } else {
        const text = await res.text();
        return { success: false, error: `Teams webhook returned ${res.status}: ${text}`, duration: Date.now() - start };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Teams send failed', duration: Date.now() - start };
    }
  }

  private buildAdaptiveCard(eventType: string, data: Record<string, unknown>): object {
    const title = this.getTitle(eventType, data);
    const facts = Object.entries(data)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .slice(0, 8)
      .map(([k, v]) => ({ name: k, value: String(v) }));

    return {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: {
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            type: 'AdaptiveCard',
            version: '1.4',
            body: [
              {
                type: 'TextBlock',
                text: title,
                weight: 'Bolder',
                size: 'Medium',
                wrap: true,
              },
              {
                type: 'FactSet',
                facts,
              },
              {
                type: 'TextBlock',
                text: `Event: \`${eventType}\` | ${new Date().toISOString()}`,
                size: 'Small',
                isSubtle: true,
                wrap: true,
              },
            ],
          },
        },
      ],
    };
  }

  private getTitle(eventType: string, data: Record<string, unknown>): string {
    const map: Record<string, string> = {
      'itsm.service_request.created': `📋 New Service Request: ${data.serviceName || ''}`,
      'itsm.service_request.status_changed': `🔄 Request ${data.requestId || ''} → ${data.newStatus || ''}`,
      'wf.instance.completed': `✔️ Workflow Completed: ${data.definitionName || ''}`,
      'ops.work_order.overdue': `🔴 Work Order Overdue: ${data.workOrderId || ''}`,
    };
    return map[eventType] || `📡 ServiceDesk: ${eventType}`;
  }
}

export const teamsAdapter = new TeamsAdapter();
export default teamsAdapter;
