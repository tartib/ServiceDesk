import { IIncident } from '../entities/Incident';
import Counter from '../entities/Counter';
import {
  IncidentStatus,
  Priority,
  Impact,
  Urgency,
  Channel,
  IRequester,
  IAssignee,
  calculatePriority,
} from '../types/itsm.types';
import incidentRepository from '../repositories/IncidentRepository';
import slaEngine from './SLAEngine';
import logger from '../../utils/logger';
import ApiError from '../../utils/ApiError';

export interface CreateIncidentDTO {
  title: string;
  description: string;
  impact: Impact;
  urgency: Urgency;
  category_id: string;
  subcategory_id?: string;
  requester: IRequester;
  channel: Channel;
  site_id: string;
  tags?: string[];
  is_major?: boolean;
}

export interface UpdateIncidentDTO {
  title?: string;
  description?: string;
  impact?: Impact;
  urgency?: Urgency;
  category_id?: string;
  subcategory_id?: string;
  tags?: string[];
  is_major?: boolean;
}

export class IncidentService {
  /**
   * Create a new incident
   */
  async createIncident(data: CreateIncidentDTO): Promise<IIncident> {
    // Generate incident ID
    const incidentId = await Counter.generateId('INC');

    // Calculate priority from impact and urgency
    const priority = calculatePriority(data.impact, data.urgency);

    // Calculate SLA
    const slaConfig = await slaEngine.calculateSLA(
      priority,
      data.category_id,
      data.site_id
    );

    const incident = await incidentRepository.create({
      incident_id: incidentId,
      title: data.title,
      description: data.description,
      status: IncidentStatus.OPEN,
      priority,
      impact: data.impact,
      urgency: data.urgency,
      category_id: data.category_id,
      subcategory_id: data.subcategory_id,
      requester: data.requester,
      channel: data.channel,
      sla: slaConfig,
      site_id: data.site_id,
      tags: data.tags || [],
      is_major: data.is_major || false,
      reopen_count: 0,
      worklogs: [],
      attachments: [],
      timeline: [],
    } as Partial<IIncident>);

    logger.info(`Incident created: ${incidentId}`, {
      priority,
      category: data.category_id,
      requester: data.requester.id,
    });

    return incident;
  }

  /**
   * Get incident by ID
   */
  async getIncident(incidentId: string): Promise<IIncident> {
    const incident = await incidentRepository.findByIncidentId(incidentId);
    if (!incident) {
      throw new ApiError(404, `Incident ${incidentId} not found`);
    }
    return incident;
  }

  /**
   * Update incident
   */
  async updateIncident(
    incidentId: string,
    data: UpdateIncidentDTO,
    userId: string,
    userName: string
  ): Promise<IIncident> {
    const incident = await this.getIncident(incidentId);

    // Recalculate priority if impact or urgency changed
    let priority = incident.priority;
    if (data.impact || data.urgency) {
      priority = calculatePriority(
        data.impact || incident.impact,
        data.urgency || incident.urgency
      );
    }

    const updateData: any = {
      ...data,
      priority,
    };

    // Add timeline event
    await incidentRepository.addTimelineEvent(incidentId, {
      event: 'Incident Updated',
      by: userId,
      by_name: userName,
      details: data,
    });

    const updated = await incidentRepository.update(incident._id.toString(), updateData);
    if (!updated) {
      throw new ApiError(500, 'Failed to update incident');
    }

    logger.info(`Incident updated: ${incidentId}`, { updatedBy: userId });

    return updated;
  }

  /**
   * Assign technician to incident
   */
  async assignIncident(
    incidentId: string,
    assignee: IAssignee,
    assignedBy: string,
    assignedByName: string
  ): Promise<IIncident> {
    const incident = await this.getIncident(incidentId);

    if (incident.status === IncidentStatus.CLOSED) {
      throw new ApiError(400, 'Cannot assign a closed incident');
    }

    const updated = await incidentRepository.assignTechnician(
      incidentId,
      assignee,
      assignedBy,
      assignedByName
    );

    if (!updated) {
      throw new ApiError(500, 'Failed to assign incident');
    }

    // Mark first response if this is the first assignment
    if (!incident.first_response_at) {
      updated.first_response_at = new Date();
      updated.sla = slaEngine.markResponseMet(updated.sla);
      await updated.save();
    }

    logger.info(`Incident assigned: ${incidentId} -> ${assignee.name}`, {
      assignedBy,
    });

    return updated;
  }

  /**
   * Update incident status
   */
  async updateStatus(
    incidentId: string,
    status: IncidentStatus,
    userId: string,
    userName: string,
    resolution?: { code: string; notes: string }
  ): Promise<IIncident> {
    const incident = await this.getIncident(incidentId);

    // Validate status transition
    this.validateStatusTransition(incident.status, status);

    // Handle resolution
    if (status === IncidentStatus.RESOLVED && resolution) {
      incident.resolution = {
        code: resolution.code,
        notes: resolution.notes,
        resolved_by: userId,
        resolved_by_name: userName,
        resolved_at: new Date(),
      };
      incident.sla = slaEngine.markResolutionMet(incident.sla);
    }

    // Handle reopen
    if (status === IncidentStatus.OPEN && incident.status === IncidentStatus.RESOLVED) {
      incident.reopen_count += 1;
    }

    const updated = await incidentRepository.updateStatus(
      incidentId,
      status,
      userId,
      userName
    );

    if (!updated) {
      throw new ApiError(500, 'Failed to update incident status');
    }

    logger.info(`Incident status updated: ${incidentId} -> ${status}`, {
      updatedBy: userId,
    });

    return updated;
  }

