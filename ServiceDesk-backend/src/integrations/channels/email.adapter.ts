/**
 * Email Integration Adapter
 *
 * Outbound: Send notification emails via SMTP (Nodemailer).
 * Inbound:  Future — IMAP polling to create tickets from incoming emails.
 */

import nodemailer, { Transporter } from 'nodemailer';
import {
  IntegrationAdapter,
  AdapterStatus,
  InboundPayload,
  InboundResult,
  OutboundPayload,
  OutboundResult,
} from '../types';
import logger from '../../utils/logger';

// ============================================================
// ENV CONFIG
// ============================================================

interface EmailConfig {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  fromName: string;
}

function loadConfig(): EmailConfig {
  return {
    enabled: process.env.SMTP_ENABLED === 'true',
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'noreply@servicedesk.local',
    fromName: process.env.SMTP_FROM_NAME || 'ServiceDesk',
  };
}

// ============================================================
// ADAPTER
// ============================================================

class EmailAdapter implements IntegrationAdapter {
  readonly id = 'email';
  readonly name = 'Email (SMTP)';
  readonly category = 'channel' as const;
  readonly direction = 'bidirectional' as const;

  private config: EmailConfig;
  private transporter: Transporter | null = null;
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

    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth:
        this.config.user && this.config.pass
          ? { user: this.config.user, pass: this.config.pass }
          : undefined,
    });

    try {
      await this.transporter.verify();
      this.status = 'connected';
      logger.info(`Email adapter connected to ${this.config.host}:${this.config.port}`);
    } catch (err) {
      this.status = 'error';
      logger.error('Email adapter failed to verify SMTP connection', { error: err });
      // Non-fatal — we still register the adapter
    }
  }

  async shutdown(): Promise<void> {
    if (this.transporter) {
      this.transporter.close();
      this.transporter = null;
    }
    this.status = 'disconnected';
  }

  getStatus(): AdapterStatus {
    return this.status;
  }

  // ---- INBOUND (future: email-to-ticket) ----

  async handleInbound(payload: InboundPayload): Promise<InboundResult> {
    // Future: parse raw email from payload.body, create service request / incident
    logger.debug('Email inbound received (not yet implemented)', {
      subject: payload.body.subject,
    });
    return { success: false, action: 'ignored', error: 'Email inbound not yet implemented' };
  }

  // ---- OUTBOUND (send emails) ----

  async handleOutbound(payload: OutboundPayload): Promise<OutboundResult> {
    if (!this.transporter || this.status !== 'connected') {
      return { success: false, error: 'Email adapter not connected' };
    }

    const start = Date.now();

    try {
      const { action, target, data } = payload;
      const eventType = data.eventType as string || 'notification';
      const eventData = data.eventData as Record<string, unknown> || {};

      const subject = this.buildSubject(eventType, eventData);
      const html = this.buildHtml(eventType, eventData);

      const to = target || (eventData as any).requesterEmail || (eventData as any).recipientEmail;
      if (!to) {
        return { success: false, error: 'No recipient email address' };
      }

      const info = await this.transporter.sendMail({
        from: `"${this.config.fromName}" <${this.config.from}>`,
        to,
        subject,
        html,
      });

      return {
        success: true,
        externalId: info.messageId,
        duration: Date.now() - start,
      };
    } catch (err: any) {
      logger.error('Email send failed', { error: err });
      return {
        success: false,
        error: err.message || 'Email send failed',
        duration: Date.now() - start,
      };
    }
  }

  // ---- HELPERS ----

  private buildSubject(eventType: string, data: Record<string, unknown>): string {
    const map: Record<string, string> = {
      'itsm.service_request.created': `[ServiceDesk] New Service Request: ${data.serviceName || data.requestId || ''}`,
      'itsm.service_request.status_changed': `[ServiceDesk] Request ${data.requestId || ''} — Status: ${data.newStatus || ''}`,
      'itsm.service_request.approved': `[ServiceDesk] Request ${data.requestId || ''} Approved`,
      'itsm.service_request.assigned': `[ServiceDesk] Request ${data.requestId || ''} Assigned to You`,
      'itsm.service_request.cancelled': `[ServiceDesk] Request ${data.requestId || ''} Cancelled`,
      'wf.instance.completed': `[ServiceDesk] Workflow Completed: ${data.definitionName || data.instanceId || ''}`,
      'ops.work_order.overdue': `[ServiceDesk] ⚠️ Work Order Overdue: ${data.workOrderId || ''}`,
    };
    return map[eventType] || `[ServiceDesk] ${eventType}`;
  }

  private buildHtml(eventType: string, data: Record<string, unknown>): string {
    const rows = Object.entries(data)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `<tr><td style="padding:4px 8px;font-weight:bold;">${k}</td><td style="padding:4px 8px;">${String(v)}</td></tr>`)
      .join('');

    return `
      <div style="font-family:Arial,sans-serif;max-width:600px;">
        <h2 style="color:#1a73e8;">ServiceDesk Notification</h2>
        <p><strong>Event:</strong> ${eventType}</p>
        <table style="border-collapse:collapse;width:100%;">
          ${rows}
        </table>
        <hr style="margin:16px 0;"/>
        <p style="color:#888;font-size:12px;">This is an automated message from ServiceDesk.</p>
      </div>
    `;
  }
}

export const emailAdapter = new EmailAdapter();
export default emailAdapter;
