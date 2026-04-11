import { Request, Response } from 'express';
import { ServiceCatalog, ServiceStatus, ServiceCategory, ServiceVisibility } from '../models';
import logger from '../../../utils/logger';
import { getItsmRepos, isItsmPostgres } from '../infrastructure/repositories';
import { PgServiceCatalogRepository } from '../infrastructure/repositories/PgServiceCatalogRepository';
import asyncHandler from '../../../utils/asyncHandler';
import { sendSuccess, sendPaginated, sendError } from '../../../utils/ApiResponse';

/**
 * Service Catalog Controller
 * Handles CRUD operations for service catalog items
 */

// GET /api/v2/itsm/services - List all services
export const getServices = asyncHandler(async (req: Request, res: Response) => {
  const {
      category,
      status = ServiceStatus.ACTIVE,
      featured,
      q,
      visibility,
      page = '1',
      limit = '25',
      sort = 'order',
      sortDir = 'asc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 25));
    const itsmRole = req.user?.itsmRole || 'end_user';

    // ── PostgreSQL path ──
    if (isItsmPostgres()) {
      const repo = getItsmRepos().serviceCatalog as PgServiceCatalogRepository;
      const result = await repo.searchWithVisibility(
        (q as string) || '',
        {
          status,
          category: category && Object.values(ServiceCategory).includes(category as ServiceCategory) ? category : undefined,
          featured: featured !== undefined ? featured === 'true' : undefined,
          visibility,
          sort,
          sortDir,
        },
        itsmRole,
        pageNum,
        limitNum,
      );

      return void sendPaginated(req, res, result.data, result.page, result.limit, result.total);
    }

    // ── MongoDB path (unchanged) ──
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: Record<string, unknown> = {};
    
    if (status) {
      query.status = status;
    }
    
    if (category && Object.values(ServiceCategory).includes(category as ServiceCategory)) {
      query.category = category;
    }
    
    if (featured !== undefined) {
      query.featured = featured === 'true';
    }
    
    if (visibility) {
      query.visibility = visibility;
    }
    
    // Text search
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { nameAr: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q as string, 'i')] } },
      ];
    }

    // Check user role for visibility filtering
    if (itsmRole !== 'manager' && itsmRole !== 'admin') {
      query.$and = [
        {
          $or: [
            { visibility: ServiceVisibility.PUBLIC },
            { visibility: ServiceVisibility.INTERNAL },
            {
              visibility: ServiceVisibility.RESTRICTED,
              allowedRoles: { $in: [itsmRole] },
            },
          ],
        },
      ];
    }

    // Build sort
    const sortOption: Record<string, 1 | -1> = {};
    sortOption[sort as string] = sortDir === 'desc' ? -1 : 1;

    // Execute query
    const [services, total] = await Promise.all([
      ServiceCatalog.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ServiceCatalog.countDocuments(query),
    ]);

    sendPaginated(req, res, services, pageNum, limitNum, total);
});

// GET /api/v2/itsm/services/:id - Get single service
export const getService = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  let service: any;
  if (isItsmPostgres()) {
    const repo = getItsmRepos().serviceCatalog as PgServiceCatalogRepository;
    service = await repo.findByServiceId(id) || await repo.findById(id);
  } else {
    service = await ServiceCatalog.findOne({
      $or: [{ _id: id }, { serviceId: id }],
    }).lean();
  }

  if (!service) return void sendError(req, res, 404, 'Service not found');

  // Check visibility permissions
  const itsmRole = req.user?.itsmRole || 'end_user';
  const userId = req.user?.id;
  
  if (service.visibility === ServiceVisibility.RESTRICTED) {
    if (
      itsmRole !== 'manager' &&
      itsmRole !== 'admin' &&
      !service.allowedRoles?.includes(itsmRole) &&
      service.createdBy !== userId
    ) {
      return void sendError(req, res, 403, 'Access denied to this service');
    }
  }

  sendSuccess(req, res, service);
});

// POST /api/v2/itsm/services - Create new service (admin only)
export const createService = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  const serviceData = {
    ...req.body,
    createdBy: userId,
    stats: {
      totalRequests: 0,
      completedRequests: 0,
      avgFulfillmentTime: 0,
      satisfactionScore: 0,
    },
  };

  let service: any;
  if (isItsmPostgres()) {
    const repo = getItsmRepos().serviceCatalog as PgServiceCatalogRepository;
    // Flatten stats for PG
    const pgData = { ...serviceData };
    pgData['stats.totalRequests'] = 0;
    pgData['stats.completedRequests'] = 0;
    pgData['stats.avgFulfillmentTime'] = 0;
    pgData['stats.satisfactionScore'] = 0;
    delete pgData.stats;
    service = await repo.create(pgData);
  } else {
    service = await ServiceCatalog.create(serviceData);
  }

  sendSuccess(req, res, service, 'Service created successfully', 201);
});

