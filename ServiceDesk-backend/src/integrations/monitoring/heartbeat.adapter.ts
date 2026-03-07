/**
 * Heartbeat / Uptime Monitor Adapter (Scaffold)
 *
 * Inbound: Receive uptime pings and status checks → update CMDB CI status.
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

interface HeartbeatConfig {
  enabled: boolean;
  secretToken: string;
  defaultOrganizationId: string;
}

function loadConfig(): HeartbeatConfig {
  return {
    enabled: process.env.HEARTBEAT_ENABLED === 'true',
    secretToken: process.env.HEARTBEAT_SECRET || '',
    defaultOrganizationId: process.env.HEARTBEAT_DEFAULT_ORG || '',
  };
}

class HeartbeatAdapter implements IntegrationAdapter {
  readonly id = 'heartbeat';
  readonly name = 'Heartbeat / Uptime Monitor';
  readonly category = 'monitoring' as const;
  readonly direction = 'inbound' as const;

  private config: HeartbeatConfig;
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
    logger.info('Heartbeat adapter initialized');
  }

  async shutdown(): Promise<void> { this.status = 'disconnected'; }
  getStatus(): AdapterStatus { return this.status; }

  async handleInbound(payload: InboundPayload): Promise<InboundResult> {
    if (this.config.secretToken) {
      const token =
        payload.headers['x-webhook-secret'] ||
        payload.headers['authorization']?.replace('Bearer ', '');
      if (token !== this.config.secretToken) {
        return { success: false, action: 'rejected', error: 'Invalid heartbeat secret' };
      }
    }

    const body = payload.body as Record<string, any>;

    const eventId = uuidv4();
    const domainEvent: DomainEvent<Record<string, unknown>> = {
      id: eventId,
      type: 'integration.heartbeat.status',
      timestamp: new Date().toISOString(),
      version: '1.0',
      organizationId: this.config.defaultOrganizationId,
      userId: 'system',
      correlationId: eventId,
      data: {
        serviceName: body.serviceName || body.name || body.monitor,
        serviceUrl: body.url || body.endpoint,
        status: body.status || (body.up ? 'up' : 'down'),
        responseTime: body.responseTime || body.latency,
        statusCode: body.statusCode || body.code,
        checkedAt: body.checkedAt || body.timestamp || new Date().toISOString(),
      },
    };

    await eventBus.publish(domainEvent);

    logger.info('Heartbeat received', {
      service: domainEvent.data.serviceName,
      status: domainEvent.data.status,
    });

    return { success: true, action: 'heartbeat_received', entityId: eventId };
  }
}

export const heartbeatAdapter = new HeartbeatAdapter();
export default heartbeatAdapter;
