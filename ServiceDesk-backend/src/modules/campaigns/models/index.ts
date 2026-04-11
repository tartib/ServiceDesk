/**
 * Campaigns Module — Models Barrel Export
 */

export { default as Campaign } from './Campaign';
export { default as NotificationTemplate } from './NotificationTemplate';
export { default as Segment } from './Segment';
export { default as TriggerDefinition } from './TriggerDefinition';
export { default as Journey } from './Journey';
export { default as JourneyInstance } from './JourneyInstance';
export { default as Message } from './Message';
export { default as MessageEvent } from './MessageEvent';
export { default as UserPreference } from './UserPreference';
export { default as ProviderConfig } from './ProviderConfig';
export { default as ABTest } from './ABTest';
export { default as AuditEntry } from './AuditEntry';
export { default as PersonalizationRule } from './PersonalizationRule';

export type { ICampaignDocument } from './Campaign';
export type { INotificationTemplateDocument } from './NotificationTemplate';
export type { ISegmentDocument } from './Segment';
export type { ITriggerDefinitionDocument } from './TriggerDefinition';
export type { IJourneyDocument, IJourneyStepDocument } from './Journey';
export type { IJourneyInstanceDocument } from './JourneyInstance';
export type { IMessageDocument } from './Message';
export type { IMessageEventDocument } from './MessageEvent';
export type { IUserPreferenceDocument } from './UserPreference';
export type { IProviderConfigDocument } from './ProviderConfig';
export type { IABTestDocument, IABVariantDocument } from './ABTest';
export type { IAuditEntryDocument } from './AuditEntry';
export type { IPersonalizationRuleDocument } from './PersonalizationRule';
