import { Request, Response } from 'express';
import asyncHandler from '../../../utils/asyncHandler';
import changeService from '../../../core/services/ChangeService';
import { ChangeStatus, ChangeType, Priority, ApprovalStatus } from '../../../core/types/itsm.types';

export class ChangeController {
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
    res.status(201).json({ success: true, data: { change }, message: 'Change request created successfully' });
  });

  getChange = asyncHandler(async (req: Request, res: Response) => {
    const change = await changeService.getChange(req.params.id);
    res.json({ success: true, data: { change } });
  });

  updateChange = asyncHandler(async (req: Request, res: Response) => {
    const change = await changeService.updateChange(req.params.id, req.body, (req as any).user!.id, (req as any).user!.name);
    res.json({ success: true, data: { change }, message: 'Change request updated successfully' });
  });

  submitForApproval = asyncHandler(async (req: Request, res: Response) => {
    const change = await changeService.submitForApproval(req.params.id, (req as any).user!.id, (req as any).user!.name);
    res.json({ success: true, data: { change }, message: 'Change submitted for approval' });
  });

  addCabApproval = asyncHandler(async (req: Request, res: Response) => {
    const { decision, comments } = req.body;
    const change = await changeService.addCabApproval(
      req.params.id, (req as any).user!.id, (req as any).user!.name,
      req.body.role || 'CAB Member', decision as ApprovalStatus, comments
    );
    res.json({ success: true, data: { change }, message: `CAB ${decision} recorded` });
  });

  scheduleChange = asyncHandler(async (req: Request, res: Response) => {
    const { planned_start, planned_end, maintenance_window } = req.body;
    const change = await changeService.scheduleChange(
      req.params.id,
      { planned_start: new Date(planned_start), planned_end: new Date(planned_end), maintenance_window },
      (req as any).user!.id, (req as any).user!.name
    );
    res.json({ success: true, data: { change }, message: 'Change scheduled successfully' });
  });

  startImplementation = asyncHandler(async (req: Request, res: Response) => {
    const change = await changeService.startImplementation(req.params.id, (req as any).user!.id, (req as any).user!.name);
    res.json({ success: true, data: { change }, message: 'Implementation started' });
  });

  completeChange = asyncHandler(async (req: Request, res: Response) => {
    const { success, notes } = req.body;
    const change = await changeService.completeChange(
      req.params.id, success, notes, (req as any).user!.id, (req as any).user!.name
    );
    res.json({ success: true, data: { change }, message: success ? 'Change completed successfully' : 'Change marked as failed' });
  });

  cancelChange = asyncHandler(async (req: Request, res: Response) => {
    const { reason } = req.body;
    const change = await changeService.cancelChange(req.params.id, reason, (req as any).user!.id, (req as any).user!.name);
    res.json({ success: true, data: { change }, message: 'Change cancelled' });
  });

  getChanges = asyncHandler(async (req: Request, res: Response) => {
    const { status, type, priority, requester, owner, site_id, scheduled_from, scheduled_to, page, limit } = req.query;
    const result = await changeService.getChanges({
      status: status ? (status as string).split(',') as ChangeStatus[] : undefined,
      type: type ? (type as string).split(',') as ChangeType[] : undefined,
      priority: priority ? (priority as string).split(',') as Priority[] : undefined,
      requester: requester as string, owner: owner as string, site_id: site_id as string,
      scheduled_from: scheduled_from ? new Date(scheduled_from as string) : undefined,
      scheduled_to: scheduled_to ? new Date(scheduled_to as string) : undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });
    res.json({ success: true, data: result.data, pagination: result.pagination });
  });

  getStats = asyncHandler(async (req: Request, res: Response) => {
    const { site_id } = req.query;
    const stats = await changeService.getStats(site_id as string);
    res.json({ success: true, data: stats });
  });

  getPendingCabApproval = asyncHandler(async (_req: Request, res: Response) => {
    const changes = await changeService.getPendingCabApproval();
    res.json({ success: true, data: changes, count: changes.length });
  });

  getScheduledChanges = asyncHandler(async (req: Request, res: Response) => {
    const { start_date, end_date } = req.query;
    if (!start_date || !end_date) {
      return res.status(400).json({ success: false, message: 'start_date and end_date are required' });
    }
    const changes = await changeService.getScheduledChanges(new Date(start_date as string), new Date(end_date as string));
    res.json({ success: true, data: changes, count: changes.length });
  });

  getEmergencyChanges = asyncHandler(async (_req: Request, res: Response) => {
    const changes = await changeService.getEmergencyChanges();
    res.json({ success: true, data: changes, count: changes.length });
  });

  getMyRequests = asyncHandler(async (req: Request, res: Response) => {
    const result = await changeService.getChanges({
      requester: (req as any).user!.id,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    });
    res.json({ success: true, data: result.data, pagination: result.pagination });
  });
}

export default new ChangeController();
