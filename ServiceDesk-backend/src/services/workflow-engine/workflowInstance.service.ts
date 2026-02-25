/**
 * Workflow Instance Service
 * خدمة نماذج سير العمل — Start, Transition, Query
 */

import WorkflowInstance from '../../models/workflow/WorkflowInstance';
import {
  WFInstanceStatus,
  type IWFInstance,
} from '../../core/types/workflow-engine.types';
import type { IWFInstanceStore } from '../../core/engines/workflow/GenericWorkflowEngine';

class WorkflowInstanceService implements IWFInstanceStore {
  // ============================================
  // IWFInstanceStore implementation
  // ============================================

  async create(
    data: Omit<IWFInstance, '_id' | 'createdAt' | 'updatedAt'>
  ): Promise<IWFInstance> {
    const instance = new WorkflowInstance(data);
    await instance.save();
    return instance.toJSON();
  }

  async findById(id: string): Promise<IWFInstance | null> {
    return WorkflowInstance.findById(id).lean();
  }

  async findByEntity(
    entityType: string,
    entityId: string
  ): Promise<IWFInstance | null> {
    return WorkflowInstance.findOne({
      entityType,
      entityId,
      status: WFInstanceStatus.ACTIVE,
    }).lean();
  }

  async update(
    id: string,
    updates: Partial<IWFInstance>
  ): Promise<IWFInstance | null> {
    return WorkflowInstance.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    ).lean();
  }

  // ============================================
  // QUERY
  // ============================================

  async list(params: {
    organizationId: string;
    entityType?: string;
    status?: string;
    assigneeId?: string;
    definitionId?: string;
    currentState?: string;
    page?: number;
    limit?: number;
  }): Promise<{ instances: IWFInstance[]; total: number }> {
    const filter: any = {
      organizationId: params.organizationId,
    };

    if (params.entityType) filter.entityType = params.entityType;
    if (params.status) filter.status = params.status;
    if (params.assigneeId) filter['assignment.userId'] = params.assigneeId;
    if (params.definitionId) filter.definitionId = params.definitionId;
    if (params.currentState) filter.currentState = params.currentState;

    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const [instances, total] = await Promise.all([
      WorkflowInstance.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WorkflowInstance.countDocuments(filter),
    ]);

    return { instances, total };
  }

  async findByEntityId(
    entityType: string,
    entityId: string
  ): Promise<IWFInstance[]> {
    return WorkflowInstance.find({ entityType, entityId })
      .sort({ startedAt: -1 })
      .lean();
  }

  async findActiveByDefinition(definitionId: string): Promise<IWFInstance[]> {
    return WorkflowInstance.find({
      definitionId,
      status: WFInstanceStatus.ACTIVE,
    }).lean();
  }

  async countByStatus(organizationId: string): Promise<Record<string, number>> {
    const result = await WorkflowInstance.aggregate([
      { $match: { organizationId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const counts: Record<string, number> = {};
    for (const r of result) {
      counts[r._id] = r.count;
    }
    return counts;
  }

  async getOverdueInstances(organizationId: string): Promise<IWFInstance[]> {
    const now = new Date();
    return WorkflowInstance.find({
      organizationId,
      status: WFInstanceStatus.ACTIVE,
      $or: [
        { 'sla.resolutionDue': { $lt: now }, 'sla.breached': false },
        { 'timers.dueAt': { $lt: now }, 'timers.status': 'pending' },
      ],
    }).lean();
  }

  // ============================================
  // MIGRATION
  // ============================================

  async migrateInstances(params: {
    fromDefinitionId: string;
    toDefinitionId: string;
    toVersion: number;
    stateMapping?: Record<string, string>;
    strategy: 'keep_state' | 'reset' | 'map_states';
    initialState?: string;
  }): Promise<{ migratedCount: number; errors: string[] }> {
    const instances = await WorkflowInstance.find({
      definitionId: params.fromDefinitionId,
      status: WFInstanceStatus.ACTIVE,
    });

    let migratedCount = 0;
    const errors: string[] = [];

    for (const instance of instances) {
      try {
        let newState = instance.currentState;

        switch (params.strategy) {
          case 'reset':
            if (params.initialState) {
              newState = params.initialState;
            }
            break;

          case 'map_states':
            if (params.stateMapping && params.stateMapping[instance.currentState]) {
              newState = params.stateMapping[instance.currentState];
            } else {
              errors.push(
                `Instance ${instance._id}: No mapping for state "${instance.currentState}"`
              );
              continue;
            }
            break;

          case 'keep_state':
          default:
            break;
        }

        instance.definitionId = params.toDefinitionId as any;
        instance.definitionVersion = params.toVersion;
        instance.currentState = newState;
        await instance.save();
        migratedCount++;
      } catch (error: any) {
        errors.push(`Instance ${instance._id}: ${error.message}`);
      }
    }

    return { migratedCount, errors };
  }
}

export default new WorkflowInstanceService();
