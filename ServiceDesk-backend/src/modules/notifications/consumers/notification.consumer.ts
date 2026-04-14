/**
 * Notification Consumer
 *
 * Handles domain events that trigger notifications.
 * Moved from shared/events/consumers/notification.consumer.ts
 * into the notifications module for proper domain ownership.
 */

import eventBus from '../../../shared/events/event-bus';
import mongoose from 'mongoose';
import {
  DomainEvent,
  QUEUES,
  ROUTING_PATTERNS,
  WorkOrderCreatedEvent,
  WorkOrderOverdueEvent,
  WorkOrderEscalatedEvent,
  WorkItemTransitionedEvent,
  SprintStartedEvent,
  SprintCompletedEvent,
  ServiceRequestCreatedEvent,
  ServiceRequestAssignedEvent,
  ServiceRequestStatusChangedEvent,
  ServiceRequestApprovedEvent,
  CICreatedEvent,
  CIRetiredEvent,
  WorkflowInstanceStartedEvent,
  WorkflowInstanceTransitionedEvent,
  WorkflowInstanceCompletedEvent,
} from '../../../shared/events/event.types';
import { notificationDispatcher } from '../services/NotificationDispatcher';
import {
  NotificationType,
  NotificationSource,
  NotificationLevel,
} from '../domain/interfaces';
import logger from '../../../utils/logger';

const QUEUE_NAME = QUEUES.NOTIFICATIONS;

/**
 * Initialize notification consumer
 */
export async function initNotificationConsumer(): Promise<void> {
  // Subscribe to all created events
  await eventBus.subscribe(
    QUEUE_NAME,
    ROUTING_PATTERNS.ALL_CREATED,
    handleCreatedEvent
  );

  // Subscribe to transition events
  await eventBus.subscribe(
    QUEUE_NAME,
    ROUTING_PATTERNS.ALL_TRANSITIONS,
    handleTransitionEvent
  );

  // Subscribe to OPS work order events (overdue, escalation)
  await eventBus.subscribe(
    QUEUE_NAME,
    'ops.work_order.overdue',
    handleWorkOrderOverdue
  );

  await eventBus.subscribe(
    QUEUE_NAME,
    'ops.work_order.escalated',
    handleWorkOrderEscalated
  );

  // Subscribe to sprint events
  await eventBus.subscribe(
    QUEUE_NAME,
    'pm.sprint.started',
    handleSprintStarted
  );

  await eventBus.subscribe(
    QUEUE_NAME,
    'pm.sprint.completed',
    handleSprintCompleted
  );

  // Subscribe to ITSM service request events
  await eventBus.subscribe(
    QUEUE_NAME,
    ROUTING_PATTERNS.ITSM_SERVICE_REQUEST_ALL,
    handleItsmServiceRequestEvent
  );

  // Subscribe to ITSM CI events
  await eventBus.subscribe(
    QUEUE_NAME,
    ROUTING_PATTERNS.ITSM_CI_ALL,
    handleItsmCIEvent
  );

  // Subscribe to Workflow instance events
  await eventBus.subscribe(
    QUEUE_NAME,
    ROUTING_PATTERNS.WF_INSTANCE_ALL,
    handleWorkflowEvent
  );

  logger.info('📬 Notification consumer initialized (module-owned)');
}

// ============================================================
// GENERIC HANDLERS
// ============================================================

async function handleCreatedEvent(event: DomainEvent<unknown>): Promise<void> {
  logger.debug('Processing created event for notification', { type: event.type });

  switch (event.type) {
    case 'ops.work_order.created':
      await notifyWorkOrderCreated(event as DomainEvent<WorkOrderCreatedEvent>);
      break;
    case 'pm.work_item.created':
      // Notify assignee if assigned
      break;
    default:
      logger.debug('No notification handler for event type', { type: event.type });
  }
}

async function handleTransitionEvent(event: DomainEvent<unknown>): Promise<void> {
  logger.debug('Processing transition event for notification', { type: event.type });

  if (event.type === 'pm.work_item.transitioned') {
    await notifyWorkItemTransitioned(event as DomainEvent<WorkItemTransitionedEvent>);
  }
}

// ============================================================
// OPS HANDLERS
// ============================================================

async function notifyWorkOrderCreated(
  event: DomainEvent<WorkOrderCreatedEvent>
): Promise<void> {
  const { workOrderId, assigneeId, productName, priority } = event.data;

  if (assigneeId) {
    await notificationDispatcher.dispatch({
      userId: assigneeId,
      type: NotificationType.ASSIGNMENT,
      source: NotificationSource.OPS,
      level: NotificationLevel.INFO,
      title: 'New Work Order Assigned',
      message: `Work order for "${productName}" (priority: ${priority}) has been assigned to you.`,
      relatedEntityId: workOrderId,
      relatedEntityType: 'WorkOrder',
      organizationId: event.organizationId,
      actionRequired: true,
      actionUrl: `/work-orders/${workOrderId}`,
      metadata: { priority },
    });
  }
}

