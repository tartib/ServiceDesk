/**
 * ITSM Domain Event Publisher
 *
 * Publishes service request, CMDB, and automation rule events
 */

import eventBus from '../event-bus';
import { ItsmEvents } from '../event-factory';
import {
  ServiceRequestCreatedEvent,
  ServiceRequestStatusChangedEvent,
  ServiceRequestApprovedEvent,
  ServiceRequestAssignedEvent,
  ServiceRequestCancelledEvent,
  CICreatedEvent,
  CIUpdatedEvent,
  CIRetiredEvent,
  AutomationRuleTriggeredEvent,
  AutomationRuleExecutedEvent,
} from '../event.types';
import logger from '../../../utils/logger';

interface EventContext {
  organizationId: string;
  userId: string;
  correlationId?: string;
}

export const ItsmEventPublisher = {
  // ---- Service Requests ----

  async serviceRequestCreated(
    data: ServiceRequestCreatedEvent,
    context: EventContext
  ): Promise<boolean> {
    const event = ItsmEvents.serviceRequestCreated(data, context);
    const success = await eventBus.publish(event);
    if (success) {
      logger.info('Published: itsm.service_request.created', {
        requestId: data.requestId,
        serviceId: data.serviceId,
      });
    }
    return success;
  },

  async serviceRequestStatusChanged(
    data: ServiceRequestStatusChangedEvent,
    context: EventContext
  ): Promise<boolean> {
    const event = ItsmEvents.serviceRequestStatusChanged(data, context);
    const success = await eventBus.publish(event);
    if (success) {
      logger.info('Published: itsm.service_request.status_changed', {
        requestId: data.requestId,
        from: data.oldStatus,
        to: data.newStatus,
      });
    }
    return success;
  },

  async serviceRequestApproved(
    data: ServiceRequestApprovedEvent,
    context: EventContext
  ): Promise<boolean> {
    const event = ItsmEvents.serviceRequestApproved(data, context);
    const success = await eventBus.publish(event);
    if (success) {
      logger.info('Published: itsm.service_request.approved', {
        requestId: data.requestId,
        approvedBy: data.approvedBy,
      });
    }
    return success;
  },

  async serviceRequestAssigned(
    data: ServiceRequestAssignedEvent,
    context: EventContext
  ): Promise<boolean> {
    const event = ItsmEvents.serviceRequestAssigned(data, context);
    const success = await eventBus.publish(event);
    if (success) {
      logger.info('Published: itsm.service_request.assigned', {
        requestId: data.requestId,
        assignedTo: data.assignedTo,
      });
    }
    return success;
  },

  async serviceRequestCancelled(
    data: ServiceRequestCancelledEvent,
    context: EventContext
  ): Promise<boolean> {
    const event = ItsmEvents.serviceRequestCancelled(data, context);
    const success = await eventBus.publish(event);
    if (success) {
      logger.info('Published: itsm.service_request.cancelled', {
        requestId: data.requestId,
      });
    }
    return success;
  },

  // ---- CMDB ----

  async ciCreated(
    data: CICreatedEvent,
    context: EventContext
  ): Promise<boolean> {
    const event = ItsmEvents.ciCreated(data, context);
    const success = await eventBus.publish(event);
    if (success) {
      logger.info('Published: itsm.ci.created', {
        ciId: data.ciId,
        ciType: data.ciType,
      });
    }
    return success;
  },

  async ciUpdated(
    data: CIUpdatedEvent,
    context: EventContext
  ): Promise<boolean> {
    const event = ItsmEvents.ciUpdated(data, context);
    const success = await eventBus.publish(event);
    if (success) {
      logger.info('Published: itsm.ci.updated', {
        ciId: data.ciId,
        changesCount: data.changes.length,
      });
    }
    return success;
  },

  async ciRetired(
    data: CIRetiredEvent,
    context: EventContext
  ): Promise<boolean> {
    const event = ItsmEvents.ciRetired(data, context);
    const success = await eventBus.publish(event);
    if (success) {
      logger.warn('Published: itsm.ci.retired', {
        ciId: data.ciId,
        name: data.name,
      });
    }
    return success;
  },

  // ---- Automation Rules ----

  async automationRuleTriggered(
    data: AutomationRuleTriggeredEvent,
    context: EventContext
  ): Promise<boolean> {
    const event = ItsmEvents.automationRuleTriggered(data, context);
    const success = await eventBus.publish(event);
    if (success) {
      logger.info('Published: itsm.automation_rule.triggered', {
        ruleId: data.ruleId,
        triggerType: data.triggerType,
      });
    }
    return success;
  },

  async automationRuleExecuted(
    data: AutomationRuleExecutedEvent,
    context: EventContext
  ): Promise<boolean> {
    const event = ItsmEvents.automationRuleExecuted(data, context);
    const success = await eventBus.publish(event);
    if (success) {
      logger.info('Published: itsm.automation_rule.executed', {
        ruleId: data.ruleId,
        success: data.success,
        duration: data.duration,
      });
    }
    return success;
  },
};

export default ItsmEventPublisher;
