/**
 * Campaigns & Engagement Module — Domain Interfaces
 */

import {
  CampaignStatus,
  CampaignMode,
  CampaignChannel,
  SegmentOperator,
  SegmentConditionField,
  SegmentLogicGroup,
  TriggerEvent,
  JourneyStatus,
  JourneyStepType,
  DeliveryStatus,
  MessageEventType,
  ABTestStatus,
  ABTestMetric,
  ProviderType,
  AuditAction,
  AuditEntityType,
  PreferenceCategory,
} from './enums';

// ── Campaign ─────────────────────────────────────────────────

export interface IFrequencyCap {
  maxPerDay: number;
  maxPerWeek: number;
  quietHoursEnabled: boolean;
  quietHoursFrom?: string; // HH:mm
  quietHoursTo?: string;   // HH:mm
}

export interface ICampaign {
  _id?: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  channel: CampaignChannel;
  mode: CampaignMode;
  status: CampaignStatus;
  templateId?: string;
  segmentId?: string;
  triggerDefinitionId?: string;
  abTestId?: string;
  /** Custom subject/body override (when not using a template) */
  subject?: string;
  body?: string;
  bodyHtml?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  imageUrl?: string;
  sendAt?: Date;
  sentAt?: Date;
  completedAt?: Date;
  frequencyCap?: IFrequencyCap;
  /** Recipient count at send time */
  recipientCount?: number;
  /** Aggregated stats */
  stats?: ICampaignStats;
  tags?: string[];
  createdBy: string;
  organizationId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICampaignStats {
  queued: number;
  sent: number;
  delivered: number;
  failed: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
}

// ── Template ─────────────────────────────────────────────────

export interface ITemplateVariable {
  key: string;        // e.g. 'first_name'
  description?: string;
  defaultValue?: string;
}

export interface INotificationTemplate {
  _id?: string;
  name: string;
  nameAr?: string;
  channel: CampaignChannel;
  subject?: string;
  subjectAr?: string;
  body: string;
  bodyAr?: string;
  bodyHtml?: string;
  bodyHtmlAr?: string;
  variables: ITemplateVariable[];
  ctaLabel?: string;
  ctaLabelAr?: string;
  ctaUrl?: string;
  imageUrl?: string;
  language?: string;
  tags?: string[];
  isActive: boolean;
  organizationId: string;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ── Segment ──────────────────────────────────────────────────

export interface ISegmentRule {
  field: SegmentConditionField;
  customFieldKey?: string; // for CUSTOM_ATTRIBUTE
  operator: SegmentOperator;
  value: unknown;
  logicGroup: SegmentLogicGroup;
}

export interface ISegment {
  _id?: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  rules: ISegmentRule[];
  estimatedCount?: number;
  lastEvaluatedAt?: Date;
  isActive: boolean;
  organizationId: string;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ── Trigger ──────────────────────────────────────────────────

export interface ITriggerCondition {
  field: string;
  operator: SegmentOperator;
  value: unknown;
}

export interface ITriggerDefinition {
  _id?: string;
  name: string;
  nameAr?: string;
  event: TriggerEvent;
  customEventName?: string; // for CUSTOM trigger event
  conditions: ITriggerCondition[];
  cooldownMinutes: number;
  linkedCampaignId?: string;
  linkedJourneyId?: string;
  isEnabled: boolean;
  lastFiredAt?: Date;
  fireCount?: number;
  organizationId: string;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ── Journey ──────────────────────────────────────────────────

export interface IJourneyStepCondition {
  field: string; // e.g. 'message.opened', 'user.tag'
  operator: SegmentOperator;
  value: unknown;
}

export interface IJourneyStep {
  stepId: string;
  stepOrder: number;
  type: JourneyStepType;
  name?: string;
  nameAr?: string;
  /** For SEND steps */
  channel?: CampaignChannel;
  templateId?: string;
  /** For WAIT steps */
  delayMinutes?: number;
  /** For CONDITION steps */
  condition?: IJourneyStepCondition;
  /** Next step references */
  nextStepOnTrue?: string;  // stepId
  nextStepOnFalse?: string; // stepId
  nextStepId?: string;      // default next (for SEND/WAIT)
}

export interface IJourney {
  _id?: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  status: JourneyStatus;
  triggerDefinitionId?: string;
  steps: IJourneyStep[];
  frequencyCap?: IFrequencyCap;
  /** Count of users currently in the journey */
  activeUserCount?: number;
  /** Count of users who completed the journey */
  completedUserCount?: number;
  organizationId: string;
  createdBy: string;
  publishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// ── Journey Instance (per-user execution state) ──────────────

export interface IJourneyInstance {
  _id?: string;
  journeyId: string;
  userId: string;
  currentStepId: string;
  status: 'active' | 'completed' | 'exited' | 'paused';
  /** Timestamp when the current wait step expires */
  waitUntil?: Date;
  enteredAt: Date;
  completedAt?: Date;
  organizationId: string;
}

// ── Message ──────────────────────────────────────────────────

export interface IMessage {
  _id?: string;
  campaignId?: string;
  journeyId?: string;
  journeyStepId?: string;
  recipientId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientDeviceToken?: string;
  templateId?: string;
  renderedSubject?: string;
  renderedBody?: string;
  renderedBodyHtml?: string;
  channel: CampaignChannel;
  provider?: string;
  providerMessageId?: string;
  status: DeliveryStatus;
  abVariant?: string; // 'A' | 'B' | 'C' ...
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  failureReason?: string;
  attempts: number;
  lastAttemptAt?: Date;
  organizationId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ── Message Event ────────────────────────────────────────────

export interface IMessageEvent {
  _id?: string;
  messageId: string;
  campaignId?: string;
  eventType: MessageEventType;
  eventAt: Date;
  provider?: string;
  rawPayload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  organizationId: string;
}

// ── User Preference ──────────────────────────────────────────

export interface IUserPreference {
  _id?: string;
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  marketingEnabled: boolean;
  transactionalEnabled: boolean;
  remindersEnabled: boolean;
  productUpdatesEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursFrom?: string; // HH:mm
  quietHoursTo?: string;   // HH:mm
  unsubscribedCategories: PreferenceCategory[];
  organizationId: string;
  updatedAt?: Date;
}

// ── Provider Config ──────────────────────────────────────────

export interface IProviderConfig {
  _id?: string;
  name: string;
  type: ProviderType;
  provider: string; // 'ses', 'sendgrid', 'twilio', 'firebase', etc.
  credentials: Record<string, string>; // encrypted at rest
  settings?: Record<string, unknown>;
  isDefault: boolean;
  priority: number; // lower = preferred
  isActive: boolean;
  organizationId: string;
  createdBy: string;
  lastTestedAt?: Date;
  lastTestSuccess?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// ── A/B Test ─────────────────────────────────────────────────

export interface IABVariant {
  variantId: string; // 'A', 'B', 'C'
  name: string;
  subject?: string;
  body?: string;
  bodyHtml?: string;
  templateId?: string;
  /** Percentage of audience assigned to this variant (0-100) */
  splitPercentage: number;
  /** Tracked metrics */
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
}

export interface IABTest {
  _id?: string;
  campaignId: string;
  status: ABTestStatus;
  metric: ABTestMetric;
  variants: IABVariant[];
  winnerVariantId?: string;
  /** Auto-declare winner after N hours */
  autoDecideAfterHours?: number;
  startedAt?: Date;
  completedAt?: Date;
  organizationId: string;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ── Personalization Rule ─────────────────────────────────────

export interface IPersonalizationRule {
  _id?: string;
  name: string;
  nameAr?: string;
  /** Condition to match (segment, language, region) */
  segmentId?: string;
  language?: string;
  region?: string;
  /** The template field this rule targets (e.g. 'subject', 'body', 'ctaLabel') */
  targetField: string;
  /** Dynamic content per condition key */
  dynamicContent: Record<string, string>;
  fallbackValue: string;
  isActive: boolean;
  organizationId: string;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ── Audit Entry ──────────────────────────────────────────────

export interface IAuditEntry {
  _id?: string;
  entityType: AuditEntityType;
  entityId: string;
  entityName?: string;
  action: AuditAction;
  performedBy: string;
  performedByName?: string;
  changes?: Record<string, { from: unknown; to: unknown }>;
  metadata?: Record<string, unknown>;
  organizationId: string;
  timestamp: Date;
}

// ── DTOs ─────────────────────────────────────────────────────

export interface CreateCampaignDTO {
  name: string;
  nameAr?: string;
  description?: string;
  channel: CampaignChannel;
  mode: CampaignMode;
  templateId?: string;
  segmentId?: string;
  subject?: string;
  body?: string;
  bodyHtml?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  imageUrl?: string;
  sendAt?: string; // ISO date
  frequencyCap?: IFrequencyCap;
  tags?: string[];
}

export interface CampaignFilters {
  status?: CampaignStatus;
  channel?: CampaignChannel;
  mode?: CampaignMode;
  createdBy?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TemplateFilters {
  channel?: CampaignChannel;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface MessageFilters {
  campaignId?: string;
  journeyId?: string;
  status?: DeliveryStatus;
  channel?: CampaignChannel;
  page?: number;
  limit?: number;
}

export interface AuditFilters {
  entityType?: AuditEntityType;
  entityId?: string;
  action?: AuditAction;
  performedBy?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}
