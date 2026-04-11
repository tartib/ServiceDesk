import { Request, Response } from 'express';
import {
  ConfigurationItem,
  CIRelationship,
  CIStatus,
  CIType,
  CICriticality,
  CIRelationshipType,
} from '../models';
import logger from '../../../utils/logger';
import { ItsmEventPublisher } from '../../../shared/events/publishers/itsm.publisher';
import { getItsmRepos, isItsmPostgres } from '../infrastructure/repositories';
import { PgConfigurationItemRepository } from '../infrastructure/repositories/PgConfigurationItemRepository';
import { PgCIRelationshipRepository } from '../infrastructure/repositories/PgCIRelationshipRepository';
import asyncHandler from '../../../utils/asyncHandler';
import { sendSuccess, sendPaginated, sendError } from '../../../utils/ApiResponse';

/**
 * CMDB Controller
 * Handles CRUD operations for Configuration Items and Relationships
 */

// GET /api/v2/itsm/cmdb/items - List configuration items
export const getConfigItems = asyncHandler(async (req: Request, res: Response) => {
  const {
      ciType,
      status,
      criticality,
      category,
      q,
      ownerId,
      department,
      location,
      page = '1',
      limit = '25',
      sort = 'name',
      sortDir = 'asc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 25));

    // ── PostgreSQL path ──
    if (isItsmPostgres()) {
      const repo = getItsmRepos().configurationItem as PgConfigurationItemRepository;
      const result = await repo.searchItems(
        { ciType, status, criticality, category, ownerId, department, location, q, sort, sortDir },
        pageNum,
        limitNum,
      );
      return void sendPaginated(req, res, result.data, result.page, result.limit, result.total);
    }

    // ── MongoDB path ──
    const skip = (pageNum - 1) * limitNum;

    const query: Record<string, unknown> = {};

    if (ciType) query.ciType = ciType;
    if (status) query.status = status;
    if (criticality) query.criticality = criticality;
    if (category) query.category = category;
    if (ownerId) query.ownerId = ownerId;
    if (department) query.department = department;
    if (location) query.location = location;

    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { ciId: { $regex: q, $options: 'i' } },
        { serialNumber: { $regex: q, $options: 'i' } },
        { hostname: { $regex: q, $options: 'i' } },
        { ipAddress: { $regex: q, $options: 'i' } },
      ];
    }

    const sortObj: Record<string, 1 | -1> = {};
    sortObj[sort as string] = sortDir === 'desc' ? -1 : 1;

    const [items, total] = await Promise.all([
      ConfigurationItem.find(query)
        .populate('ownerId', 'name email')
        .populate('technicalOwnerId', 'name email')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ConfigurationItem.countDocuments(query),
    ]);

    sendPaginated(req, res, items, pageNum, limitNum, total);
});

// GET /api/v2/itsm/cmdb/items/:id - Get single configuration item
export const getConfigItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  let item: any;
  if (isItsmPostgres()) {
    const repo = getItsmRepos().configurationItem as PgConfigurationItemRepository;
    item = await repo.findByCiId(id) || await repo.findById(id);
  } else {
    item = await ConfigurationItem.findById(id)
      .populate('ownerId', 'name email')
      .populate('technicalOwnerId', 'name email')
      .populate('parentId', 'ciId name ciType')
      .populate('children', 'ciId name ciType status')
      .populate('relatedCIs.ciId', 'ciId name ciType status');
  }

  if (!item) return void sendError(req, res, 404, 'Configuration item not found');
  sendSuccess(req, res, item);
});

