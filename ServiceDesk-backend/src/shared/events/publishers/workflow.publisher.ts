/**
 * Workflow Domain Event Publisher
 *
 * Publishes workflow instance lifecycle events
 */

import eventBus from '../event-bus';
import { WorkflowEvents } from '../event-factory';
import {
  WorkflowInstanceStartedEvent,
  WorkflowInstanceTransitionedEvent,
  WorkflowInstanceCompletedEvent,
  WorkflowInstanceCancelledEvent,
} from '../event.types';
import logger from '../../../utils/logger';

interface EventContext {
  organizationId: string;
  userId: string;
  correlationId?: string;
}

export const WorkflowEventPublisher = {
  async instanceStarted(
    data: WorkflowInstanceStartedEvent,
    context: EventContext
  ): Promise<boolean> {
    const event = WorkflowEvents.instanceStarted(data, context);
    const success = await eventBus.publish(event);
    if (success) {
      logger.info('Published: wf.instance.started', {
        instanceId: data.instanceId,
        definitionId: data.definitionId,
      });
    }
    return success;
  },

  async instanceTransitioned(
    data: WorkflowInstanceTransitionedEvent,
    context: EventContext
  ): Promise<boolean> {
    const event = WorkflowEvents.instanceTransitioned(data, context);
    const success = await eventBus.publish(event);
    if (success) {
      logger.info('Published: wf.instance.transitioned', {
        instanceId: data.instanceId,
        from: data.fromState,
        to: data.toState,
      });
    }
    return success;
  },

  async instanceCompleted(
    data: WorkflowInstanceCompletedEvent,
    context: EventContext
  ): Promise<boolean> {
    const event = WorkflowEvents.instanceCompleted(data, context);
    const success = await eventBus.publish(event);
    if (success) {
      logger.info('Published: wf.instance.completed', {
        instanceId: data.instanceId,
        duration: data.duration,
      });
    }
    return success;
  },

  async instanceCancelled(
    data: WorkflowInstanceCancelledEvent,
    context: EventContext
  ): Promise<boolean> {
    const event = WorkflowEvents.instanceCancelled(data, context);
    const success = await eventBus.publish(event);
    if (success) {
      logger.warn('Published: wf.instance.cancelled', {
        instanceId: data.instanceId,
        reason: data.reason,
      });
    }
    return success;
  },
};

export default WorkflowEventPublisher;
