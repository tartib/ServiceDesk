import { Request, Response } from 'express';
import asyncHandler from '../../../utils/asyncHandler';
import changeCalendarService from '../../../core/services/ChangeCalendarService';
import { ChangeCalendarEventType, ChangeType, Impact } from '../../../core/types/itsm.types';

export class ChangeCalendarController {
  getCalendar = asyncHandler(async (req: Request, res: Response) => {
    const { from, to, type, site_id } = req.query;
    const events = await changeCalendarService.getEvents({
      from: from ? new Date(from as string) : undefined,
      to: to ? new Date(to as string) : undefined,
      type: type as ChangeCalendarEventType | undefined,
      site_id: site_id as string | undefined,
    });
    res.json({ success: true, data: events, count: events.length });
  });

  createCalendarEvent = asyncHandler(async (req: Request, res: Response) => {
    const { type, title, description, start_date, end_date, site_id } = req.body;
    const user = (req as any).user!;
    if (!type || !title || !start_date || !end_date) {
      res.status(400).json({ success: false, error: 'type, title, start_date, and end_date are required' }); return;
    }
    if (!Object.values(ChangeCalendarEventType).includes(type)) {
      res.status(400).json({ success: false, error: `type must be one of: ${Object.values(ChangeCalendarEventType).join(', ')}` }); return;
    }
    const event = await changeCalendarService.createEvent({
      type, title, description, start_date: new Date(start_date), end_date: new Date(end_date),
      site_id, created_by: user.id, created_by_name: user.name,
    });
    res.status(201).json({ success: true, data: { event }, message: 'Calendar event created' });
  });

  deleteCalendarEvent = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user!;
    await changeCalendarService.deleteEvent(req.params.eventId, user.id);
    res.json({ success: true, message: 'Calendar event deleted' });
  });

  validateSchedule = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { planned_start, planned_end, site_id } = req.body;
    if (!planned_start || !planned_end) {
      res.status(400).json({ success: false, error: 'planned_start and planned_end are required' }); return;
    }
    const result = await changeCalendarService.validateSchedule(id, new Date(planned_start), new Date(planned_end), site_id);
    res.json({
      success: true, data: result,
      message: result.valid
        ? 'Schedule is clear — no conflicts found'
        : `Schedule has ${result.conflicts.length} conflict(s)${result.conflicts.some((c) => c.is_freeze_window) ? ' including a freeze window' : ''}`,
    });
  });

  computeRiskScore = asyncHandler(async (req: Request, res: Response) => {
    const { impact, type, affected_cis, rollback_plan } = req.body;
    if (!impact || !type) { res.status(400).json({ success: false, error: 'impact and type are required' }); return; }
    const result = changeCalendarService.computeRiskScore({ impact: impact as Impact, type: type as ChangeType, affected_cis, rollback_plan });
    res.json({ success: true, data: result });
  });

  getApprovalRouting = asyncHandler(async (req: Request, res: Response) => {
    const { type, risk_level } = req.query;
    if (!type || !risk_level) { res.status(400).json({ success: false, error: 'type and risk_level are required' }); return; }
    const routing = changeCalendarService.routeApprovals(type as ChangeType, risk_level as any);
    res.json({ success: true, data: routing });
  });
}

export default new ChangeCalendarController();
