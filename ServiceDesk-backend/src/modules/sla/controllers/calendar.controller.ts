/**
 * SLA Calendar Controller
 *
 * CRUD operations for SLA calendars, working hours, and holidays.
 */

import { Request, Response } from 'express';
import { getSlaRepos } from '../infrastructure/repositories/SlaRepositoryFactory';
import logger from '../../../utils/logger';

const asyncHandler = (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response) => fn(req, res).catch((err) => {
    logger.error('[SLA:CalendarController] Unhandled error', { error: err });
    res.status(500).json({ success: false, message: 'Internal server error' });
  });

// ── Calendars ────────────────────────────────────────────────

export const listCalendars = asyncHandler(async (req: Request, res: Response) => {
  const repos = getSlaRepos();
  const tenantId = (req as any).user?.organizationId || req.headers['x-organization-id'] as string;
  if (!tenantId) return void res.status(400).json({ success: false, message: 'Missing organization context' });

  const calendars = await repos.calendarRepo.findByTenant(tenantId);
  res.json({ success: true, data: calendars });
});

export const getCalendar = asyncHandler(async (req: Request, res: Response) => {
  const repos = getSlaRepos();
  const calendar = await repos.calendarRepo.findById(req.params.id);
  if (!calendar) return void res.status(404).json({ success: false, message: 'Calendar not found' });

  const [workingHours, holidays] = await Promise.all([
    repos.calendarRepo.getWorkingHours(calendar.id!),
    repos.calendarRepo.getHolidays(calendar.id!),
  ]);

  res.json({ success: true, data: { ...calendar, workingHours, holidays } });
});

export const createCalendar = asyncHandler(async (req: Request, res: Response) => {
  const repos = getSlaRepos();
  const tenantId = (req as any).user?.organizationId || req.headers['x-organization-id'] as string;
  if (!tenantId) return void res.status(400).json({ success: false, message: 'Missing organization context' });

  const userId = (req as any).user?.id;
  const { name, nameAr, timezone, isDefault, isActive, workingHours, holidays } = req.body;

  if (!name) return void res.status(400).json({ success: false, message: 'name is required' });

  const calendar = await repos.calendarRepo.create({
    tenantId,
    name,
    nameAr,
    timezone: timezone || 'Asia/Riyadh',
    isDefault: isDefault ?? false,
    isActive: isActive ?? true,
    createdBy: userId,
  });

  // Set working hours if provided
  if (Array.isArray(workingHours) && workingHours.length > 0) {
    await repos.calendarRepo.setWorkingHours(calendar.id!, workingHours);
  }

  // Set holidays if provided
  if (Array.isArray(holidays) && holidays.length > 0) {
    await repos.calendarRepo.setHolidays(calendar.id!, holidays);
  }

  const resolved = await repos.calendarRepo.resolve(calendar.id!);
  res.status(201).json({ success: true, data: resolved });
});

export const updateCalendar = asyncHandler(async (req: Request, res: Response) => {
  const repos = getSlaRepos();
  const { name, nameAr, timezone, isDefault, isActive } = req.body;

  const calendar = await repos.calendarRepo.update(req.params.id, {
    name,
    nameAr,
    timezone,
    isDefault,
    isActive,
  });

  if (!calendar) return void res.status(404).json({ success: false, message: 'Calendar not found' });
  res.json({ success: true, data: calendar });
});

export const deleteCalendar = asyncHandler(async (req: Request, res: Response) => {
  const repos = getSlaRepos();
  const deleted = await repos.calendarRepo.delete(req.params.id);
  if (!deleted) return void res.status(404).json({ success: false, message: 'Calendar not found' });
  res.json({ success: true, message: 'Calendar deleted' });
});

// ── Working Hours ────────────────────────────────────────────

export const setWorkingHours = asyncHandler(async (req: Request, res: Response) => {
  const repos = getSlaRepos();
  const { hours } = req.body;
  if (!Array.isArray(hours)) return void res.status(400).json({ success: false, message: 'hours array is required' });

  const result = await repos.calendarRepo.setWorkingHours(req.params.id, hours);
  res.json({ success: true, data: result });
});

export const getWorkingHours = asyncHandler(async (req: Request, res: Response) => {
  const repos = getSlaRepos();
  const hours = await repos.calendarRepo.getWorkingHours(req.params.id);
  res.json({ success: true, data: hours });
});

// ── Holidays ─────────────────────────────────────────────────

export const getHolidays = asyncHandler(async (req: Request, res: Response) => {
  const repos = getSlaRepos();
  const holidays = await repos.calendarRepo.getHolidays(req.params.id);
  res.json({ success: true, data: holidays });
});

export const addHoliday = asyncHandler(async (req: Request, res: Response) => {
  const repos = getSlaRepos();
  const { holidayDate, name, nameAr } = req.body;
  if (!holidayDate) return void res.status(400).json({ success: false, message: 'holidayDate is required' });

  const holiday = await repos.calendarRepo.addHoliday(req.params.id, { holidayDate, name, nameAr });
  res.status(201).json({ success: true, data: holiday });
});

export const removeHoliday = asyncHandler(async (req: Request, res: Response) => {
  const repos = getSlaRepos();
  const deleted = await repos.calendarRepo.removeHoliday(req.params.id, req.params.date);
  if (!deleted) return void res.status(404).json({ success: false, message: 'Holiday not found' });
  res.json({ success: true, message: 'Holiday removed' });
});
