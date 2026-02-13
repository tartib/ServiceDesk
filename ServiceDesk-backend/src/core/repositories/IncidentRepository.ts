import { FilterQuery } from 'mongoose';
import { BaseRepository } from './BaseRepository';
import Incident, { IIncident } from '../entities/Incident';
import { IncidentStatus, Priority } from '../types/itsm.types';

export interface IIncidentRepository {
  findByIncidentId(incidentId: string): Promise<IIncident | null>;
  findByRequester(requesterId: string, page?: number, limit?: number): Promise<IIncident[]>;
  findByAssignee(technicianId: string, status?: IncidentStatus[]): Promise<IIncident[]>;
  findBySite(siteId: string, status?: IncidentStatus[]): Promise<IIncident[]>;
  findByCategory(categoryId: string): Promise<IIncident[]>;
  findOpenIncidents(): Promise<IIncident[]>;
  findBreachedIncidents(): Promise<IIncident[]>;
  findByPriority(priority: Priority): Promise<IIncident[]>;
  searchIncidents(query: string): Promise<IIncident[]>;
  getIncidentStats(siteId?: string): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    breached: number;
  }>;
}

export class IncidentRepository extends BaseRepository<IIncident> implements IIncidentRepository {
  constructor() {
    super(Incident);
  }

  async findByIncidentId(incidentId: string): Promise<IIncident | null> {
    return this.model.findOne({ incident_id: incidentId }).exec();
  }

  async findByRequester(requesterId: string, page: number = 1, limit: number = 20): Promise<IIncident[]> {
    const skip = (page - 1) * limit;
    return this.model
      .find({ 'requester.id': requesterId })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async findByAssignee(technicianId: string, status?: IncidentStatus[]): Promise<IIncident[]> {
    const filter: FilterQuery<IIncident> = { 'assigned_to.technician_id': technicianId };
    
    if (status && status.length > 0) {
      filter.status = { $in: status };
    }
    
    return this.model.find(filter).sort({ priority: -1, created_at: -1 }).exec();
  }

  async findBySite(siteId: string, status?: IncidentStatus[]): Promise<IIncident[]> {
    const filter: FilterQuery<IIncident> = { site_id: siteId };
    
    if (status && status.length > 0) {
      filter.status = { $in: status };
    }
    
    return this.model.find(filter).sort({ created_at: -1 }).exec();
  }

  async findByCategory(categoryId: string): Promise<IIncident[]> {
    return this.model.find({ category_id: categoryId }).sort({ created_at: -1 }).exec();
  }

  async findOpenIncidents(): Promise<IIncident[]> {
    return this.model
      .find({
        status: { $in: [IncidentStatus.OPEN, IncidentStatus.IN_PROGRESS, IncidentStatus.PENDING] },
      })
      .sort({ priority: -1, 'sla.resolution_due': 1 })
      .exec();
  }

  async findBreachedIncidents(): Promise<IIncident[]> {
    return this.model
      .find({
        'sla.breach_flag': true,
        status: { $nin: [IncidentStatus.CLOSED, IncidentStatus.CANCELLED] },
      })
      .sort({ 'sla.resolution_due': 1 })
      .exec();
  }

  async findByPriority(priority: Priority): Promise<IIncident[]> {
    return this.model
      .find({
        priority,
        status: { $nin: [IncidentStatus.CLOSED, IncidentStatus.CANCELLED] },
      })
      .sort({ created_at: -1 })
      .exec();
  }

  async searchIncidents(query: string): Promise<IIncident[]> {
    return this.model
      .find({
        $or: [
          { incident_id: { $regex: query, $options: 'i' } },
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { 'requester.name': { $regex: query, $options: 'i' } },
        ],
      })
      .sort({ created_at: -1 })
      .limit(50)
      .exec();
  }

  async getIncidentStats(siteId?: string): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    breached: number;
  }> {
    const baseFilter: FilterQuery<IIncident> = siteId ? { site_id: siteId } : {};

    const [total, open, inProgress, resolved, closed, breached] = await Promise.all([
      this.model.countDocuments(baseFilter),
      this.model.countDocuments({ ...baseFilter, status: IncidentStatus.OPEN }),
      this.model.countDocuments({ ...baseFilter, status: IncidentStatus.IN_PROGRESS }),
      this.model.countDocuments({ ...baseFilter, status: IncidentStatus.RESOLVED }),
      this.model.countDocuments({ ...baseFilter, status: IncidentStatus.CLOSED }),
      this.model.countDocuments({
        ...baseFilter,
        'sla.breach_flag': true,
        status: { $nin: [IncidentStatus.CLOSED, IncidentStatus.CANCELLED] },
      }),
    ]);

    return { total, open, inProgress, resolved, closed, breached };
  }