async function handleWorkOrderOverdue(
  event: DomainEvent<WorkOrderOverdueEvent>
): Promise<void> {
  const { workOrderId, assigneeId, overdueMinutes } = event.data;

  logger.warn('Work order overdue - sending urgent notification', {
    workOrderId,
    overdueMinutes,
  });

  if (assigneeId) {
    await notificationDispatcher.dispatch({
      userId: assigneeId,
      type: NotificationType.OVERDUE,
      source: NotificationSource.OPS,
      level: NotificationLevel.WARNING,
      title: 'Work Order Overdue',
      message: `Work order ${workOrderId} is overdue by ${overdueMinutes} minutes.`,
      relatedEntityId: workOrderId,
      relatedEntityType: 'WorkOrder',
      organizationId: event.organizationId,
      actionRequired: true,
      actionUrl: `/work-orders/${workOrderId}`,
      metadata: { overdueMinutes },
    });
  }
}

async function handleWorkOrderEscalated(
  event: DomainEvent<WorkOrderEscalatedEvent>
): Promise<void> {
  const { workOrderId, escalatedTo, reason } = event.data;

  logger.warn('Work order escalated - notifying manager', {
    workOrderId,
    escalatedTo,
    reason,
  });

  if (escalatedTo) {
    await notificationDispatcher.dispatch({
      userId: escalatedTo,
      type: NotificationType.ESCALATION,
      source: NotificationSource.OPS,
      level: NotificationLevel.CRITICAL,
      title: 'Work Order Escalated',
      message: `Work order ${workOrderId} has been escalated. Reason: ${reason}`,
      relatedEntityId: workOrderId,
      relatedEntityType: 'WorkOrder',
      organizationId: event.organizationId,
      isEscalation: true,
      actionRequired: true,
      actionUrl: `/work-orders/${workOrderId}`,
      metadata: { reason },
    });
  }
}

// ============================================================
// PM HANDLERS
// ============================================================

async function notifyWorkItemTransitioned(
  event: DomainEvent<WorkItemTransitionedEvent>
): Promise<void> {
  const { itemId, from, to, transitionedBy } = event.data;

  logger.debug('Work item transitioned', { itemId, from, to, transitionedBy });

  try {
    const Task = mongoose.model('Task');
    const task = await Task.findById(itemId).select('assignee reporter title projectId organizationId').lean() as any;
    if (!task) return;

    const recipients = new Set<string>();
    if (task.assignee) recipients.add(task.assignee.toString());
    if (task.reporter) recipients.add(task.reporter.toString());
    if (transitionedBy) recipients.delete(transitionedBy);

    if (recipients.size === 0) return;

    await notificationDispatcher.dispatchBulk([...recipients], {
      type: NotificationType.STATUS_CHANGE,
      source: NotificationSource.PM,
      level: NotificationLevel.INFO,
      title: 'Task Status Updated',
      message: `Task "${task.title || itemId}" moved from "${from}" to "${to}".`,
      relatedEntityId: itemId,
      relatedEntityType: 'Task',
      projectId: task.projectId?.toString(),
      organizationId: task.organizationId?.toString() || event.organizationId,
      actionUrl: `/projects/${task.projectId}/tasks/${itemId}`,
      metadata: { from, to, transitionedBy },
    });
  } catch (err) {
    logger.error('notifyWorkItemTransitioned failed', { err });
  }
}

async function handleSprintStarted(
  event: DomainEvent<SprintStartedEvent>
): Promise<void> {
  const { sprintId, projectId, itemCount, totalPoints } = event.data;

  logger.info('Sprint started - notifying team', { sprintId, projectId, itemCount, totalPoints });

  try {
    const Project = mongoose.model('PMProject');
    const project = await Project.findById(projectId).select('members organizationId name').lean() as any;
    if (!project) return;

    const memberIds = (project.members || []).map((m: any) => m.userId?.toString() || m.toString()).filter(Boolean);
    if (memberIds.length === 0) return;

    await notificationDispatcher.dispatchBulk(memberIds, {
      type: NotificationType.TASK,
      source: NotificationSource.PM,
      level: NotificationLevel.INFO,
      title: 'Sprint Started',
      message: `A new sprint has started with ${itemCount} tasks (${totalPoints} pts). Time to get to work!`,
      relatedEntityId: sprintId,
      relatedEntityType: 'Sprint',
      projectId: projectId,
      organizationId: project.organizationId?.toString() || event.organizationId,
      actionUrl: `/projects/${projectId}/board`,
      metadata: { sprintId, itemCount, totalPoints },
    });
  } catch (err) {
    logger.error('handleSprintStarted notification failed', { err });
  }
}

