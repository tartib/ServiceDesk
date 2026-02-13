import { EventBus } from './EventBus';
import { QueryBus } from '../patterns/Query';
import { CommandBus } from '../patterns/Command';
import { initializeEventListeners } from './initializeEventListeners';
import logger from '../../utils/logger';

/**
 * Setup the complete event-driven architecture
 * Call this during application initialization
 */
export function setupEventDrivenArchitecture(): void {
  logger.info('Setting up event-driven architecture...');

  // Initialize Event Bus
  EventBus.getInstance();
  logger.info('Event Bus initialized');

  // Initialize Query Bus
  QueryBus.getInstance();
  logger.info('Query Bus initialized');

  // Initialize Command Bus
  CommandBus.getInstance();
  logger.info('Command Bus initialized');

  // Initialize all event listeners
  initializeEventListeners();

  logger.info('Event-driven architecture setup complete');
}

/**
 * Get instances of all buses for dependency injection
 */
export function getEventDrivenBuses() {
  return {
    eventBus: EventBus.getInstance(),
    queryBus: QueryBus.getInstance(),
    commandBus: CommandBus.getInstance(),
  };
}
