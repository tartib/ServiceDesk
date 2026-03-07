import { Request, Response } from 'express';
import mongoose from 'mongoose';
import asyncHandler from '../../utils/asyncHandler';
import { ServiceCatalog, ServiceStatus } from '../../modules/itsm/models/ServiceCatalog';

/**
 * Legacy ServiceCatalogController — adapter layer between the v1 frontend
 * (snake_case fields, `is_active` param, `{ data: { service } }` wrapping)
 * and the ITSM module's ServiceCatalog Mongoose model (camelCase fields).
 *
 * The core/entities/ServiceCatalog model (old schema) is replaced at runtime
 * by modules/itsm/models/ServiceCatalog (new schema), so we query that directly.
 */

// ── Helper: check if string is valid MongoDB ObjectId ──
function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

// ── Build query for find by id (handles ObjectId vs serviceId) ──
function buildIdQuery(id: string): Record<string, unknown> {
  if (isValidObjectId(id)) {
    return { $or: [{ _id: id }, { serviceId: id }] };
  }
  return { serviceId: id };
}
function toSnakeCase(doc: Record<string, unknown>): Record<string, unknown> {
  const d = (doc && typeof doc === 'object' && '_doc' in doc ? (doc as any)._doc : doc) as Record<string, unknown>;
  const stats = d.stats as Record<string, unknown> | undefined;
  return {
    _id: d._id,
    service_id: d.serviceId ?? d.service_id ?? '',
    name: d.name,
    name_ar: d.nameAr ?? d.name_ar ?? '',
    description: d.description,
    description_ar: d.descriptionAr ?? d.description_ar ?? '',
    category: d.category,
    icon: d.icon ?? '',
    image: d.image ?? '',
    tags: d.tags ?? [],
    order: d.order ?? 0,
    site_id: d.site_id ?? '',
    form: (d.requestForm && typeof d.requestForm === 'object' && Array.isArray((d.requestForm as any).fields))
      ? ((d.requestForm as any).fields || []).map((f: any) => ({
          field_id: f.id ?? f.field_id ?? '',
          label: f.label,
          label_ar: f.labelAr ?? f.label_ar ?? '',
          type: f.type,
          required: f.required ?? false,
          placeholder: f.placeholder ?? '',
          default_value: f.defaultValue ?? f.default_value ?? null,
          options: f.options?.map((o: any) => ({ value: o.value, label: o.label, label_ar: o.labelAr ?? o.label_ar ?? '' })),
          validation: f.validation,
          order: f.order ?? 0,
          depends_on: f.conditionalDisplay
            ? { field_id: f.conditionalDisplay.dependsOnField, value: f.conditionalDisplay.showWhenValue }
            : undefined,
        }))
      : [],
    workflow: {
      approval_chain: (d.approvers as any[])?.map((a: any, i: number) => ({
        step: i + 1,
        approver_type: a.type,
        approver_id: a.value,
        approver_name: a.value,
        is_optional: false,
      })) ?? [],
      auto_assign_group: d.fulfillmentTeam ?? '',
      auto_assign_user: d.autoAssignee ?? '',
      sla_id: d.slaTemplateId ?? 'default-sla',
      notification_template: '',
      fulfillment_workflow_id: d.workflowId ?? '',
    },
    fulfillment: {
      type: d.fulfillmentType ?? 'manual',
      estimated_hours: d.estimatedFulfillmentTime ?? 0,
    },
    pricing: d.pricing ?? { cost: 0, currency: 'SAR', billing_type: 'free' },
    availability: {
      is_active: d.status === 'active',
      available_to: d.allowedRoles ?? ['all'],
      requires_approval: d.approvalRequired ?? false,
    },
    metrics: {
      total_requests: stats?.totalRequests ?? 0,
      avg_fulfillment_hours: stats?.avgFulfillmentTime ?? 0,
      satisfaction_score: stats?.satisfactionScore ?? 0,
    },
    created_at: d.createdAt,
    updated_at: d.updatedAt,
  };
}

