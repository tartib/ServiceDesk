/**
 * OPS Domain Event Publisher
 * 
 * Publishes work order related events to RabbitMQ
 */

import eventBus from '../event-bus';
import { OpsEvents } from '../event-factory';
import {
  WorkOrderCreatedEvent,
  WorkOrderStartedEvent,
  WorkOrderCompletedEvent,
  WorkOrderOverdueEvent,
  WorkOrderEscalatedEvent,
} from '../event.types';
import logger from '../../../../../utils/logger';

interface EventContext {
  organizationId: string;
  userId: string;
  correlationId?: string;
}

export const OpsEventPublisher = {
  /**
   * Publish work order created event
   */
  async workOrderCreated(
    data: WorkOrderCreatedEvent,
    context: EventContext
  ): Promise<boolean> {
    const event = OpsEvents.workOrderCreated(data, context);
    const success = await eventBus.publish(event);
    
    if (success) {
      logger.info('Published: work_order.created', {
        workOrderId: data.workOrderId,
        type: data.type,
      });
    }
    
    return success;
  },

  /**
   * Publish work order started event
   */
  async workOrderStarted(
    data: WorkOrderStartedEvent,
    context: EventContext
  ): Promise<boolean> {
    const event = OpsEvents.workOrderStarted(data, context);
    const success = await eventBus.publish(event);
    
    if (success) {
      logger.info('Published: work_order.started', {
        workOrderId: data.workOrderId,
      });
    }
    
    return success;
  },

  /**
   * Publish work order completed event
   */
  async workOrderCompleted(
    data: WorkOrderCompletedEvent,
    context: EventContext
  ): Promise<boolean> {
    const event = OpsEvents.workOrderCompleted(data, context);
    const success = await eventBus.publish(event);
    
    if (success) {
      logger.info('Published: work_order.completed', {
        workOrderId: data.workOrderId,
        performanceScore: data.performanceScore,
      });
    }
    
    return success;
  },

  /**
   * Publish work order overdue event
   */
  async workOrderOverdue(
    data: WorkOrderOverdueEvent,
    context: EventContext
  ): Promise<boolean> {
    const event = OpsEvents.workOrderOverdue(data, context);
    const success = await eventBus.publish(event);
    
    if (success) {
      logger.warn('Published: work_order.overdue', {
        workOrderId: data.workOrderId,
        overdueMinutes: data.overdueMinutes,
      });
    }
    
    return success;
  },

  /**
   * Publish work order escalated event
   */
  async workOrderEscalated(
    data: WorkOrderEscalatedEvent,
    context: EventContext
  ): Promise<boolean> {
    const event = OpsEvents.workOrderEscalated(data, context);
    const success = await eventBus.publish(event);
    
    if (success) {
      logger.warn('Published: work_order.escalated', {
        workOrderId: data.workOrderId,
        escalatedTo: data.escalatedTo,
      });
    }
    
    return success;
  },
};

export default OpsEventPublisher;
