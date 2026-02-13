import { DomainEvent } from './DomainEvent';
import logger from '../../utils/logger';

export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => Promise<void>;

/**
 * Event Emitter for publishing and subscribing to domain events
 * Implements pub/sub pattern for cross-domain communication
 */
export class EventEmitter {
  private static instance: EventEmitter;
  private handlers: Map<string, EventHandler[]> = new Map();
  private eventHistory: DomainEvent[] = [];
  private maxHistorySize = 1000;

  private constructor() {}

  static getInstance(): EventEmitter {
    if (!EventEmitter.instance) {
      EventEmitter.instance = new EventEmitter();
    }
    return EventEmitter.instance;
  }

  /**
   * Subscribe to a specific event type
   */
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>
  ): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }

    const eventHandlers = this.handlers.get(eventType)!;
    eventHandlers.push(handler as EventHandler);

    logger.info(`Event handler subscribed to ${eventType}`);

    // Return unsubscribe function
    return () => {
      const index = eventHandlers.indexOf(handler as EventHandler);
      if (index > -1) {
        eventHandlers.splice(index, 1);
        logger.info(`Event handler unsubscribed from ${eventType}`);
      }
    };
  }

  /**
   * Subscribe to all events
   */
  subscribeToAll(handler: EventHandler): () => void {
    return this.subscribe('*', handler);
  }

  /**
   * Publish an event
   */
  async emit<T extends DomainEvent>(event: T): Promise<void> {
    const eventType = event.getEventType();

    logger.info(`Event emitted: ${eventType}`, {
      eventId: event.eventId,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
    });

    // Store in history
    this.addToHistory(event);

    // Execute specific handlers
    const specificHandlers = this.handlers.get(eventType) || [];
    const allHandlers = this.handlers.get('*') || [];
    const allEventHandlers = [...specificHandlers, ...allHandlers];

    // Execute handlers in parallel
    const promises = allEventHandlers.map(handler =>
      handler(event).catch(error => {
        logger.error(`Error executing event handler for ${eventType}:`, error);
      })
    );

    await Promise.all(promises);
  }

  /**
   * Get event history
   */
  getHistory(limit?: number): DomainEvent[] {
    if (limit) {
      return this.eventHistory.slice(-limit);
    }
    return [...this.eventHistory];
  }

  /**
   * Get events by aggregate ID
   */
  getEventsByAggregateId(aggregateId: string): DomainEvent[] {
    return this.eventHistory.filter(event => event.aggregateId === aggregateId);
  }

  /**
   * Get events by type
   */
  getEventsByType(eventType: string): DomainEvent[] {
    return this.eventHistory.filter(event => event.getEventType() === eventType);
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
    logger.info('Event history cleared');
  }

  /**
   * Get handler count for event type
   */
  getHandlerCount(eventType: string): number {
    return (this.handlers.get(eventType) || []).length;
  }

  private addToHistory(event: DomainEvent): void {
    this.eventHistory.push(event);

    // Keep history size manageable
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }
}