// POST /api/v2/itsm/cmdb/items - Create configuration item
export const createConfigItem = asyncHandler(async (req: Request, res: Response) => {
  let item: any;
  if (isItsmPostgres()) {
    const repo = getItsmRepos().configurationItem as PgConfigurationItemRepository;
    item = await repo.create({
      ...req.body,
      createdBy: req.user?.id,
      lastUpdatedBy: req.user?.id,
    } as any);
  } else {
    item = new ConfigurationItem({
      ...req.body,
      createdBy: req.user?.id,
      lastUpdatedBy: req.user?.id,
    });
    await item.save();
  }

  logger.info(`Configuration item created: ${item.ciId} by user ${req.user?.id}`);

  // Emit event
  ItsmEventPublisher.ciCreated(
    {
      ciId: item.ciId,
      name: item.name,
      ciType: item.ciType,
      criticality: item.criticality || 'medium',
      createdBy: req.user?.id || '',
    },
    { organizationId: req.user?.organizationId || '', userId: req.user?.id || '' }
  ).catch((err) => logger.error('Failed to emit ciCreated', { err }));

  sendSuccess(req, res, item, 'Configuration item created successfully', 201);
});

// PUT /api/v2/itsm/cmdb/items/:id - Update configuration item
export const updateConfigItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const trackFields = ['name', 'status', 'criticality', 'ciType', 'category', 'ownerId', 'department', 'location'];

  // ── PostgreSQL path ──
  if (isItsmPostgres()) {
    const repo = getItsmRepos().configurationItem as PgConfigurationItemRepository;
    let item = await repo.findByCiId(id) || await repo.findById(id);
    if (!item) return void sendError(req, res, 404, 'Configuration item not found');
      const itemId = (item as any)._id || (item as any).id;

      // Track changes
      const changes: Record<string, { old: unknown; new: unknown }> = {};
      for (const field of trackFields) {
        if (req.body[field] !== undefined && String((item as any)[field]) !== String(req.body[field])) {
          changes[field] = { old: (item as any)[field], new: req.body[field] };
        }
      }

      if (Object.keys(changes).length > 0) {
        await repo.pushToJsonArray(itemId, 'history', {
          timestamp: new Date(),
          userId: req.user?.id,
          action: 'updated',
          changes,
        });
      }

      item = await repo.updateById(itemId, {
        ...req.body,
        lastUpdatedBy: req.user?.id,
        lastUpdatedAt: new Date(),
      } as any);

      logger.info(`Configuration item updated: ${(item as any).ciId} by user ${req.user?.id}`);

      if (Object.keys(changes).length > 0) {
        ItsmEventPublisher.ciUpdated(
          {
            ciId: (item as any).ciId,
            name: (item as any).name,
            changes: Object.entries(changes).map(([field, val]) => ({ field, from: (val as any).old, to: (val as any).new })),
            updatedBy: req.user?.id || '',
          },
          { organizationId: req.user?.organizationId || '', userId: req.user?.id || '' }
        ).catch((err) => logger.error('Failed to emit ciUpdated', { err }));
      }

      return void sendSuccess(req, res, item, 'Configuration item updated successfully');
    }

    // ── MongoDB path ──
    const item = await ConfigurationItem.findById(id);
    if (!item) return void sendError(req, res, 404, 'Configuration item not found');

    // Track changes for history
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    
    for (const field of trackFields) {
      if (req.body[field] !== undefined && String(item.get(field)) !== String(req.body[field])) {
        changes[field] = { old: item.get(field), new: req.body[field] };
      }
    }

    // Add history entry if there are changes
    if (Object.keys(changes).length > 0) {
      item.history.push({
        timestamp: new Date(),
        userId: req.user?.id as any,
        action: 'updated',
        changes,
      });
    }

    Object.assign(item, req.body, {
      lastUpdatedBy: req.user?.id,
      lastUpdatedAt: new Date(),
    });

    await item.save();

    logger.info(`Configuration item updated: ${item.ciId} by user ${req.user?.id}`);

    // Emit event if there were changes
    if (Object.keys(changes).length > 0) {
      ItsmEventPublisher.ciUpdated(
        {
          ciId: item.ciId,
          name: item.name,
          changes: Object.entries(changes).map(([field, val]) => ({
            field,
            from: (val as any).old,
            to: (val as any).new,
          })),
          updatedBy: req.user?.id || '',
        },
        { organizationId: req.user?.organizationId || '', userId: req.user?.id || '' }
      ).catch((err) => logger.error('Failed to emit ciUpdated', { err }));
    }

    sendSuccess(req, res, item, 'Configuration item updated successfully');
});