async function handleSprintCompleted(
  event: DomainEvent<SprintCompletedEvent>
): Promise<void> {
  const { sprintId, velocity, completedItems, incompleteItems } = event.data;

  logger.info('Sprint completed - sending summary', { sprintId, velocity, completedItems, incompleteItems });

  try {
    const Sprint = mongoose.model('Sprint');
    const sprint = await Sprint.findById(sprintId).select('projectId name').lean() as any;
    if (!sprint) return;

    const Project = mongoose.model('PMProject');
    const project = await Project.findById(sprint.projectId).select('members organizationId').lean() as any;
    if (!project) return;

    const memberIds = (project.members || []).map((m: any) => m.userId?.toString() || m.toString()).filter(Boolean);
    if (memberIds.length === 0) return;

    await notificationDispatcher.dispatchBulk(memberIds, {
      type: NotificationType.COMPLETED,
      source: NotificationSource.PM,
      level: NotificationLevel.INFO,
      title: 'Sprint Completed',
      message: `Sprint finished — ${completedItems} tasks done, ${incompleteItems} carried over. Velocity: ${velocity} pts.`,
      relatedEntityId: sprintId,
      relatedEntityType: 'Sprint',
      projectId: sprint.projectId?.toString(),
      organizationId: project.organizationId?.toString() || event.organizationId,
      actionUrl: `/projects/${sprint.projectId}/backlog`,
      metadata: { sprintId, velocity, completedItems, incompleteItems },
    });
  } catch (err) {
    logger.error('handleSprintCompleted notification failed', { err });
  }
}

// ============================================================
// ITSM HANDLERS
// ============================================================

async function handleItsmServiceRequestEvent(event: DomainEvent<unknown>): Promise<void> {
  logger.debug('Processing ITSM service request event for notification', { type: event.type });

  switch (event.type) {
    case 'itsm.service_request.created': {
      const { requestId, serviceName, requesterId, requesterName } =
        (event as DomainEvent<ServiceRequestCreatedEvent>).data;
      await notificationDispatcher.dispatch({
        userId: requesterId,
        type: NotificationType.STATUS_CHANGE,
        source: NotificationSource.ITSM,
        level: NotificationLevel.INFO,
        title: 'Service Request Created',
        message: `Your service request for "${serviceName}" has been created.`,
        relatedEntityId: requestId,
        relatedEntityType: 'ServiceRequest',
        organizationId: event.organizationId,
        actionUrl: `/itsm/service-requests/${requestId}`,
        metadata: { requesterName },
      });
      break;
    }
    case 'itsm.service_request.assigned': {
      const { requestId, assignedTo } =
        (event as DomainEvent<ServiceRequestAssignedEvent>).data;
      await notificationDispatcher.dispatch({
        userId: assignedTo,
        type: NotificationType.ASSIGNMENT,
        source: NotificationSource.ITSM,
        level: NotificationLevel.INFO,
        title: 'Service Request Assigned',
        message: `Service request ${requestId} has been assigned to you.`,
        relatedEntityId: requestId,
        relatedEntityType: 'ServiceRequest',
        organizationId: event.organizationId,
        actionRequired: true,
        actionUrl: `/itsm/service-requests/${requestId}`,
      });
      break;
    }
    case 'itsm.service_request.status_changed': {
      const { requestId, oldStatus, newStatus, requesterId } =
        (event as DomainEvent<ServiceRequestStatusChangedEvent>).data as ServiceRequestStatusChangedEvent & { requesterId?: string };
      if (requesterId) {
        await notificationDispatcher.dispatch({
          userId: requesterId,
          type: NotificationType.STATUS_CHANGE,
          source: NotificationSource.ITSM,
          level: NotificationLevel.INFO,
          title: 'Service Request Updated',
          message: `Your service request status changed from "${oldStatus}" to "${newStatus}".`,
          relatedEntityId: requestId,
          relatedEntityType: 'ServiceRequest',
          organizationId: event.organizationId,
          actionUrl: `/self-service/requests/${requestId}`,
          metadata: { oldStatus, newStatus },
        });
      }
      break;
    }
    case 'itsm.service_request.approved': {
      const { requestId, approvedBy, requesterId } =
        (event as DomainEvent<ServiceRequestApprovedEvent>).data as ServiceRequestApprovedEvent & { requesterId?: string };
      if (requesterId) {
        await notificationDispatcher.dispatch({
          userId: requesterId,
          type: NotificationType.APPROVAL,
          source: NotificationSource.ITSM,
          level: NotificationLevel.INFO,
          title: 'Service Request Approved',
          message: `Your service request has been approved.`,
          relatedEntityId: requestId,
          relatedEntityType: 'ServiceRequest',
          organizationId: event.organizationId,
          actionRequired: false,
          actionUrl: `/self-service/requests/${requestId}`,
          metadata: { approvedBy },
        });
      }
      break;
    }
    default:
      break;
  }
}