// PUT /api/v2/itsm/services/:id - Update service (admin only)
export const updateService = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

    const allowedUpdates = [
      'name',
      'nameAr',
      'description',
      'descriptionAr',
      'shortDescription',
      'shortDescriptionAr',
      'category',
      'subcategory',
      'tags',
      'icon',
      'color',
      'featured',
      'requestForm',
      'workflowId',
      'approvalRequired',
      'approvers',
      'fulfillmentType',
      'fulfillmentTeam',
      'autoAssignee',
      'estimatedFulfillmentTime',
      'slaTemplateId',
      'priority',
      'visibility',
      'allowedRoles',
      'allowedDepartments',
      'status',
      'order',
    ];

    if (isItsmPostgres()) {
      const repo = getItsmRepos().serviceCatalog as PgServiceCatalogRepository;
      let service = await repo.findByServiceId(id) || await repo.findById(id);
      if (!service) return void sendError(req, res, 404, 'Service not found');
      const updateData: Record<string, any> = {};
      allowedUpdates.forEach((field) => {
        if (req.body[field] !== undefined) updateData[field] = req.body[field];
      });
      updateData.updatedBy = userId;
      service = await repo.updateById((service as any)._id || (service as any).id, updateData as any);
      return void sendSuccess(req, res, service, 'Service updated successfully');
    }

    const service = await ServiceCatalog.findOne({
      $or: [{ _id: id }, { serviceId: id }],
    });

    if (!service) return void sendError(req, res, 404, 'Service not found');

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        (service as unknown as Record<string, unknown>)[field] = req.body[field];
      }
    });

    service.updatedBy = userId;
    await service.save();

    sendSuccess(req, res, service, 'Service updated successfully');
});

// DELETE /api/v2/itsm/services/:id - Delete service (admin only)
export const deleteService = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (isItsmPostgres()) {
    const repo = getItsmRepos().serviceCatalog as PgServiceCatalogRepository;
    const service = await repo.findByServiceId(id) || await repo.findById(id);
    if (!service) return void sendError(req, res, 404, 'Service not found');
    await repo.updateById((service as any)._id || (service as any).id, { status: ServiceStatus.RETIRED } as any);
    return void sendSuccess(req, res, null, 'Service retired successfully');
  }

  const service = await ServiceCatalog.findOne({
    $or: [{ _id: id }, { serviceId: id }],
  });

  if (!service) return void sendError(req, res, 404, 'Service not found');

  // Soft delete by setting status to retired
  service.status = ServiceStatus.RETIRED;
  await service.save();

  sendSuccess(req, res, null, 'Service retired successfully');
});

// GET /api/v2/itsm/services/categories - Get all categories
export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = Object.values(ServiceCategory).map((cat) => ({
    id: cat,
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    count: 0, // Will be populated
  }));

  // Get counts for each category
  let counts: any[];
  if (isItsmPostgres()) {
    const repo = getItsmRepos().serviceCatalog as PgServiceCatalogRepository;
    counts = await repo.getCategoryCounts(true);
    // normalize: PG returns {category, count}, Mongo returns {_id, count}
    counts = counts.map((c: any) => ({ _id: c.category || c._id, count: c.count }));
  } else {
    counts = await ServiceCatalog.aggregate([
      { $match: { status: ServiceStatus.ACTIVE } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
  }

  counts.forEach((c) => {
    const cat = categories.find((cat) => cat.id === c._id);
    if (cat) cat.count = c.count;
  });

  sendSuccess(req, res, categories);
});

// GET /api/v2/itsm/services/featured - Get featured services
export const getFeaturedServices = asyncHandler(async (req: Request, res: Response) => {
  const { limit = '6' } = req.query;
  const limitNum = Math.min(20, Math.max(1, parseInt(limit as string) || 6));

  let services: any[];
  if (isItsmPostgres()) {
    const repo = getItsmRepos().serviceCatalog as PgServiceCatalogRepository;
    const result = await repo.searchWithVisibility(
      '',
      { status: ServiceStatus.ACTIVE, featured: true, sort: 'order', sortDir: 'asc' },
      'admin', // no visibility restriction for featured endpoint
      1,
      limitNum,
    );
    services = result.data;
  } else {
    services = await ServiceCatalog.find({
      status: ServiceStatus.ACTIVE,
      featured: true,
      visibility: { $in: [ServiceVisibility.PUBLIC, ServiceVisibility.INTERNAL] },
    })
      .sort({ order: 1, stats_totalRequests: -1 })
      .limit(limitNum)
      .lean();
  }

  sendSuccess(req, res, services);
});
