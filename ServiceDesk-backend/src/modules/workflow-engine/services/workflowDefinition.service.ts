/**
 * Workflow Definition Service
 * خدمة تعريفات سير العمل — CRUD + Versioning + Publishing
 */

import WorkflowDefinition from '../models/WorkflowDefinition';
import {
  WFDefinitionStatus,
  type IWFDefinition,
} from '../../../core/types/workflow-engine.types';
import type { IWFDefinitionStore } from '../engine/GenericWorkflowEngine';

class WorkflowDefinitionService implements IWFDefinitionStore {
  // ============================================
  // IWFDefinitionStore implementation
  // ============================================

  async findById(id: string): Promise<IWFDefinition | null> {
    return WorkflowDefinition.findById(id).lean();
  }

  async findLatestPublished(
    organizationId: string,
    entityType: string
  ): Promise<IWFDefinition | null> {
    return WorkflowDefinition.findOne({
      organizationId,
      entityType,
      status: WFDefinitionStatus.PUBLISHED,
      isLatest: true,
    })
      .sort({ version: -1 })
      .lean();
  }

  // ============================================
  // CRUD
  // ============================================

  async create(data: {
    organizationId: string;
    projectId?: string;
    name: string;
    nameAr?: string;
    description?: string;
    descriptionAr?: string;
    entityType: string;
    states: any[];
    transitions: any[];
    initialState: string;
    finalStates: string[];
    settings?: any;
    tags?: string[];
    createdBy: string;
  }): Promise<IWFDefinition> {
    // Upsert: if any record with the same org+name+version:1 exists, create a new version instead
    const existing = await WorkflowDefinition.findOne({
      organizationId: data.organizationId,
      name: data.name,
      version: 1,
    });

    if (existing) {
      if (existing.status === WFDefinitionStatus.DRAFT) {
        // Update the existing draft in-place
        Object.assign(existing, {
          nameAr: data.nameAr,
          description: data.description,
          descriptionAr: data.descriptionAr,
          entityType: data.entityType,
          states: data.states,
          transitions: data.transitions,
          initialState: data.initialState,
          finalStates: data.finalStates,
          settings: data.settings,
          tags: data.tags,
          updatedBy: data.createdBy,
        });
        await existing.save();
        return existing.toJSON();
      } else {
        // Published/archived — get the latest version and create v+1
        const latest = await WorkflowDefinition.findOne({
          organizationId: data.organizationId,
          name: data.name,
        }).sort({ version: -1 });
        const nextVersion = (latest?.version ?? 0) + 1;
        const newDraft = new WorkflowDefinition({
          ...data,
          version: nextVersion,
          isLatest: true,
          status: WFDefinitionStatus.DRAFT,
        });
        if (latest) {
          latest.isLatest = false;
          await latest.save();
        }
        await newDraft.save();
        return newDraft.toJSON();
      }
    }

    const definition = new WorkflowDefinition({
      ...data,
      version: 1,
      isLatest: true,
      status: WFDefinitionStatus.DRAFT,
    });

    await definition.save();
    return definition.toJSON();
  }

  async update(
    id: string,
    data: Partial<IWFDefinition>,
    userId: string
  ): Promise<IWFDefinition | null> {
    const definition = await WorkflowDefinition.findById(id);
    if (!definition) return null;

    // If published, create new version instead
    if (definition.status === WFDefinitionStatus.PUBLISHED) {
      return this.createNewVersion(id, data, userId);
    }

    // Update draft
    Object.assign(definition, data, { updatedBy: userId });
    await definition.save();
    return definition.toJSON();
  }

  async delete(id: string): Promise<boolean> {
    const definition = await WorkflowDefinition.findById(id);
    if (!definition) return false;

    if (definition.status === WFDefinitionStatus.PUBLISHED) {
      throw new Error('Cannot delete a published workflow definition. Deprecate it first.');
    }

    await WorkflowDefinition.findByIdAndDelete(id);
    return true;
  }

  // ============================================
  // QUERY
  // ============================================

