/**
 * Generic Alert Webhook Adapter
 *
 * Inbound: Receive alerts from Prometheus/Alertmanager, Grafana, Datadog,
 *          PagerDuty, Uptime Robot, etc. → auto-create ITSM incidents.
 *
 * Supported formats detected automatically from payload structure:
 *   - Prometheus/Alertmanager (alerts[])
 *   - Grafana (alerts[] with dashboardId)
 *   - Generic JSON ({ title, severity, description, source })
 */

import {
  IntegrationAdapter,
  AdapterStatus,
  InboundPayload,
  InboundResult,
} from '../types';
import eventBus from '../../shared/events/event-bus';
import { EVENT_TYPES, DomainEvent } from '../../shared/events/event.types';
import logger from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

// ============================================================
// ENV CONFIG
// ============================================================

interface AlertWebhookConfig {
  enabled: boolean;
  secretToken: string;
  defaultOrganizationId: string;
}

function loadConfig(): AlertWebhookConfig {
  return {
    enabled: process.env.ALERT_WEBHOOK_ENABLED === 'true',
    secretToken: process.env.ALERT_WEBHOOK_SECRET || '',
    defaultOrganizationId: process.env.ALERT_WEBHOOK_DEFAULT_ORG || '',
  };
}

// ============================================================
// NORMALIZED ALERT
// ============================================================

interface NormalizedAlert {
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: string;
  sourceUrl?: string;
  labels: Record<string, string>;
  startsAt?: string;
  status: 'firing' | 'resolved';
}

// ============================================================
// ADAPTER
// ============================================================

class AlertWebhookAdapter implements IntegrationAdapter {
  readonly id = 'alert-webhook';
  readonly name = 'Alert Webhook (Monitoring)';
  readonly category = 'monitoring' as const;
  readonly direction = 'inbound' as const;

  private config: AlertWebhookConfig;
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
    logger.info('Alert webhook adapter initialized');
  }

  async shutdown(): Promise<void> {
    this.status = 'disconnected';
  }

  getStatus(): AdapterStatus {
    return this.status;
  }

  async handleInbound(payload: InboundPayload): Promise<InboundResult> {
    // Verify secret token if configured
    if (this.config.secretToken) {
      const token =
        payload.headers['x-webhook-secret'] ||
        payload.headers['authorization']?.replace('Bearer ', '');
      if (token !== this.config.secretToken) {
        return { success: false, action: 'rejected', error: 'Invalid webhook secret' };
      }
    }

    try {
      const alerts = this.normalizeAlerts(payload.body);

      if (alerts.length === 0) {
        return { success: false, action: 'ignored', error: 'No alerts found in payload' };
      }

      const createdIds: string[] = [];

      for (const alert of alerts) {
        if (alert.status === 'resolved') {
          logger.info('Alert resolved (auto-resolve not yet implemented)', { title: alert.title });
          continue;
        }

        // Publish an event that could be consumed to create an incident
        const eventId = uuidv4();
        const event: DomainEvent<Record<string, unknown>> = {
          id: eventId,
          type: 'integration.alert.received',
          timestamp: new Date().toISOString(),
          version: '1.0',
          organizationId: this.config.defaultOrganizationId,
          userId: 'system',
          correlationId: eventId,
          data: {
            title: alert.title,
            description: alert.description,
            severity: alert.severity,
            source: alert.source,
            sourceUrl: alert.sourceUrl,
            labels: alert.labels,
            startsAt: alert.startsAt,
            status: alert.status,
          },
        };

        await eventBus.publish(event);
        createdIds.push(eventId);

        logger.info('Alert event published', {
          title: alert.title,
          severity: alert.severity,
          source: alert.source,
        });
      }

      return {
        success: true,
        action: 'alert_events_published',
        entityId: createdIds.join(','),
      };
    } catch (err: any) {
      logger.error('Alert webhook processing error', { error: err });
      return { success: false, action: 'error', error: err.message };
    }
  }

  // ---- NORMALIZATION ----

  private normalizeAlerts(body: Record<string, unknown>): NormalizedAlert[] {
    // Prometheus / Alertmanager format
    if (Array.isArray(body.alerts)) {
      return (body.alerts as any[]).map((a) => this.normalizePrometheusAlert(a));
    }

    // Grafana format (also has alerts[] but with dashboardId)
    if (body.dashboardId && Array.isArray(body.evalMatches)) {
      return [this.normalizeGrafanaAlert(body)];
    }

    // Generic format
    if (body.title || body.alertname || body.message) {
      return [this.normalizeGenericAlert(body)];
    }

    return [];
  }

  private normalizePrometheusAlert(alert: any): NormalizedAlert {
    const labels = alert.labels || {};
    const annotations = alert.annotations || {};
    return {
      title: annotations.summary || labels.alertname || 'Prometheus Alert',
      description: annotations.description || annotations.message || '',
      severity: this.mapSeverity(labels.severity),
      source: `prometheus/${labels.job || labels.instance || 'unknown'}`,
      sourceUrl: alert.generatorURL,
      labels,
      startsAt: alert.startsAt,
      status: alert.status === 'resolved' ? 'resolved' : 'firing',
    };
  }

  private normalizeGrafanaAlert(body: Record<string, unknown>): NormalizedAlert {
    return {
      title: (body.ruleName as string) || (body.title as string) || 'Grafana Alert',
      description: (body.message as string) || '',
      severity: this.mapSeverity((body.severity as string) || (body.state as string)),
      source: `grafana/dashboard-${body.dashboardId}`,
      sourceUrl: body.ruleUrl as string,
      labels: {},
      startsAt: new Date().toISOString(),
      status: body.state === 'ok' ? 'resolved' : 'firing',
    };
  }

  private normalizeGenericAlert(body: Record<string, unknown>): NormalizedAlert {
    return {
      title: (body.title as string) || (body.alertname as string) || (body.message as string) || 'External Alert',
      description: (body.description as string) || (body.details as string) || '',
      severity: this.mapSeverity((body.severity as string) || (body.priority as string)),
      source: (body.source as string) || 'external',
      sourceUrl: body.url as string,
      labels: (body.labels as Record<string, string>) || {},
      startsAt: (body.startsAt as string) || new Date().toISOString(),
      status: (body.status as string) === 'resolved' ? 'resolved' : 'firing',
    };
  }

  private mapSeverity(raw?: string): NormalizedAlert['severity'] {
    if (!raw) return 'medium';
    const lower = raw.toLowerCase();
    if (['critical', 'p1', 'emergency', 'fatal'].includes(lower)) return 'critical';
    if (['high', 'p2', 'warning', 'warn', 'alerting'].includes(lower)) return 'high';
    if (['low', 'p4', 'info', 'informational'].includes(lower)) return 'low';
    return 'medium';
  }
}

export const alertWebhookAdapter = new AlertWebhookAdapter();
export default alertWebhookAdapter;
