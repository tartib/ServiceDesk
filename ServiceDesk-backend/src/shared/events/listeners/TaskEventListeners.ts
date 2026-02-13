import { EventListener } from '../EventListener';
import { DomainEvent } from '../DomainEvent';
import { TaskStatusChangedEvent, TaskCompletedEvent, TaskAssignedEvent } from '../domain/TaskEvents';
import logger from '../../../utils/logger';

/**
 * Listener for task status changes
 * Updates related entities and triggers workflows
 */
export class TaskStatusChangeListener extends EventListener {
  getEventType(): string {
    return 'TaskStatusChanged';
  }

  async handle(event: DomainEvent): Promise<void> {
    const statusChangeEvent = event as TaskStatusChangedEvent;

    logger.info(`Task status changed: ${statusChangeEvent.aggregateId}`, {
      oldStatus: statusChangeEvent.oldStatus,
      newStatus: statusChangeEvent.newStatus,
      changedBy: statusChangeEvent.changedBy,
    });

    // Example: Update project metrics
    // await projectService.updateMetrics(statusChangeEvent);

    // Example: Trigger notifications
    // await notificationService.notifyTaskStatusChange(statusChangeEvent);

    // Example: Update sprint board
    // await sprintService.updateBoardStatus(statusChangeEvent);
  }
}

/**
 * Listener for task completion
 * Triggers downstream processes and updates metrics
 */
export class TaskCompletionListener extends EventListener {
  getEventType(): string {
    return 'TaskCompleted';
  }

  async handle(event: DomainEvent): Promise<void> {
    const completionEvent = event as TaskCompletedEvent;

    logger.info(`Task completed: ${completionEvent.aggregateId}`, {
      completedBy: completionEvent.completedBy,
      completionNotes: completionEvent.completionNotes,
    });

    // Example: Update project completion percentage
    // await projectService.updateCompletionPercentage(completionEvent);

    // Example: Check if sprint is complete
    // await sprintService.checkSprintCompletion(completionEvent);

    // Example: Award user badges/points
    // await gamificationService.awardPoints(completionEvent);
  }
}

/**
 * Listener for task assignment
 * Notifies assignee and updates workload
 */
export class TaskAssignmentListener extends EventListener {
  getEventType(): string {
    return 'TaskAssigned';
  }

  async handle(event: DomainEvent): Promise<void> {
    const assignmentEvent = event as TaskAssignedEvent;

    logger.info(`Task assigned: ${assignmentEvent.aggregateId}`, {
      assignedTo: assignmentEvent.assignedTo,
      assignedBy: assignmentEvent.assignedBy,
    });

    // Example: Send notification to assignee
    // await notificationService.notifyTaskAssignment(assignmentEvent);

    // Example: Update user workload
    // await userService.updateWorkload(assignmentEvent);

    // Example: Update team capacity
    // await teamService.updateCapacity(assignmentEvent);
  }
}