  async list(params: {
    organizationId: string;
    entityType?: string;
    status?: string;
    projectId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ definitions: IWFDefinition[]; total: number }> {
    const filter: any = {
      organizationId: params.organizationId,
      isLatest: true,
    };

    if (params.entityType) filter.entityType = params.entityType;
    if (params.status) filter.status = params.status;
    if (params.projectId) filter.projectId = params.projectId;
    if (params.search) {
      filter.$or = [
        { name: { $regex: params.search, $options: 'i' } },
        { nameAr: { $regex: params.search, $options: 'i' } },
        { description: { $regex: params.search, $options: 'i' } },
      ];
    }

    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const [definitions, total] = await Promise.all([
      WorkflowDefinition.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WorkflowDefinition.countDocuments(filter),
    ]);

    return { definitions, total };
  }

  async getVersions(
    organizationId: string,
    name: string
  ): Promise<IWFDefinition[]> {
    return WorkflowDefinition.find({
      organizationId,
      name,
    })
      .sort({ version: -1 })
      .lean();
  }

  async getByVersion(
    organizationId: string,
    name: string,
    version: number
  ): Promise<IWFDefinition | null> {
    return WorkflowDefinition.findOne({
      organizationId,
      name,
      version,
    }).lean();
  }

  // ============================================
  // PUBLISHING
  // ============================================

  async publish(id: string, userId: string): Promise<IWFDefinition | null> {
    const definition = await WorkflowDefinition.findById(id);
    if (!definition) return null;

    if (definition.status === WFDefinitionStatus.PUBLISHED) {
      throw new Error('Definition is already published');
    }

    // Validate before publishing
    this.validateDefinition(definition);

    definition.status = WFDefinitionStatus.PUBLISHED;
    definition.publishedAt = new Date();
    definition.updatedBy = userId as any;
    await definition.save();

    return definition.toJSON();
  }

  async deprecate(id: string, userId: string): Promise<IWFDefinition | null> {
    const definition = await WorkflowDefinition.findById(id);
    if (!definition) return null;

    definition.status = WFDefinitionStatus.DEPRECATED;
    definition.isLatest = false;
    definition.updatedBy = userId as any;
    await definition.save();

    return definition.toJSON();
  }

  async archive(id: string, userId: string): Promise<IWFDefinition | null> {
    const definition = await WorkflowDefinition.findById(id);
    if (!definition) return null;

    definition.status = WFDefinitionStatus.ARCHIVED;
    definition.isLatest = false;
    definition.updatedBy = userId as any;
    await definition.save();

    return definition.toJSON();
  }

  // ============================================
  // VERSIONING
  // ============================================

  async createNewVersion(
    sourceId: string,
    overrides: Partial<IWFDefinition>,
    userId: string
  ): Promise<IWFDefinition | null> {
    const source = await WorkflowDefinition.findById(sourceId);
    if (!source) return null;

    // Mark current as not latest
    source.isLatest = false;
    await source.save();

    // Create new version
    const newVersion = new WorkflowDefinition({
      organizationId: source.organizationId,
      projectId: source.projectId,
      name: source.name,
      nameAr: overrides.nameAr ?? source.nameAr,
      description: overrides.description ?? source.description,
      descriptionAr: overrides.descriptionAr ?? source.descriptionAr,
      entityType: source.entityType,
      version: source.version + 1,
      isLatest: true,
      status: WFDefinitionStatus.DRAFT,
      states: overrides.states ?? source.states,
      transitions: overrides.transitions ?? source.transitions,
      initialState: overrides.initialState ?? source.initialState,
      finalStates: overrides.finalStates ?? source.finalStates,
      settings: overrides.settings ?? source.settings,
      tags: overrides.tags ?? source.tags,
      createdBy: userId,
      updatedBy: userId,
    });

    await newVersion.save();
    return newVersion.toJSON();
  }

  // ============================================
  // VALIDATION
  // ============================================

  private validateDefinition(definition: IWFDefinition): void {
    const errors: string[] = [];

    if (!definition.states || definition.states.length < 2) {
      errors.push('Workflow must have at least 2 states');
    }

    if (!definition.initialState) {
      errors.push('Initial state is required');
    }

    if (!definition.finalStates || definition.finalStates.length === 0) {
      errors.push('At least one final state is required');
    }

    // Verify initial state exists
    const statesCodes = definition.states.map(s => s.code);
    if (!statesCodes.includes(definition.initialState)) {
      errors.push(`Initial state "${definition.initialState}" not found in states`);
    }

    // Verify final states exist
    for (const fs of definition.finalStates) {
      if (!statesCodes.includes(fs)) {
        errors.push(`Final state "${fs}" not found in states`);
      }
    }

    // Verify transitions reference valid states
    for (const t of definition.transitions) {
      if (t.fromState !== '*' && !statesCodes.includes(t.fromState)) {
        errors.push(`Transition "${t.transitionId}" references unknown fromState "${t.fromState}"`);
      }
      if (!statesCodes.includes(t.toState)) {
        errors.push(`Transition "${t.transitionId}" references unknown toState "${t.toState}"`);
      }
    }

    // Verify reachability from initial state
    const reachable = this.findReachableStates(definition);
    for (const state of definition.states) {
      if (state.code !== definition.initialState && !reachable.has(state.code)) {
        errors.push(`State "${state.code}" is unreachable from initial state`);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Workflow validation failed:\n${errors.join('\n')}`);
    }
  }

  private findReachableStates(definition: IWFDefinition): Set<string> {
    const reachable = new Set<string>();
    const queue = [definition.initialState];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (reachable.has(current)) continue;
      reachable.add(current);

      const outgoing = definition.transitions.filter(
        t => t.fromState === current || t.fromState === '*'
      );
      for (const t of outgoing) {
        if (!reachable.has(t.toState)) {
          queue.push(t.toState);
        }
      }
    }

    return reachable;
  }
}

export default new WorkflowDefinitionService();
