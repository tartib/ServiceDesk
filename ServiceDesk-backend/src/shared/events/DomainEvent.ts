/**
 * Base Domain Event Class
 * Represents an event that occurred in a domain
 */
export abstract class DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly aggregateType: string;

  constructor(
    aggregateId: string,
    aggregateType: string,
  ) {
    this.eventId = `${aggregateType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.occurredAt = new Date();
    this.aggregateId = aggregateId;
    this.aggregateType = aggregateType;
  }

  abstract getEventType(): string;
  abstract getEventData(): Record<string, unknown>;
}
