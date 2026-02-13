import { DomainEvent } from '../DomainEvent';

export class TaskCreatedEvent extends DomainEvent {
  constructor(
    taskId: string,
    public readonly title: string,
    public readonly projectId: string,
    public readonly createdBy: string,
  ) {
    super(taskId, 'Task');
  }

  getEventType(): string {
    return 'TaskCreated';
  }

  getEventData(): Record<string, unknown> {
    return {
      title: this.title,
      projectId: this.projectId,
      createdBy: this.createdBy,
    };
  }
}

export class TaskStatusChangedEvent extends DomainEvent {
  constructor(
    taskId: string,
    public readonly oldStatus: string,
    public readonly newStatus: string,
    public readonly changedBy: string,
  ) {
    super(taskId, 'Task');
  }

  getEventType(): string {
    return 'TaskStatusChanged';
  }

  getEventData(): Record<string, unknown> {
    return {
      oldStatus: this.oldStatus,
      newStatus: this.newStatus,
      changedBy: this.changedBy,
    };
  }
}

export class TaskAssignedEvent extends DomainEvent {
  constructor(
    taskId: string,
    public readonly assignedTo: string,
    public readonly assignedBy: string,
  ) {
    super(taskId, 'Task');
  }

  getEventType(): string {
    return 'TaskAssigned';
  }

  getEventData(): Record<string, unknown> {
    return {
      assignedTo: this.assignedTo,
      assignedBy: this.assignedBy,
    };
  }
}

export class TaskCompletedEvent extends DomainEvent {
  constructor(
    taskId: string,
    public readonly completedBy: string,
    public readonly completionNotes?: string,
  ) {
    super(taskId, 'Task');
  }

  getEventType(): string {
    return 'TaskCompleted';
  }

  getEventData(): Record<string, unknown> {
    return {
      completedBy: this.completedBy,
      completionNotes: this.completionNotes,
    };
  }
}

export class TaskDeletedEvent extends DomainEvent {
  constructor(
    taskId: string,
    public readonly deletedBy: string,
    public readonly reason?: string,
  ) {
    super(taskId, 'Task');
  }

  getEventType(): string {
    return 'TaskDeleted';
  }

  getEventData(): Record<string, unknown> {
    return {
      deletedBy: this.deletedBy,
      reason: this.reason,
    };
  }
}
