/**
 * PM Domain Event Publisher
 * 
 * Publishes project management related events to RabbitMQ
 */

import eventBus from '../event-bus';
import { PmEvents } from '../event-factory';
import {
  WorkItemCreatedEvent,
  WorkItemTransitionedEvent,
  SprintStartedEvent,
  SprintCompletedEvent,
  FieldChange,
} from '../event.types';
import logger from '../../../../../utils/logger';

interface EventContext {
  organizationId: string;
  userId: string;
  correlationId?: string;
}

export const PmEventPublisher = {
  /**
   * Publish work item created event
   */
  async workItemCreated(
    data: WorkItemCreatedEvent,
    context: EventContext
  ): Promise<boolean> {
    const event = PmEvents.workItemCreated(data, context);
    const success = await eventBus.publish(event);
    
    if (success) {
      logger.info('Published: work_item.created', {
        itemId: data.itemId,
        projectId: data.projectId,
        type: data.type,
      });
    }
    
    return success;
  },

  /**
   * Publish work item transitioned event
   */
  async workItemTransitioned(
    data: WorkItemTransitionedEvent,
    context: EventContext,
    changes?: FieldChange[]
  ): Promise<boolean> {
    const event = PmEvents.workItemTransitioned(data, context, changes);
    const success = await eventBus.publish(event);
    
    if (success) {
      logger.info('Published: work_item.transitioned', {
        itemId: data.itemId,
        from: data.from,
        to: data.to,
      });
    }
    
    return success;
  },

  /**
   * Publish sprint started event
   */
  async sprintStarted(
    data: SprintStartedEvent,
    context: EventContext
  ): Promise<boolean> {
    const event = PmEvents.sprintStarted(data, context);
    const success = await eventBus.publish(event);
    
    if (success) {
      logger.info('Published: sprint.started', {
        sprintId: data.sprintId,
        projectId: data.projectId,
        itemCount: data.itemCount,
      });
    }
    
    return success;
  },

  /**
   * Publish sprint completed event
   */
  async sprintCompleted(
    data: SprintCompletedEvent,
    context: EventContext
  ): Promise<boolean> {
    const event = PmEvents.sprintCompleted(data, context);
    const success = await eventBus.publish(event);
    
    if (success) {
      logger.info('Published: sprint.completed', {
        sprintId: data.sprintId,
        velocity: data.velocity,
        completedItems: data.completedItems,
      });
    }
    
    return success;
  },
};

export default PmEventPublisher;