// DELETE /api/v2/itsm/cmdb/items/:id - Delete (retire) configuration item
export const deleteConfigItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // ── PostgreSQL path ──
  if (isItsmPostgres()) {
    const repo = getItsmRepos().configurationItem as PgConfigurationItemRepository;
    const item = await repo.findByCiId(id) || await repo.findById(id);
    if (!item) return void sendError(req, res, 404, 'Configuration item not found');
      const itemId = (item as any)._id || (item as any).id;
      await repo.pushToJsonArray(itemId, 'history', {
        timestamp: new Date(),
        userId: req.user?.id,
        action: 'retired',
        changes: { status: { old: (item as any).status, new: CIStatus.RETIRED } },
      });
      await repo.updateById(itemId, { status: CIStatus.RETIRED, lastUpdatedBy: req.user?.id, lastUpdatedAt: new Date() } as any);

      logger.info(`Configuration item retired: ${(item as any).ciId} by user ${req.user?.id}`);
      ItsmEventPublisher.ciRetired(
        { ciId: (item as any).ciId, name: (item as any).name, retiredBy: req.user?.id || '' },
        { organizationId: req.user?.organizationId || '', userId: req.user?.id || '' }
      ).catch((err) => logger.error('Failed to emit ciRetired', { err }));

      return void sendSuccess(req, res, null, 'Configuration item retired successfully');
    }

    // ── MongoDB path ──
    const item = await ConfigurationItem.findById(id);
    if (!item) return void sendError(req, res, 404, 'Configuration item not found');

    // Soft delete - set status to retired
    item.status = CIStatus.RETIRED;
    item.lastUpdatedBy = req.user?.id as any;
    item.lastUpdatedAt = new Date();
    item.history.push({
      timestamp: new Date(),
      userId: req.user?.id as any,
      action: 'retired',
      changes: { status: { old: item.status, new: CIStatus.RETIRED } },
    });

    await item.save();

    logger.info(`Configuration item retired: ${item.ciId} by user ${req.user?.id}`);

    // Emit event
    ItsmEventPublisher.ciRetired(
      {
        ciId: item.ciId,
        name: item.name,
        retiredBy: req.user?.id || '',
      },
      { organizationId: req.user?.organizationId || '', userId: req.user?.id || '' }
    ).catch((err) => logger.error('Failed to emit ciRetired', { err }));

    sendSuccess(req, res, null, 'Configuration item retired successfully');
});

// GET /api/v2/itsm/cmdb/items/:id/relationships - Get CI relationships
export const getRelationships = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  let relationships: any[];
  if (isItsmPostgres()) {
    const relRepo = getItsmRepos().ciRelationship as PgCIRelationshipRepository;
    relationships = await relRepo.findByCiId(id);
  } else {
    relationships = await CIRelationship.find({
      $or: [{ sourceId: id }, { targetId: id }],
    })
      .populate('sourceId', 'ciId name ciType status criticality')
      .populate('targetId', 'ciId name ciType status criticality')
      .lean();
  }

  sendSuccess(req, res, relationships);
});

