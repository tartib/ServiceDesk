import { DomainEvent } from '../DomainEvent';

export class IncidentCreatedEvent extends DomainEvent {
  constructor(
    incidentId: string,
    public readonly title: string,
    public readonly priority: string,
    public readonly createdBy: string,
  ) {
    super(incidentId, 'Incident');
  }

  getEventType(): string {
    return 'IncidentCreated';
  }

  getEventData(): Record<string, unknown> {
    return {
      title: this.title,
      priority: this.priority,
      createdBy: this.createdBy,
    };
  }
}

export class IncidentStatusChangedEvent extends DomainEvent {
  constructor(
    incidentId: string,
    public readonly oldStatus: string,
    public readonly newStatus: string,
    public readonly changedBy: string,
  ) {
    super(incidentId, 'Incident');
  }

  getEventType(): string {
    return 'IncidentStatusChanged';
  }

  getEventData(): Record<string, unknown> {
    return {
      oldStatus: this.oldStatus,
      newStatus: this.newStatus,
      changedBy: this.changedBy,
    };
  }
}

export class IncidentAssignedEvent extends DomainEvent {
  constructor(
    incidentId: string,
    public readonly assignedTo: string,
    public readonly assignedBy: string,
  ) {
    super(incidentId, 'Incident');
  }

  getEventType(): string {
    return 'IncidentAssigned';
  }

  getEventData(): Record<string, unknown> {
    return {
      assignedTo: this.assignedTo,
      assignedBy: this.assignedBy,
    };
  }
}

export class IncidentResolvedEvent extends DomainEvent {
  constructor(
    incidentId: string,
    public readonly resolvedBy: string,
    public readonly resolution: string,
  ) {
    super(incidentId, 'Incident');
  }

  getEventType(): string {
    return 'IncidentResolved';
  }

  getEventData(): Record<string, unknown> {
    return {
      resolvedBy: this.resolvedBy,
      resolution: this.resolution,
    };
  }
}

export class IncidentClosedEvent extends DomainEvent {
  constructor(
    incidentId: string,
    public readonly closedBy: string,
    public readonly feedback?: string,
  ) {
    super(incidentId, 'Incident');
  }

  getEventType(): string {
    return 'IncidentClosed';
  }

  getEventData(): Record<string, unknown> {
    return {
      closedBy: this.closedBy,
      feedback: this.feedback,
    };
  }
}
