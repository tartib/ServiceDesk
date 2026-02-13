import { DomainEvent } from './DomainEvent';

/**
 * Base Event Listener class
 * Implement this to handle specific domain events
 */
export abstract class EventListener {
  abstract getEventType(): string;
  abstract handle(event: DomainEvent): Promise<void>;
}

/**
 * Event Listener Registry for managing all event listeners
 */
export class EventListenerRegistry {
  private static instance: EventListenerRegistry;
  private listeners: Map<string, EventListener[]> = new Map();

  private constructor() {}

  static getInstance(): EventListenerRegistry {
    if (!EventListenerRegistry.instance) {
      EventListenerRegistry.instance = new EventListenerRegistry();
    }
    return EventListenerRegistry.instance;
  }

  /**
   * Register an event listener
   */
  register(listener: EventListener): void {
    const eventType = listener.getEventType();

    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    this.listeners.get(eventType)!.push(listener);
  }

  /**
   * Get listeners for an event type
   */
  getListeners(eventType: string): EventListener[] {
    return this.listeners.get(eventType) || [];
  }

  /**
   * Get all listeners
   */
  getAllListeners(): EventListener[] {
    const allListeners: EventListener[] = [];
    this.listeners.forEach(listeners => {
      allListeners.push(...listeners);
    });
    return allListeners;
  }

  /**
   * Unregister a listener
   */
  unregister(eventType: string, listener: EventListener): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Clear all listeners
   */
  clear(): void {
    this.listeners.clear();
  }
}