// ── snake_case payload from frontend → camelCase for ITSM model ──
function toCamelCase(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (body.name !== undefined) out.name = body.name;
  if (body.name_ar !== undefined) out.nameAr = body.name_ar;
  if (body.description !== undefined) out.description = body.description;
  if (body.description_ar !== undefined) out.descriptionAr = body.description_ar;
  if (body.category !== undefined) out.category = body.category;
  if (body.icon !== undefined) out.icon = body.icon;
  if (body.tags !== undefined) out.tags = body.tags;
  if (body.order !== undefined) out.order = body.order;

  // Availability → status + visibility fields
  const avail = body.availability as Record<string, unknown> | undefined;
  if (avail) {
    out.status = avail.is_active ? ServiceStatus.ACTIVE : ServiceStatus.INACTIVE;
    out.approvalRequired = avail.requires_approval ?? false;
    if (avail.available_to) out.allowedRoles = avail.available_to;
  }

  // Fulfillment
  const ff = body.fulfillment as Record<string, unknown> | undefined;
  if (ff) {
    out.fulfillmentType = ff.type ?? 'manual';
    out.estimatedFulfillmentTime = ff.estimated_hours ?? 0;
  }

  // Workflow
  const wf = body.workflow as Record<string, unknown> | undefined;
  if (wf) {
    if (wf.sla_id) out.slaTemplateId = wf.sla_id;
    if (wf.fulfillment_workflow_id) out.workflowId = wf.fulfillment_workflow_id;
    if (wf.auto_assign_group) out.fulfillmentTeam = wf.auto_assign_group;
    if (wf.auto_assign_user) out.autoAssignee = wf.auto_assign_user;
  }

  // Form fields
  if (Array.isArray(body.form)) {
    out.requestForm = {
      fields: body.form.map((f: any) => ({
        id: f.field_id,
        type: f.type,
        label: f.label,
        labelAr: f.label_ar ?? '',
        placeholder: f.placeholder ?? '',
        required: f.required ?? false,
        defaultValue: f.default_value ?? null,
        options: f.options,
        validation: f.validation,
        order: f.order ?? 0,
        conditionalDisplay: f.depends_on
          ? { dependsOnField: f.depends_on.field_id, showWhenValue: f.depends_on.value }
          : undefined,
      })),
    };
  }

  // service_id (for creation)
  if (body.service_id !== undefined) out.serviceId = body.service_id;

  // Pricing pass-through
  if (body.pricing !== undefined) out.pricing = body.pricing;

  return out;
}

export class ServiceCatalogController {
  /**
   * GET /api/v1/service-catalog
   * Frontend sends: ?is_active=true&category=...&page=&limit=
   */
  getServices = asyncHandler(async (req: Request, res: Response) => {
    const { category, is_active, page = 1, limit = 50, q } = req.query;

    const query: Record<string, unknown> = {};
    if (category) query.category = category;
    if (is_active !== undefined) {
      query.status = is_active === 'true' ? ServiceStatus.ACTIVE : ServiceStatus.INACTIVE;
    }
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { nameAr: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [docs, total] = await Promise.all([
      ServiceCatalog.find(query).sort({ order: 1 }).skip(skip).limit(limitNum).lean(),
      ServiceCatalog.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: docs.map((d) => toSnakeCase(d as unknown as Record<string, unknown>)),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  });

  /**
   * GET /api/v1/service-catalog/:id
   * Frontend expects: { success, data: { service: <snake_case> } }
   */
  getService = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const doc = await ServiceCatalog.findOne(buildIdQuery(id)).lean();

    if (!doc) {
      res.status(404).json({ success: false, error: 'Service not found' });
      return;
    }

    res.json({
      success: true,
      data: { service: toSnakeCase(doc as unknown as Record<string, unknown>) },
    });
  });

  /**
   * GET /api/v1/service-catalog/stats
   * Frontend expects: { success, data: { total, active, inactive, byCategory } }
   */
  getStats = asyncHandler(async (_req: Request, res: Response) => {
    const [total, active, inactive] = await Promise.all([
      ServiceCatalog.countDocuments(),
      ServiceCatalog.countDocuments({ status: ServiceStatus.ACTIVE }),
      ServiceCatalog.countDocuments({ status: ServiceStatus.INACTIVE }),
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
        byCategory: byCategory.reduce(
          (acc: Record<string, number>, c: { _id: string; count: number }) => ({ ...acc, [c._id]: c.count }),
          {},
        ),
      },
    });
  });

  /**
   * POST /api/v1/service-catalog
   * Frontend expects: { success, data: { service: <snake_case> } }
   */
  createService = asyncHandler(async (req: Request, res: Response) => {
    const payload = toCamelCase(req.body);
    payload.createdBy = req.user?.id || 'system';
    if (!payload.status) payload.status = ServiceStatus.ACTIVE;

    const doc = await ServiceCatalog.create(payload);
    res.status(201).json({
      success: true,
      data: { service: toSnakeCase(doc.toObject() as unknown as Record<string, unknown>) },
      message: 'Service created successfully',
    });
  });

  /**
   * PATCH /api/v1/service-catalog/:id
   * Frontend expects: { success, data: { service: <snake_case> } }
   */
  updateService = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const payload = toCamelCase(req.body);
    payload.updatedBy = req.user?.id || 'system';

    const doc = await ServiceCatalog.findOneAndUpdate(
      buildIdQuery(id),
      payload,
      { new: true, runValidators: true },
    ).lean();

    if (!doc) {
      res.status(404).json({ success: false, error: 'Service not found' });
      return;
    }

    res.json({
      success: true,
      data: { service: toSnakeCase(doc as unknown as Record<string, unknown>) },
      message: 'Service updated successfully',
    });
  });

  /**
   * DELETE /api/v1/service-catalog/:id
   */
  deleteService = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const doc = await ServiceCatalog.findOneAndUpdate(
      buildIdQuery(id),
      { status: ServiceStatus.RETIRED },
      { new: true },
    );

    if (!doc) {
      res.status(404).json({ success: false, error: 'Service not found' });
      return;
    }

    res.json({ success: true, message: 'Service deleted successfully' });
  });
}

export default new ServiceCatalogController();
