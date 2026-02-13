import { EventListener } from '../EventListener';
import { DomainEvent } from '../DomainEvent';
import { IncidentStatusChangedEvent, IncidentResolvedEvent, IncidentAssignedEvent } from '../domain/IncidentEvents';
import logger from '../../../utils/logger';

/**
 * Listener for incident status changes
 * Updates SLA timers, notifications, and metrics
 */
export class IncidentStatusChangeListener extends EventListener {
  getEventType(): string {
    return 'IncidentStatusChanged';
  }

  async handle(event: DomainEvent): Promise<void> {
    const statusChangeEvent = event as IncidentStatusChangedEvent;

    logger.info(`Incident status changed: ${statusChangeEvent.aggregateId}`, {
      oldStatus: statusChangeEvent.oldStatus,
      newStatus: statusChangeEvent.newStatus,
      changedBy: statusChangeEvent.changedBy,
    });

    // Example: Update SLA timers
    // await slaService.updateSLATimer(statusChangeEvent);

    // Example: Send notifications
    // await notificationService.notifyIncidentStatusChange(statusChangeEvent);

    // Example: Update incident metrics
    // await analyticsService.recordIncidentStatusChange(statusChangeEvent);
  }
}

/**
 * Listener for incident resolution
 * Triggers closure workflow and satisfaction surveys
 */
export class IncidentResolutionListener extends EventListener {
  getEventType(): string {
    return 'IncidentResolved';
  }

  async handle(event: DomainEvent): Promise<void> {
    const resolutionEvent = event as IncidentResolvedEvent;

    logger.info(`Incident resolved: ${resolutionEvent.aggregateId}`, {
      resolvedBy: resolutionEvent.resolvedBy,
      resolution: resolutionEvent.resolution,
    });

    // Example: Send satisfaction survey
    // await surveyService.sendSatisfactionSurvey(resolutionEvent);

    // Example: Update knowledge base
    // await knowledgeBaseService.recordResolution(resolutionEvent);

    // Example: Update team metrics
    // await teamService.updateResolutionMetrics(resolutionEvent);
  }
}

/**
 * Listener for incident assignment
 * Notifies assignee and updates workload
 */
export class IncidentAssignmentListener extends EventListener {
  getEventType(): string {
    return 'IncidentAssigned';
  }

  async handle(event: DomainEvent): Promise<void> {
    const assignmentEvent = event as IncidentAssignedEvent;

    logger.info(`Incident assigned: ${assignmentEvent.aggregateId}`, {
      assignedTo: assignmentEvent.assignedTo,
      assignedBy: assignmentEvent.assignedBy,
    });

    // Example: Send notification to assignee
    // await notificationService.notifyIncidentAssignment(assignmentEvent);

    // Example: Start SLA timer
    // await slaService.startSLATimer(assignmentEvent);

    // Example: Update team workload
    // await teamService.updateWorkload(assignmentEvent);
  }
}