  async findNearingBreach(minutesThreshold: number = 60): Promise<IIncident[]> {
    const now = new Date();
    const threshold = new Date(now.getTime() + minutesThreshold * 60 * 1000);

    return this.model
      .find({
        'sla.breach_flag': false,
        'sla.resolution_due': { $lte: threshold, $gt: now },
        status: { $nin: [IncidentStatus.CLOSED, IncidentStatus.RESOLVED, IncidentStatus.CANCELLED] },
      })
      .sort({ 'sla.resolution_due': 1 })
      .exec();
  }

  async findUnassigned(): Promise<IIncident[]> {
    return this.model
      .find({
        assigned_to: { $exists: false },
        status: { $in: [IncidentStatus.OPEN] },
      })
      .sort({ priority: -1, created_at: 1 })
      .exec();
  }

  async findMajorIncidents(): Promise<IIncident[]> {
    return this.model
      .find({
        is_major: true,
        status: { $nin: [IncidentStatus.CLOSED, IncidentStatus.CANCELLED] },
      })
      .sort({ created_at: -1 })
      .exec();
  }

  async addWorklog(
    incidentId: string,
    worklog: {
      log_id: string;
      by: string;
      by_name: string;
      minutes_spent: number;
      note: string;
      is_internal: boolean;
    }
  ): Promise<IIncident | null> {
    return this.model
      .findOneAndUpdate(
        { incident_id: incidentId },
        {
          $push: {
            worklogs: { ...worklog, created_at: new Date() },
            timeline: {
              event: 'Worklog Added',
              by: worklog.by,
              by_name: worklog.by_name,
              time: new Date(),
              details: { minutes_spent: worklog.minutes_spent },
            },
          },
        },
        { new: true }
      )
      .exec();
  }

  async addTimelineEvent(
    incidentId: string,
    event: {
      event: string;
      by: string;
      by_name?: string;
      details?: Record<string, any>;
    }
  ): Promise<IIncident | null> {
    return this.model
      .findOneAndUpdate(
        { incident_id: incidentId },
        {
          $push: {
            timeline: { ...event, time: new Date() },
          },
        },
        { new: true }
      )
      .exec();
  }

  async updateStatus(
    incidentId: string,
    status: IncidentStatus,
    userId: string,
    userName: string
  ): Promise<IIncident | null> {
    const updateData: any = {
      status,
      $push: {
        timeline: {
          event: `Status changed to ${status}`,
          by: userId,
          by_name: userName,
          time: new Date(),
        },
      },
    };

    if (status === IncidentStatus.CLOSED) {
      updateData.closed_at = new Date();
    }

    return this.model.findOneAndUpdate({ incident_id: incidentId }, updateData, { new: true }).exec();
  }

  async assignTechnician(
    incidentId: string,
    assignee: {
      technician_id: string;
      name: string;
      email: string;
      group_id?: string;
      group_name?: string;
    },
    assignedBy: string,
    assignedByName: string
  ): Promise<IIncident | null> {
    return this.model
      .findOneAndUpdate(
        { incident_id: incidentId },
        {
          assigned_to: assignee,
          $push: {
            timeline: {
              event: `Assigned to ${assignee.name}`,
              by: assignedBy,
              by_name: assignedByName,
              time: new Date(),
            },
          },
        },
        { new: true }
      )
      .exec();
  }
}

export default new IncidentRepository();