// POST /api/v2/itsm/cmdb/relationships - Create relationship between CIs
export const createRelationship = asyncHandler(async (req: Request, res: Response) => {
  const { sourceId, targetId, relationshipType, direction, strength, description } = req.body;

  // ── PostgreSQL path ──
  if (isItsmPostgres()) {
    const ciRepo = getItsmRepos().configurationItem as PgConfigurationItemRepository;
    const relRepo = getItsmRepos().ciRelationship as PgCIRelationshipRepository;

    const [source, target] = await Promise.all([
      ciRepo.findById(sourceId),
      ciRepo.findById(targetId),
    ]);
    if (!source || !target) return void sendError(req, res, 404, 'One or both configuration items not found');

    const exists = await relRepo!.existsBetween(sourceId, targetId);
    if (exists) return void sendError(req, res, 409, 'Relationship already exists between these items');

      const relationship = await relRepo!.create({
        sourceId,
        targetId,
        relationshipType,
        direction: direction || 'bidirectional',
        strength: strength || 'strong',
        description,
        createdBy: req.user?.id,
      } as any);

      // Update related_cis JSONB on both items
      await ciRepo.pushToJsonArray(sourceId, 'relatedCIs', { ciId: targetId, relationship: relationshipType, direction: 'outbound', strength: strength || 'strong', description });
      await ciRepo.pushToJsonArray(targetId, 'relatedCIs', { ciId: sourceId, relationship: relationshipType, direction: 'inbound', strength: strength || 'strong', description });

      return void sendSuccess(req, res, relationship, 'Relationship created successfully', 201);
    }

    // ── MongoDB path ──
    // Verify both CIs exist
    const [source, target] = await Promise.all([
      ConfigurationItem.findById(sourceId),
      ConfigurationItem.findById(targetId),
    ]);

    if (!source || !target) return void sendError(req, res, 404, 'One or both configuration items not found');

    // Check for duplicate relationship
    const existing = await CIRelationship.findOne({ sourceId, targetId });
    if (existing) return void sendError(req, res, 409, 'Relationship already exists between these items');

    const relationship = new CIRelationship({
      sourceId,
      targetId,
      relationshipType,
      direction: direction || 'bidirectional',
      strength: strength || 'strong',
      description,
      createdBy: req.user?.id,
    });

    await relationship.save();

    // Update related CIs on both items
    await ConfigurationItem.findByIdAndUpdate(sourceId, {
      $push: {
        relatedCIs: {
          ciId: targetId,
          relationship: relationshipType,
          direction: 'outbound',
          strength: strength || 'strong',
          description,
        },
      },
    });

    await ConfigurationItem.findByIdAndUpdate(targetId, {
      $push: {
        relatedCIs: {
          ciId: sourceId,
          relationship: relationshipType,
          direction: 'inbound',
          strength: strength || 'strong',
          description,
        },
      },
    });

    sendSuccess(req, res, relationship, 'Relationship created successfully', 201);
});

// DELETE /api/v2/itsm/cmdb/relationships/:id - Delete relationship
export const deleteRelationship = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // ── PostgreSQL path ──
  if (isItsmPostgres()) {
    const relRepo = getItsmRepos().ciRelationship as PgCIRelationshipRepository;
    const rel = await relRepo!.deleteAndReturn(id);
    if (!rel) return void sendError(req, res, 404, 'Relationship not found');
    // Note: cleaning relatedCIs JSONB arrays on both CIs would require filtering the JSONB.
    // For now we skip that — the relationship table is the source of truth in PG.
    return void sendSuccess(req, res, null, 'Relationship deleted successfully');
  }

  // ── MongoDB path ──
  const relationship = await CIRelationship.findById(id);
  if (!relationship) return void sendError(req, res, 404, 'Relationship not found');

  // Remove references from both CIs
  await ConfigurationItem.findByIdAndUpdate(relationship.sourceId, {
    $pull: { relatedCIs: { ciId: relationship.targetId } },
  });
  await ConfigurationItem.findByIdAndUpdate(relationship.targetId, {
    $pull: { relatedCIs: { ciId: relationship.sourceId } },
  });

  await CIRelationship.findByIdAndDelete(id);

  sendSuccess(req, res, null, 'Relationship deleted successfully');
});

