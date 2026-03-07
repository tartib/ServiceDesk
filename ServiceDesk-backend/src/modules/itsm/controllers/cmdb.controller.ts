import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import {
  ConfigurationItem,
  CIRelationship,
  CIStatus,
  CIType,
  CICriticality,
  CIRelationshipType,
} from '../models';
// UserRole import removed — authorization now handled by itsmAuthorize middleware
import { ApiResponse } from '../../../types/pm';
import logger from '../../../utils/logger';
import { ItsmEventPublisher } from '../../../shared/events/publishers/itsm.publisher';
import { getItsmRepos, isItsmPostgres } from '../infrastructure/repositories';
import { PgConfigurationItemRepository } from '../infrastructure/repositories/PgConfigurationItemRepository';
import { PgCIRelationshipRepository } from '../infrastructure/repositories/PgCIRelationshipRepository';

/**
 * CMDB Controller
 * Handles CRUD operations for Configuration Items and Relationships
 */

// GET /api/v2/itsm/cmdb/items - List configuration items
export const getConfigItems = async (req: Request, res: Response): Promise<void> => {
  try {
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
      res.json({
        success: true,
        data: {
          items: result.data,
          pagination: { page: result.page, limit: result.limit, total: result.total, pages: result.totalPages },
        },
      } as ApiResponse);
      return;
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

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    } as ApiResponse);
  } catch (error) {
    logger.error('Error fetching configuration items:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch configuration items',
    } as ApiResponse);
  }
};

// GET /api/v2/itsm/cmdb/items/:id - Get single configuration item
export const getConfigItem = async (req: Request, res: Response): Promise<void> => {
  try {
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

    if (!item) {
      res.status(404).json({
        success: false,
        error: 'Configuration item not found',
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: item,
    } as ApiResponse);
  } catch (error) {
    logger.error('Error fetching configuration item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch configuration item',
    } as ApiResponse);
  }
};

// POST /api/v2/itsm/cmdb/items - Create configuration item
export const createConfigItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array().map((e) => ({ field: e.type, message: e.msg })),
      } as ApiResponse);
      return;
    }

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

    res.status(201).json({
      success: true,
      data: item,
      message: 'Configuration item created successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Error creating configuration item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create configuration item',
    } as ApiResponse);
  }
};

// PUT /api/v2/itsm/cmdb/items/:id - Update configuration item
export const updateConfigItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array().map((e) => ({ field: e.type, message: e.msg })),
      } as ApiResponse);
      return;
    }

    const { id } = req.params;
    const trackFields = ['name', 'status', 'criticality', 'ciType', 'category', 'ownerId', 'department', 'location'];

    // ── PostgreSQL path ──
    if (isItsmPostgres()) {
      const repo = getItsmRepos().configurationItem as PgConfigurationItemRepository;
      let item = await repo.findByCiId(id) || await repo.findById(id);
      if (!item) {
        res.status(404).json({ success: false, error: 'Configuration item not found' } as ApiResponse);
        return;
      }
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

      res.json({ success: true, data: item, message: 'Configuration item updated successfully' } as ApiResponse);
      return;
    }

    // ── MongoDB path ──
    const item = await ConfigurationItem.findById(id);
    if (!item) {
      res.status(404).json({
        success: false,
        error: 'Configuration item not found',
      } as ApiResponse);
      return;
    }

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

    res.json({
      success: true,
      data: item,
      message: 'Configuration item updated successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Error updating configuration item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update configuration item',
    } as ApiResponse);
  }
};

// DELETE /api/v2/itsm/cmdb/items/:id - Delete (retire) configuration item
export const deleteConfigItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // ── PostgreSQL path ──
    if (isItsmPostgres()) {
      const repo = getItsmRepos().configurationItem as PgConfigurationItemRepository;
      const item = await repo.findByCiId(id) || await repo.findById(id);
      if (!item) {
        res.status(404).json({ success: false, error: 'Configuration item not found' } as ApiResponse);
        return;
      }
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

      res.json({ success: true, message: 'Configuration item retired successfully' } as ApiResponse);
      return;
    }

    // ── MongoDB path ──
    const item = await ConfigurationItem.findById(id);
    if (!item) {
      res.status(404).json({
        success: false,
        error: 'Configuration item not found',
      } as ApiResponse);
      return;
    }

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

    res.json({
      success: true,
      message: 'Configuration item retired successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Error deleting configuration item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete configuration item',
    } as ApiResponse);
  }
};

// GET /api/v2/itsm/cmdb/items/:id/relationships - Get CI relationships
export const getRelationships = async (req: Request, res: Response): Promise<void> => {
  try {
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

    res.json({
      success: true,
      data: relationships,
    } as ApiResponse);
  } catch (error) {
    logger.error('Error fetching relationships:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch relationships',
    } as ApiResponse);
  }
};

