/**
 * Workflow Event Service
 * خدمة أحداث سير العمل — Audit Trail
 */

import WorkflowEvent from '../../models/workflow/WorkflowEvent';
import type { IWFEvent } from '../../core/types/workflow-engine.types';
import type { IWFEventStore } from '../../core/engines/workflow/GenericWorkflowEngine';

class WorkflowEventService implements IWFEventStore {
  // ============================================
  // IWFEventStore implementation
  // ============================================

  async record(event: Omit<IWFEvent, '_id'>): Promise<void> {
    await WorkflowEvent.create(event);
  }

  async getByInstance(instanceId: string, limit?: number): Promise<IWFEvent[]> {
    const query = WorkflowEvent.find({ instanceId }).sort({ timestamp: -1 });
    if (limit) query.limit(limit);
    return query.lean();
  }

  // ============================================
  // QUERY
  // ============================================

  async getByEntity(
    entityType: string,
    entityId: string,
    limit?: number
  ): Promise<IWFEvent[]> {
    const query = WorkflowEvent.find({ entityType, entityId }).sort({
      timestamp: -1,
    });
    if (limit) query.limit(limit);
    return query.lean();
  }

  async getByDefinition(
    definitionId: string,
    params?: {
      type?: string;
      actorId?: string;
      fromDate?: Date;
      toDate?: Date;
      page?: number;
      limit?: number;
    }
  ): Promise<{ events: IWFEvent[]; total: number }> {
    const filter: any = { definitionId };

    if (params?.type) filter.type = params.type;
    if (params?.actorId) filter.actorId = params.actorId;
    if (params?.fromDate || params?.toDate) {
      filter.timestamp = {};
      if (params?.fromDate) filter.timestamp.$gte = params.fromDate;
      if (params?.toDate) filter.timestamp.$lte = params.toDate;
    }

    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      WorkflowEvent.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
      WorkflowEvent.countDocuments(filter),
    ]);

    return { events, total };
  }

  async getByOrganization(
    organizationId: string,
    params?: {
      type?: string;
      entityType?: string;
      fromDate?: Date;
      toDate?: Date;
      page?: number;
      limit?: number;
    }
  ): Promise<{ events: IWFEvent[]; total: number }> {
    const filter: any = { organizationId };

    if (params?.type) filter.type = params.type;
    if (params?.entityType) filter.entityType = params.entityType;
    if (params?.fromDate || params?.toDate) {
      filter.timestamp = {};
      if (params?.fromDate) filter.timestamp.$gte = params.fromDate;
      if (params?.toDate) filter.timestamp.$lte = params.toDate;
    }

    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      WorkflowEvent.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
      WorkflowEvent.countDocuments(filter),
    ]);

    return { events, total };
  }

  async countByType(
    instanceId: string
  ): Promise<Record<string, number>> {
    const result = await WorkflowEvent.aggregate([
      { $match: { instanceId } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    const counts: Record<string, number> = {};
    for (const r of result) {
      counts[r._id] = r.count;
    }
    return counts;
  }
}

export default new WorkflowEventService();