async function handleItsmCIEvent(event: DomainEvent<unknown>): Promise<void> {
  logger.debug('Processing ITSM CI event for notification', { type: event.type });

  switch (event.type) {
    case 'itsm.ci.created': {
      const { ciId, name, ciType, createdBy } = (event as DomainEvent<CICreatedEvent>).data as CICreatedEvent & { createdBy?: string };
      logger.info('CI created', { ciId, name, ciType });
      if (createdBy) {
        await notificationDispatcher.dispatch({
          userId: createdBy,
          type: NotificationType.SYSTEM,
          source: NotificationSource.ITSM,
          level: NotificationLevel.INFO,
          title: 'CI Added to CMDB',
          message: `Configuration item "${name}" (${ciType}) has been registered in the CMDB.`,
          relatedEntityId: ciId,
          relatedEntityType: 'CI',
          organizationId: event.organizationId,
          actionUrl: `/cmdb/${ciId}`,
        });
      }
      break;
    }
    case 'itsm.ci.retired': {
      const { ciId, name, retiredBy } = (event as DomainEvent<CIRetiredEvent>).data as CIRetiredEvent & { retiredBy?: string };
      logger.warn('CI retired', { ciId, name });
      if (retiredBy) {
        await notificationDispatcher.dispatch({
          userId: retiredBy,
          type: NotificationType.SYSTEM,
          source: NotificationSource.ITSM,
          level: NotificationLevel.WARNING,
          title: 'CI Retired',
          message: `Configuration item "${name}" has been retired from the CMDB.`,
          relatedEntityId: ciId,
          relatedEntityType: 'CI',
          organizationId: event.organizationId,
          actionUrl: `/cmdb`,
        });
      }
      break;
    }
    default:
      break;
  }
}

// ============================================================
// WORKFLOW HANDLERS
// ============================================================

async function handleWorkflowEvent(event: DomainEvent<unknown>): Promise<void> {
  logger.debug('Processing workflow event for notification', { type: event.type });

  switch (event.type) {
    case 'wf.instance.started': {
      const { instanceId, definitionName, startedBy } =
        (event as DomainEvent<WorkflowInstanceStartedEvent>).data;
      logger.info('Workflow started', { instanceId, definitionName, startedBy });
      if (startedBy) {
        await notificationDispatcher.dispatch({
          userId: startedBy,
          type: NotificationType.WORKFLOW_STARTED,
          source: NotificationSource.WORKFLOW,
          level: NotificationLevel.INFO,
          title: 'Workflow Started',
          message: `Workflow "${definitionName}" has been started.`,
          relatedEntityId: instanceId,
          relatedEntityType: 'WorkflowInstance',
          organizationId: event.organizationId,
          actionUrl: `/workflows/instances/${instanceId}`,
        });
      }
      break;
    }
    case 'wf.instance.transitioned': {
      const { instanceId, fromState, toState, assigneeId } =
        (event as DomainEvent<WorkflowInstanceTransitionedEvent>).data as WorkflowInstanceTransitionedEvent & { assigneeId?: string };
      logger.info('Workflow transitioned', { instanceId, fromState, toState });
      if (assigneeId) {
        await notificationDispatcher.dispatch({
          userId: assigneeId,
          type: NotificationType.WORKFLOW_TRANSITIONED,
          source: NotificationSource.WORKFLOW,
          level: NotificationLevel.INFO,
          title: 'Workflow Step Ready',
          message: `A workflow has moved to "${toState}" and requires your attention.`,
          relatedEntityId: instanceId,
          relatedEntityType: 'WorkflowInstance',
          organizationId: event.organizationId,
          actionRequired: true,
          actionUrl: `/workflows/instances/${instanceId}`,
          metadata: { fromState, toState },
        });
      }
      break;
    }
    case 'wf.instance.completed': {
      const { instanceId, definitionId, initiatorId } =
        (event as DomainEvent<WorkflowInstanceCompletedEvent>).data as WorkflowInstanceCompletedEvent & { initiatorId?: string };
      logger.info('Workflow completed', { instanceId, definitionId });
      if (initiatorId) {
        await notificationDispatcher.dispatch({
          userId: initiatorId,
          type: NotificationType.WORKFLOW_COMPLETED,
          source: NotificationSource.WORKFLOW,
          level: NotificationLevel.INFO,
          title: 'Workflow Completed',
          message: `Your workflow instance has completed successfully.`,
          relatedEntityId: instanceId,
          relatedEntityType: 'WorkflowInstance',
          organizationId: event.organizationId,
          actionUrl: `/workflows/instances/${instanceId}`,
        });
      }
      break;
    }
    default:
      break;
  }
}

export default initNotificationConsumer;
