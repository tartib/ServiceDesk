/**
 * SLA Calendar Controller
 *
 * CRUD operations for SLA calendars, working hours, and holidays.
 */

import { Request, Response } from 'express';
import SlaCalendar from '../models/SlaCalendar';
import asyncHandler from '../../../utils/asyncHandler';
import { sendSuccess, sendError } from '../../../utils/ApiResponse';

function getTenant(req: Request): string | null {
  return req.user?.organizationId || req.headers['x-organization-id'] as string || null;
}

function docToCalendar(doc: any) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  return { ...obj, id: obj._id?.toString() };
}

// ── Calendars ────────────────────────────────────────────────

export const listCalendars = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = getTenant(req);
  if (!tenantId) return void sendError(req, res, 400, 'Missing organization context');
  const docs = await SlaCalendar.find({ tenantId }).sort({ isDefault: -1, name: 1 });
  sendSuccess(req, res, docs.map(docToCalendar));
});

export const getCalendar = asyncHandler(async (req: Request, res: Response) => {
  const doc = await SlaCalendar.findById(req.params.id);
  if (!doc) return void sendError(req, res, 404, 'Calendar not found');
  sendSuccess(req, res, docToCalendar(doc));
});

export const createCalendar = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = getTenant(req);
  if (!tenantId) return void sendError(req, res, 400, 'Missing organization context');
  const { name, nameAr, timezone, isDefault, isActive, workingHours, holidays } = req.body;
  if (!name) return void sendError(req, res, 400, 'name is required');
  const doc = new SlaCalendar({
    tenantId, name, nameAr,
    timezone: timezone || 'Asia/Riyadh',
    isDefault: isDefault ?? false,
    isActive: isActive ?? true,
    workingHours: Array.isArray(workingHours) ? workingHours : [],
    holidays: Array.isArray(holidays) ? holidays : [],
  });
  await doc.save();
  sendSuccess(req, res, docToCalendar(doc), 'Calendar created', 201);
});

export const updateCalendar = asyncHandler(async (req: Request, res: Response) => {
  const { name, nameAr, timezone, isDefault, isActive } = req.body;
  const doc = await SlaCalendar.findByIdAndUpdate(
    req.params.id,
    { $set: { name, nameAr, timezone, isDefault, isActive } },
    { new: true, runValidators: true }
  );
  if (!doc) return void sendError(req, res, 404, 'Calendar not found');
  sendSuccess(req, res, docToCalendar(doc));
});

export const deleteCalendar = asyncHandler(async (req: Request, res: Response) => {
  const doc = await SlaCalendar.findByIdAndDelete(req.params.id);
  if (!doc) return void sendError(req, res, 404, 'Calendar not found');
  sendSuccess(req, res, null, 'Calendar deleted');
});

// ── Working Hours ────────────────────────────────────────────

export const setWorkingHours = asyncHandler(async (req: Request, res: Response) => {
  const { hours } = req.body;
  if (!Array.isArray(hours)) return void sendError(req, res, 400, 'hours array is required');
  const doc = await SlaCalendar.findByIdAndUpdate(
    req.params.id, { $set: { workingHours: hours } }, { new: true }
  );
  if (!doc) return void sendError(req, res, 404, 'Calendar not found');
  sendSuccess(req, res, doc.workingHours);
});

export const getWorkingHours = asyncHandler(async (req: Request, res: Response) => {
  const doc = await SlaCalendar.findById(req.params.id);
  if (!doc) return void sendError(req, res, 404, 'Calendar not found');
  sendSuccess(req, res, doc.workingHours || []);
});

// ── Holidays ───────────────────────────────────────────────────

export const getHolidays = asyncHandler(async (req: Request, res: Response) => {
  const doc = await SlaCalendar.findById(req.params.id);
  if (!doc) return void sendError(req, res, 404, 'Calendar not found');
  sendSuccess(req, res, doc.holidays || []);
});

export const addHoliday = asyncHandler(async (req: Request, res: Response) => {
  const { holidayDate, name, nameAr } = req.body;
  if (!holidayDate) return void sendError(req, res, 400, 'holidayDate is required');
  const doc = await SlaCalendar.findByIdAndUpdate(
    req.params.id,
    { $push: { holidays: { holidayDate, name, nameAr } } },
    { new: true }
  );
  if (!doc) return void sendError(req, res, 404, 'Calendar not found');
  sendSuccess(req, res, doc.holidays[doc.holidays.length - 1], 'Holiday added', 201);
});

export const removeHoliday = asyncHandler(async (req: Request, res: Response) => {
  const doc = await SlaCalendar.findByIdAndUpdate(
    req.params.id,
    { $pull: { holidays: { holidayDate: req.params.date } } },
    { new: true }
  );
  if (!doc) return void sendError(req, res, 404, 'Calendar or holiday not found');
  sendSuccess(req, res, null, 'Holiday removed');
});
