/**
 * Campaigns & Engagement Module — Domain Enums
 */

// ── Campaign ─────────────────────────────────────────────────

export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum CampaignMode {
  BROADCAST = 'broadcast',
  SCHEDULED = 'scheduled',
  TRIGGERED = 'triggered',
}

export enum CampaignChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
}

// ── Segment ──────────────────────────────────────────────────

export enum SegmentOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_THAN_OR_EQUAL = 'gte',
  LESS_THAN_OR_EQUAL = 'lte',
  IN = 'in',
  NOT_IN = 'not_in',
  EXISTS = 'exists',
  NOT_EXISTS = 'not_exists',
  BEFORE = 'before',
  AFTER = 'after',
  BETWEEN = 'between',
}

export enum SegmentConditionField {
  EMAIL = 'email',
  NAME = 'name',
  ROLE = 'role',
  DEPARTMENT = 'department',
  LOCATION = 'location',
  TAGS = 'tags',
  LAST_LOGIN = 'last_login',
  CREATED_AT = 'created_at',
  IS_ACTIVE = 'is_active',
  CUSTOM_ATTRIBUTE = 'custom_attribute',
  APP_ACTIVITY = 'app_activity',
  PURCHASE_HISTORY = 'purchase_history',
}

export enum SegmentLogicGroup {
  AND = 'and',
  OR = 'or',
}

// ── Trigger ──────────────────────────────────────────────────

export enum TriggerEvent {
  USER_SIGNED_UP = 'user_signed_up',
  USER_ACTIVATED = 'user_activated',
  NO_ACTIVITY = 'no_activity',
  ABANDONED_CART = 'abandoned_cart',
  ORDER_PAID = 'order_paid',
  BOOKING_CONFIRMED = 'booking_confirmed',
  SUBSCRIPTION_EXPIRING = 'subscription_expiring',
  TASK_COMPLETED = 'task_completed',
  TICKET_CREATED = 'ticket_created',
  TICKET_RESOLVED = 'ticket_resolved',
  SLA_BREACHED = 'sla_breached',
  CUSTOM = 'custom',
}

// ── Journey ──────────────────────────────────────────────────

export enum JourneyStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  PAUSED = 'paused',
  ARCHIVED = 'archived',
}

export enum JourneyStepType {
  SEND = 'send',
  WAIT = 'wait',
  CONDITION = 'condition',
  SPLIT = 'split',
  EXIT = 'exit',
}

// ── Delivery / Message ───────────────────────────────────────

export enum DeliveryStatus {
  QUEUED = 'queued',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  BOUNCED = 'bounced',
}

export enum MessageEventType {
  QUEUED = 'queued',
  SENT = 'sent',
  DELIVERED = 'delivered',
  OPENED = 'opened',
  CLICKED = 'clicked',
  FAILED = 'failed',
  BOUNCED = 'bounced',
  UNSUBSCRIBED = 'unsubscribed',
  COMPLAINED = 'complained',
}

// ── A/B Test ─────────────────────────────────────────────────

export enum ABTestStatus {
  DRAFT = 'draft',
  RUNNING = 'running',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ABTestMetric {
  OPEN_RATE = 'open_rate',
  CLICK_RATE = 'click_rate',
  CONVERSION = 'conversion',
}

// ── Provider ─────────────────────────────────────────────────

export enum ProviderType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
}

export enum EmailProvider {
  SES = 'ses',
  SENDGRID = 'sendgrid',
  MAILGUN = 'mailgun',
  SMTP = 'smtp',
}

export enum SMSProvider {
  TWILIO = 'twilio',
  MESSAGEBIRD = 'messagebird',
  LOCAL_GATEWAY = 'local_gateway',
}

export enum PushProvider {
  FIREBASE = 'firebase',
  APNS = 'apns',
  ONESIGNAL = 'onesignal',
}

// ── Audit ────────────────────────────────────────────────────

export enum AuditAction {
  CREATED = 'created',
  EDITED = 'edited',
  APPROVED = 'approved',
  PAUSED = 'paused',
  RESUMED = 'resumed',
  DELETED = 'deleted',
  SCHEDULED = 'scheduled',
  SENT = 'sent',
  CANCELLED = 'cancelled',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  DUPLICATED = 'duplicated',
}

export enum AuditEntityType {
  CAMPAIGN = 'campaign',
  TEMPLATE = 'template',
  SEGMENT = 'segment',
  TRIGGER = 'trigger',
  JOURNEY = 'journey',
  PROVIDER = 'provider',
  AB_TEST = 'ab_test',
  PREFERENCE = 'preference',
}

// ── Preference ───────────────────────────────────────────────

export enum PreferenceCategory {
  MARKETING = 'marketing',
  TRANSACTIONAL = 'transactional',
  REMINDERS = 'reminders',
  PRODUCT_UPDATES = 'product_updates',
}
