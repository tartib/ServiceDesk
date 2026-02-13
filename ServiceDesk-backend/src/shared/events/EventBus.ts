import { EventEmitter } from './EventEmitter';
import { EventListenerRegistry } from './EventListener';
import { DomainEvent } from './DomainEvent';
import logger from '../../utils/logger';

/**
 * Event Bus - Central hub for event-driven architecture
 * Coordinates event emission and listener execution
 */
export class EventBus {
  private static instance: EventBus;
  private eventEmitter: EventEmitter;
  private listenerRegistry: EventListenerRegistry;

  private constructor() {
    this.eventEmitter = EventEmitter.getInstance();
    this.listenerRegistry = EventListenerRegistry.getInstance();
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Publish an event to all registered listeners
   */
  async publish<T extends DomainEvent>(event: T): Promise<void> {
    const eventType = event.getEventType();

    logger.info(`Publishing event: ${eventType}`, {
      eventId: event.eventId,
      aggregateId: event.aggregateId,
    });

    // Get all listeners for this event type
    const listeners = this.listenerRegistry.getListeners(eventType);

    // Execute all listeners in parallel
    const promises = listeners.map(listener =>
      listener.handle(event).catch(error => {
        logger.error(`Error in event listener for ${eventType}:`, error);
        // Don't throw - allow other listeners to continue
      })
    );

    await Promise.all(promises);

    // Also emit to the event emitter for direct subscribers
    await this.eventEmitter.emit(event);
  }

  /**
   * Subscribe to an event type
   */
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: (event: T) => Promise<void>
  ): () => void {
    return this.eventEmitter.subscribe(eventType, handler);
  }

  /**
   * Get event history
   */
  getHistory(limit?: number): DomainEvent[] {
    return this.eventEmitter.getHistory(limit);
  }

  /**
   * Get events by aggregate ID
   */
  getEventsByAggregateId(aggregateId: string): DomainEvent[] {
    return this.eventEmitter.getEventsByAggregateId(aggregateId);
  }

  /**
   * Get events by type
   */
  getEventsByType(eventType: string): DomainEvent[] {
    return this.eventEmitter.getEventsByType(eventType);
  }
}