// POST /api/v2/itsm/cmdb/relationships - Create relationship between CIs
export const createRelationship = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array().map((e) => ({ field: e.type, message: e.msg })),
      } as ApiResponse);
      return;
    }

    const { sourceId, targetId, relationshipType, direction, strength, description } = req.body;

    // ── PostgreSQL path ──
    if (isItsmPostgres()) {
      const ciRepo = getItsmRepos().configurationItem as PgConfigurationItemRepository;
      const relRepo = getItsmRepos().ciRelationship as PgCIRelationshipRepository;

      const [source, target] = await Promise.all([
        ciRepo.findById(sourceId),
        ciRepo.findById(targetId),
      ]);
      if (!source || !target) {
        res.status(404).json({ success: false, error: 'One or both configuration items not found' } as ApiResponse);
        return;
      }

      const exists = await relRepo!.existsBetween(sourceId, targetId);
      if (exists) {
        res.status(409).json({ success: false, error: 'Relationship already exists between these items' } as ApiResponse);
        return;
      }

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

      res.status(201).json({ success: true, data: relationship, message: 'Relationship created successfully' } as ApiResponse);
      return;
    }

    // ── MongoDB path ──
    // Verify both CIs exist
    const [source, target] = await Promise.all([
      ConfigurationItem.findById(sourceId),
      ConfigurationItem.findById(targetId),
    ]);

    if (!source || !target) {
      res.status(404).json({
        success: false,
        error: 'One or both configuration items not found',
      } as ApiResponse);
      return;
    }

    // Check for duplicate relationship
    const existing = await CIRelationship.findOne({ sourceId, targetId });
    if (existing) {
      res.status(409).json({
        success: false,
        error: 'Relationship already exists between these items',
      } as ApiResponse);
      return;
    }

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

    res.status(201).json({
      success: true,
      data: relationship,
      message: 'Relationship created successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Error creating relationship:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create relationship',
    } as ApiResponse);
  }
};

// DELETE /api/v2/itsm/cmdb/relationships/:id - Delete relationship
export const deleteRelationship = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // ── PostgreSQL path ──
    if (isItsmPostgres()) {
      const relRepo = getItsmRepos().ciRelationship as PgCIRelationshipRepository;
      const rel = await relRepo!.deleteAndReturn(id);
      if (!rel) {
        res.status(404).json({ success: false, error: 'Relationship not found' } as ApiResponse);
        return;
      }
      // Note: cleaning relatedCIs JSONB arrays on both CIs would require filtering the JSONB.
      // For now we skip that — the relationship table is the source of truth in PG.
      res.json({ success: true, message: 'Relationship deleted successfully' } as ApiResponse);
      return;
    }

    // ── MongoDB path ──
    const relationship = await CIRelationship.findById(id);
    if (!relationship) {
      res.status(404).json({
        success: false,
        error: 'Relationship not found',
      } as ApiResponse);
      return;
    }

    // Remove references from both CIs
    await ConfigurationItem.findByIdAndUpdate(relationship.sourceId, {
      $pull: { relatedCIs: { ciId: relationship.targetId } },
    });
    await ConfigurationItem.findByIdAndUpdate(relationship.targetId, {
      $pull: { relatedCIs: { ciId: relationship.sourceId } },
    });

    await CIRelationship.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Relationship deleted successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Error deleting relationship:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete relationship',
    } as ApiResponse);
  }
};

// GET /api/v2/itsm/cmdb/items/:id/impact - Impact analysis for a CI
export const getImpactAnalysis = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { depth = '2' } = req.query;
    const maxDepth = Math.min(5, Math.max(1, parseInt(depth as string) || 2));

    const item = await ConfigurationItem.findById(id);
    if (!item) {
      res.status(404).json({
        success: false,
        error: 'Configuration item not found',
      } as ApiResponse);
      return;
    }

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

    res.json({
      success: true,
      data: {
        sourceItem: { ciId: item.ciId, name: item.name, ciType: item.ciType },
        impactedItems: impacted,
        totalImpacted: impacted.length,
        maxDepthReached: maxDepth,
      },
    } as ApiResponse);
  } catch (error) {
    logger.error('Error performing impact analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform impact analysis',
    } as ApiResponse);
  }
};

// GET /api/v2/itsm/cmdb/types - Get CI types with counts
export const getCITypes = async (req: Request, res: Response): Promise<void> => {
  try {
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

    res.json({
      success: true,
      data: types,
    } as ApiResponse);
  } catch (error) {
    logger.error('Error fetching CI types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch CI types',
    } as ApiResponse);
  }
};

// GET /api/v2/itsm/cmdb/stats - Get CMDB statistics
export const getCMDBStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // ── PostgreSQL path ──
    if (isItsmPostgres()) {
      const ciRepo = getItsmRepos().configurationItem as PgConfigurationItemRepository;
      const relRepo = getItsmRepos().ciRelationship as PgCIRelationshipRepository;
      const [stats, totalRelationships] = await Promise.all([
        ciRepo.getStats(),
        relRepo!.countAll(),
      ]);
      res.json({
        success: true,
        data: { ...stats, totalRelationships },
      } as ApiResponse);
      return;
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

    res.json({
      success: true,
      data: {
        totalItems,
        totalRelationships,
        byStatus: statusCounts,
        byType: typeCounts,
        byCriticality: criticalityCounts,
        recentlyUpdated,
      },
    } as ApiResponse);
  } catch (error) {
    logger.error('Error fetching CMDB stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch CMDB statistics',
    } as ApiResponse);
  }
};