// GET /api/v2/itsm/cmdb/items/:id/impact - Impact analysis for a CI
export const getImpactAnalysis = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { depth = '2' } = req.query;
  const maxDepth = Math.min(5, Math.max(1, parseInt(depth as string) || 2));

  const item = await ConfigurationItem.findById(id);
  if (!item) return void sendError(req, res, 404, 'Configuration item not found');

    // BFS to find impacted CIs
    const visited = new Set<string>();
    const impacted: Array<{ item: unknown; depth: number; relationship: string }> = [];
    const queue: Array<{ ciId: string; currentDepth: number }> = [{ ciId: id, currentDepth: 0 }];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current.ciId) || current.currentDepth > maxDepth) continue;
      visited.add(current.ciId);

      const relationships = await CIRelationship.find({
        $or: [{ sourceId: current.ciId }, { targetId: current.ciId }],
      }).populate('sourceId targetId', 'ciId name ciType status criticality');

      for (const rel of relationships) {
        const relatedId = rel.sourceId._id.toString() === current.ciId
          ? rel.targetId._id.toString()
          : rel.sourceId._id.toString();

        if (!visited.has(relatedId)) {
          const relatedItem = rel.sourceId._id.toString() === current.ciId
            ? rel.targetId
            : rel.sourceId;

          impacted.push({
            item: relatedItem,
            depth: current.currentDepth + 1,
            relationship: rel.relationshipType,
          });

          queue.push({ ciId: relatedId, currentDepth: current.currentDepth + 1 });
        }
      }
    }

    sendSuccess(req, res, {
      sourceItem: { ciId: item.ciId, name: item.name, ciType: item.ciType },
      impactedItems: impacted,
      totalImpacted: impacted.length,
      maxDepthReached: maxDepth,
    });
});

// GET /api/v2/itsm/cmdb/types - Get CI types with counts
export const getCITypes = asyncHandler(async (req: Request, res: Response) => {
  let typeCounts: any[];
    if (isItsmPostgres()) {
      const repo = getItsmRepos().configurationItem as PgConfigurationItemRepository;
      typeCounts = await repo.getTypeCounts(true);
    } else {
      typeCounts = await ConfigurationItem.aggregate([
        { $match: { status: { $ne: CIStatus.RETIRED } } },
        { $group: { _id: '$ciType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);
    }

    const types = Object.values(CIType).map((type) => {
      const found = typeCounts.find((t) => t._id === type);
      return { type, count: found?.count || 0 };
    });

    sendSuccess(req, res, types);
});

// GET /api/v2/itsm/cmdb/stats - Get CMDB statistics
export const getCMDBStats = asyncHandler(async (req: Request, res: Response) => {
  // ── PostgreSQL path ──
  if (isItsmPostgres()) {
      const ciRepo = getItsmRepos().configurationItem as PgConfigurationItemRepository;
      const relRepo = getItsmRepos().ciRelationship as PgCIRelationshipRepository;
      const [stats, totalRelationships] = await Promise.all([
        ciRepo.getStats(),
        relRepo!.countAll(),
      ]);
      return void sendSuccess(req, res, { ...stats, totalRelationships });
    }

    // ── MongoDB path ──
    const [totalItems, statusCounts, typeCounts, criticalityCounts, recentlyUpdated] = await Promise.all([
      ConfigurationItem.countDocuments({ status: { $ne: CIStatus.RETIRED } }),
      ConfigurationItem.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      ConfigurationItem.aggregate([
        { $match: { status: { $ne: CIStatus.RETIRED } } },
        { $group: { _id: '$ciType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      ConfigurationItem.aggregate([
        { $match: { status: { $ne: CIStatus.RETIRED } } },
        { $group: { _id: '$criticality', count: { $sum: 1 } } },
      ]),
      ConfigurationItem.find({ status: { $ne: CIStatus.RETIRED } })
        .sort({ lastUpdatedAt: -1 })
        .limit(5)
        .select('ciId name ciType status lastUpdatedAt')
        .lean(),
    ]);

    const totalRelationships = await CIRelationship.countDocuments();

    sendSuccess(req, res, {
      totalItems,
      totalRelationships,
      byStatus: statusCounts,
      byType: typeCounts,
      byCriticality: criticalityCounts,
      recentlyUpdated,
    });
});
