import { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler';
import ServiceCatalog from '../../core/entities/ServiceCatalog';

export class ServiceCatalogController {
  /**
   * List service catalog items
   * GET /api/v2/service-catalog
   */
  getServices = asyncHandler(async (req: Request, res: Response) => {
    const { category, is_active, page = 1, limit = 50 } = req.query;

    const filter: Record<string, any> = {};
    if (category) filter.category = category;
    if (is_active !== undefined) filter['availability.is_active'] = is_active === 'true';

    const skip = (Number(page) - 1) * Number(limit);
    const [services, total] = await Promise.all([
      ServiceCatalog.find(filter).sort({ order: 1 }).skip(skip).limit(Number(limit)),
      ServiceCatalog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: services,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  });

  /**
   * Get service by ID
   * GET /api/v2/service-catalog/:id
   */
  getService = asyncHandler(async (req: Request, res: Response) => {
    const service = await ServiceCatalog.findOne({ service_id: req.params.id });
    if (!service) {
      res.status(404).json({ success: false, error: 'Service not found' });
      return;
    }
    res.json({ success: true, data: { service } });
  });

  /**
   * Get service catalog stats
   * GET /api/v2/service-catalog/stats
   */
  getStats = asyncHandler(async (_req: Request, res: Response) => {
    const [total, active, inactive] = await Promise.all([
      ServiceCatalog.countDocuments(),
      ServiceCatalog.countDocuments({ 'availability.is_active': true }),
      ServiceCatalog.countDocuments({ 'availability.is_active': false }),
    ]);

    const byCategory = await ServiceCatalog.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      data: {
        total,
        active,
        inactive,
        byCategory: byCategory.reduce((acc, c) => ({ ...acc, [c._id]: c.count }), {}),
      },
    });
  });

  /**
   * Create service catalog item
   * POST /api/v2/service-catalog
   */
  createService = asyncHandler(async (req: Request, res: Response) => {
    const service = await ServiceCatalog.create(req.body);
    res.status(201).json({
      success: true,
      data: { service },
      message: 'Service created successfully',
    });
  });

  /**
   * Update service catalog item
   * PATCH /api/v2/service-catalog/:id
   */
  updateService = asyncHandler(async (req: Request, res: Response) => {
    const service = await ServiceCatalog.findOneAndUpdate(
      { service_id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!service) {
      res.status(404).json({ success: false, error: 'Service not found' });
      return;
    }
    res.json({
      success: true,
      data: { service },
      message: 'Service updated successfully',
    });
  });

  /**
   * Delete service catalog item
   * DELETE /api/v2/service-catalog/:id
   */
  deleteService = asyncHandler(async (req: Request, res: Response) => {
    const service = await ServiceCatalog.findOneAndDelete({ service_id: req.params.id });
    if (!service) {
      res.status(404).json({ success: false, error: 'Service not found' });
      return;
    }
    res.json({ success: true, message: 'Service deleted successfully' });
  });
}

export default new ServiceCatalogController();