  /**
   * Add worklog to incident
   */
  async addWorklog(
    incidentId: string,
    worklog: {
      by: string;
      by_name: string;
      minutes_spent: number;
      note: string;
      is_internal: boolean;
    }
  ): Promise<IIncident> {
    const incident = await this.getIncident(incidentId);

    if (incident.status === IncidentStatus.CLOSED) {
      throw new ApiError(400, 'Cannot add worklog to a closed incident');
    }

    const logId = `WL-${Date.now()}`;

    const updated = await incidentRepository.addWorklog(incidentId, {
      log_id: logId,
      ...worklog,
    });

    if (!updated) {
      throw new ApiError(500, 'Failed to add worklog');
    }

    logger.info(`Worklog added to incident: ${incidentId}`, {
      logId,
      minutes: worklog.minutes_spent,
    });

    return updated;
  }

  /**
   * Escalate incident
   */
  async escalateIncident(
    incidentId: string,
    reason: string,
    escalatedBy: string,
    escalatedByName: string
  ): Promise<IIncident> {
    const incident = await this.getIncident(incidentId);

    const newLevel = incident.sla.escalation_level + 1;

    // Get escalation details
    const escalationDetails = await slaEngine.getEscalationDetails(
      incident.sla.sla_id,
      newLevel
    );

    incident.sla.escalation_level = newLevel;

    await incidentRepository.addTimelineEvent(incidentId, {
      event: `Escalated to Level ${newLevel}`,
      by: escalatedBy,
      by_name: escalatedByName,
      details: { reason, escalation: escalationDetails },
    });

    await incident.save();

    logger.info(`Incident escalated: ${incidentId} -> Level ${newLevel}`, {
      escalatedBy,
      reason,
    });

    return incident;
  }

  /**
   * Link incident to problem
   */
  async linkToProblem(
    incidentId: string,
    problemId: string,
    userId: string,
    userName: string
  ): Promise<IIncident> {
    const incident = await this.getIncident(incidentId);

    incident.linked_problem_id = problemId;

    await incidentRepository.addTimelineEvent(incidentId, {
      event: `Linked to Problem ${problemId}`,
      by: userId,
      by_name: userName,
    });

    await incident.save();

    logger.info(`Incident linked to problem: ${incidentId} -> ${problemId}`);

    return incident;
  }

  /**
   * Get incidents by various filters
   */
  async getIncidents(filters: {
    status?: IncidentStatus[];
    priority?: Priority[];
    assignee?: string;
    requester?: string;
    site_id?: string;
    category_id?: string;
    is_major?: boolean;
    breached?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    data: IIncident[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const query: any = {};

    if (filters.status?.length) {
      query.status = { $in: filters.status };
    }
    if (filters.priority?.length) {
      query.priority = { $in: filters.priority };
    }
    if (filters.assignee) {
      query['assigned_to.technician_id'] = filters.assignee;
    }
    if (filters.requester) {
      query['requester.id'] = filters.requester;
    }
    if (filters.site_id) {
      query.site_id = filters.site_id;
    }
    if (filters.category_id) {
      query.category_id = filters.category_id;
    }
    if (filters.is_major !== undefined) {
      query.is_major = filters.is_major;
    }
    if (filters.breached) {
      query['sla.breach_flag'] = true;
    }

    return incidentRepository.findWithPagination(
      query,
      filters.page || 1,
      filters.limit || 20,
      { priority: -1, created_at: -1 }
    );
  }

  /**
   * Get incident statistics
   */
  async getStats(siteId?: string) {
    return incidentRepository.getIncidentStats(siteId);
  }

  /**
   * Search incidents
   */
  async searchIncidents(query: string): Promise<IIncident[]> {
    return incidentRepository.searchIncidents(query);
  }

  /**
   * Get open incidents
   */
  async getOpenIncidents(): Promise<IIncident[]> {
    return incidentRepository.findOpenIncidents();
  }

  /**
   * Get breached incidents
   */
  async getBreachedIncidents(): Promise<IIncident[]> {
    return incidentRepository.findBreachedIncidents();
  }

  /**
   * Get unassigned incidents
   */
  async getUnassignedIncidents(): Promise<IIncident[]> {
    return incidentRepository.findUnassigned();
  }

  /**
   * Get major incidents
   */
  async getMajorIncidents(): Promise<IIncident[]> {
    return incidentRepository.findMajorIncidents();
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(
    currentStatus: IncidentStatus,
    newStatus: IncidentStatus
  ): void {
    const validTransitions: Record<IncidentStatus, IncidentStatus[]> = {
      [IncidentStatus.OPEN]: [
        IncidentStatus.IN_PROGRESS,
        IncidentStatus.PENDING,
        IncidentStatus.RESOLVED,
        IncidentStatus.CANCELLED,
      ],
      [IncidentStatus.IN_PROGRESS]: [
        IncidentStatus.PENDING,
        IncidentStatus.RESOLVED,
        IncidentStatus.CANCELLED,
      ],
      [IncidentStatus.PENDING]: [
        IncidentStatus.IN_PROGRESS,
        IncidentStatus.RESOLVED,
        IncidentStatus.CANCELLED,
      ],
      [IncidentStatus.RESOLVED]: [
        IncidentStatus.OPEN, // Reopen
        IncidentStatus.CLOSED,
      ],
      [IncidentStatus.CLOSED]: [],
      [IncidentStatus.CANCELLED]: [],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new ApiError(
        400,
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }
}

export default new IncidentService();
