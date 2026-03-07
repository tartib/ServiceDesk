/**
 * Integration Layer — Core Type Definitions
 *
 * Defines the adapter contract, configuration, and payload shapes
 * that every integration adapter must implement.
 */

// ============================================================
// ADAPTER DIRECTION
// ============================================================

export type AdapterDirection = 'inbound' | 'outbound' | 'bidirectional';

// ============================================================
// ADAPTER CATEGORY
// ============================================================

export type AdapterCategory =
  | 'channel'       // Email, Slack, Teams
  | 'devops'        // GitHub, GitLab, CI/CD
  | 'monitoring'    // Prometheus, Grafana, Datadog
  | 'cloud'         // AWS, Azure, GCP (future)
  | 'custom';       // Generic webhook

// ============================================================
// ADAPTER STATUS
// ============================================================

export type AdapterStatus = 'connected' | 'disconnected' | 'degraded' | 'error';

// ============================================================
// INTEGRATION ADAPTER INTERFACE
// ============================================================

export interface IntegrationAdapter {
  /** Unique identifier for the adapter (e.g. 'email', 'slack', 'github') */
  readonly id: string;

  /** Human-readable name */
  readonly name: string;

  /** Category of the adapter */
  readonly category: AdapterCategory;

  /** Direction of data flow */
  readonly direction: AdapterDirection;

  /** Whether this adapter is enabled via env config */
  readonly enabled: boolean;

  /** Initialize the adapter (connect clients, verify credentials) */
  initialize(): Promise<void>;

  /** Gracefully shut down */
  shutdown(): Promise<void>;

  /** Current health / connectivity status */
  getStatus(): AdapterStatus;

  /** Process an inbound webhook payload (for inbound / bidirectional adapters) */
  handleInbound?(payload: InboundPayload): Promise<InboundResult>;

  /** Send an outbound message (for outbound / bidirectional adapters) */
  handleOutbound?(payload: OutboundPayload): Promise<OutboundResult>;
}

// ============================================================
// INBOUND PAYLOADS  (External → ServiceDesk)
// ============================================================

export interface InboundPayload {
  /** The adapter that received this payload */
  provider: string;

  /** Raw headers from the HTTP request */
  headers: Record<string, string>;

  /** Parsed body */
  body: Record<string, unknown>;

  /** Signature header for HMAC verification (if applicable) */
  signature?: string;

  /** Timestamp of receipt */
  receivedAt: string;
}

export interface InboundResult {
  /** Whether processing succeeded */
  success: boolean;

  /** Action taken (e.g. 'incident_created', 'ticket_linked', 'ignored') */
  action: string;

  /** ID of the created/updated entity (if any) */
  entityId?: string;

  /** Error message (if failed) */
  error?: string;
}

// ============================================================
// OUTBOUND PAYLOADS  (ServiceDesk → External)
// ============================================================

export interface OutboundPayload {
  /** Target adapter id */
  adapter: string;

  /** Type of outbound action (e.g. 'send_email', 'post_message', 'create_issue') */
  action: string;

  /** Recipient / target (adapter-specific) */
  target: string;

  /** Payload data (adapter-specific) */
  data: Record<string, unknown>;

  /** Event that triggered this outbound (for tracing) */
  sourceEvent?: {
    type: string;
    id: string;
    correlationId?: string;
  };
}

export interface OutboundResult {
  success: boolean;
  /** External system response ID or reference */
  externalId?: string;
  error?: string;
  /** Duration in ms */
  duration?: number;
}

// ============================================================
// INTEGRATION CONFIG (persisted per-org, future)
// ============================================================

export interface IntegrationConfig {
  adapterId: string;
  organizationId: string;
  enabled: boolean;
  credentials: Record<string, string>;
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// OUTBOUND ROUTING RULE
// ============================================================

export interface OutboundRule {
  /** Event type pattern to match (supports wildcards like 'itsm.*') */
  eventPattern: string;

  /** Adapter id to route to */
  adapterId: string;

  /** Outbound action to invoke */
  action: string;

  /** Target expression (can reference event data, e.g. '${data.assignedTo.email}') */
  target: string;

  /** Whether this rule is active */
  enabled: boolean;
}
