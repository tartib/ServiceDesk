import { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler';
import changeService from '../../core/services/ChangeService';
import { ChangeStatus, ChangeType, Priority, ApprovalStatus } from '../../core/types/itsm.types';

export class ChangeController {
  /**
   * Create a new change request
   * POST /api/v2/changes
   */
  createChange = asyncHandler(async (req: Request, res: Response) => {
    const change = await changeService.createChange({
      ...req.body,
      requested_by: {
        id: (req as any).user!.id,
        name: (req as any).user!.name,
        email: (req as any).user!.email,
        department: req.body.department || 'IT',
      },
    });

    res.status(201).json({
      success: true,
      data: { change },
      message: 'Change request created successfully',
    });
  });

  /**
   * Get change by ID
   * GET /api/v2/changes/:id
   */
  getChange = asyncHandler(async (req: Request, res: Response) => {
    const change = await changeService.getChange(req.params.id);

    res.json({
      success: true,
      data: { change },
    });
  });

  /**
   * Update change request
   * PATCH /api/v2/changes/:id
   */
  updateChange = asyncHandler(async (req: Request, res: Response) => {
    const change = await changeService.updateChange(
      req.params.id,
      req.body,
      (req as any).user!.id,
      (req as any).user!.name
    );

    res.json({
      success: true,
      data: { change },
      message: 'Change request updated successfully',
    });
  });

  /**
   * Submit change for approval
   * POST /api/v2/changes/:id/submit
   */
  submitForApproval = asyncHandler(async (req: Request, res: Response) => {
    const change = await changeService.submitForApproval(
      req.params.id,
      (req as any).user!.id,
      (req as any).user!.name
    );

    res.json({
      success: true,
      data: { change },
      message: 'Change submitted for approval',
    });
  });

  /**
   * Add CAB approval
   * POST /api/v2/changes/:id/cab/approve
   */
  addCabApproval = asyncHandler(async (req: Request, res: Response) => {
    const { decision, comments } = req.body;

    const change = await changeService.addCabApproval(
      req.params.id,
      (req as any).user!.id,
      (req as any).user!.name,
      req.body.role || 'CAB Member',
      decision as ApprovalStatus,
      comments
    );

    res.json({
      success: true,
      data: { change },
      message: `CAB ${decision} recorded`,
    });
  });

  /**
   * Schedule change
   * POST /api/v2/changes/:id/schedule
   */
  scheduleChange = asyncHandler(async (req: Request, res: Response) => {
    const { planned_start, planned_end, maintenance_window } = req.body;

    const change = await changeService.scheduleChange(
      req.params.id,
      {
        planned_start: new Date(planned_start),
        planned_end: new Date(planned_end),
        maintenance_window,
      },
      (req as any).user!.id,
      (req as any).user!.name
    );

    res.json({
      success: true,
      data: { change },
      message: 'Change scheduled successfully',
    });
  });

  /**
   * Start implementation
   * POST /api/v2/changes/:id/implement
   */
  startImplementation = asyncHandler(async (req: Request, res: Response) => {
    const change = await changeService.startImplementation(
      req.params.id,
      (req as any).user!.id,
      (req as any).user!.name
    );

    res.json({
      success: true,
      data: { change },
      message: 'Implementation started',
    });
  });

  /**
   * Complete change
   * POST /api/v2/changes/:id/complete
   */
  completeChange = asyncHandler(async (req: Request, res: Response) => {
    const { success, notes } = req.body;

    const change = await changeService.completeChange(
      req.params.id,
      success,
      notes,
      (req as any).user!.id,
      (req as any).user!.name
    );

    res.json({
      success: true,
      data: { change },
      message: success ? 'Change completed successfully' : 'Change marked as failed',
    });
  });

  /**
   * Cancel change
   * POST /api/v2/changes/:id/cancel
   */
  cancelChange = asyncHandler(async (req: Request, res: Response) => {
    const { reason } = req.body;

    const change = await changeService.cancelChange(
      req.params.id,
      reason,
      (req as any).user!.id,
      (req as any).user!.name
    );

    res.json({
      success: true,
      data: { change },
      message: 'Change cancelled',
    });
  });

  /**
   * Get changes with filters
   * GET /api/v2/changes
   */
  getChanges = asyncHandler(async (req: Request, res: Response) => {
    const {
      status,
      type,
      priority,
      requester,
      owner,
      site_id,
      scheduled_from,
      scheduled_to,
      page,
      limit,
    } = req.query;

    const result = await changeService.getChanges({
      status: status ? (status as string).split(',') as ChangeStatus[] : undefined,
      type: type ? (type as string).split(',') as ChangeType[] : undefined,
      priority: priority ? (priority as string).split(',') as Priority[] : undefined,
      requester: requester as string,
      owner: owner as string,
      site_id: site_id as string,
      scheduled_from: scheduled_from ? new Date(scheduled_from as string) : undefined,
      scheduled_to: scheduled_to ? new Date(scheduled_to as string) : undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  });

  /**
   * Get change statistics
   * GET /api/v2/changes/stats
   */
  getStats = asyncHandler(async (req: Request, res: Response) => {
    const { site_id } = req.query;

    const stats = await changeService.getStats(site_id as string);

    res.json({
      success: true,
      data: stats,
    });
  });

  /**
   * Get pending CAB approval changes
   * GET /api/v2/changes/pending-cab
   */
  getPendingCabApproval = asyncHandler(async (_req: Request, res: Response) => {
    const changes = await changeService.getPendingCabApproval();

    res.json({
      success: true,
      data: changes,
      count: changes.length,
    });
  });

  /**
   * Get scheduled changes for date range
   * GET /api/v2/changes/scheduled
   */
  getScheduledChanges = asyncHandler(async (req: Request, res: Response) => {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'start_date and end_date are required',
      });
    }

    const changes = await changeService.getScheduledChanges(
      new Date(start_date as string),
      new Date(end_date as string)
    );

    res.json({
      success: true,
      data: changes,
      count: changes.length,
    });
  });

  /**
   * Get emergency changes
   * GET /api/v2/changes/emergency
   */
  getEmergencyChanges = asyncHandler(async (_req: Request, res: Response) => {
    const changes = await changeService.getEmergencyChanges();

    res.json({
      success: true,
      data: changes,
      count: changes.length,
    });
  });

  /**
   * Get my change requests
   * GET /api/v2/changes/my-requests
   */
  getMyRequests = asyncHandler(async (req: Request, res: Response) => {
    const result = await changeService.getChanges({
      requester: (req as any).user!.id,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  });
}

export default new ChangeController();
