/**
 * SLA Policy Controller
 *
 * CRUD operations for SLA policies, goals, and escalation rules.
 * Uses MongoDB models directly (PG path removed for MongoDB-first deployments).
 */

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import SlaPolicy from '../models/SlaPolicy';
import asyncHandler from '../../../utils/asyncHandler';
import { sendSuccess, sendPaginated, sendError } from '../../../utils/ApiResponse';

function getTenant(req: Request): string | null {
  return req.user?.organizationId || req.headers['x-organization-id'] as string || null;
}

function docToPolicy(doc: any) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  return { ...obj, id: obj._id?.toString(), goals: obj.goals || [] };
}

// ── Policies ─────────────────────────────────────────────────

export const listPolicies = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = getTenant(req);
  if (!tenantId) return void sendError(req, res, 400, 'Missing organization context');

  const { entityType, isActive, search, page, limit } = req.query;
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 50;

  const filter: any = { tenantId };
  if (entityType) filter.entityType = entityType;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { code: { $regex: search, $options: 'i' } }];

  const [docs, total] = await Promise.all([
    SlaPolicy.find(filter).sort({ priority: 1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
    SlaPolicy.countDocuments(filter),
  ]);

  sendPaginated(req, res, docs.map(docToPolicy), pageNum, limitNum, total);
});

export const getPolicy = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id;
  const doc = mongoose.Types.ObjectId.isValid(id)
    ? await SlaPolicy.findById(id)
    : await SlaPolicy.findOne({ code: id });
  if (!doc) return void sendError(req, res, 404, 'Policy not found');
  sendSuccess(req, res, docToPolicy(doc));
});

export const createPolicy = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = getTenant(req);
  if (!tenantId) return void sendError(req, res, 400, 'Missing organization context');

  const userId = req.user?.id;
  const { code, name, nameAr, description, descriptionAr, entityType, priority, matchConditions, isActive, goals } = req.body;

  if (!code || !name || !entityType) {
    return void sendError(req, res, 400, 'code, name, and entityType are required');
  }

  const existing = await SlaPolicy.findOne({ tenantId, code });
  if (existing) return void sendError(req, res, 409, 'Policy code already exists');

  const doc = new SlaPolicy({
    tenantId, code, name, nameAr, description, descriptionAr, entityType,
    priority: priority ?? 100, matchConditions: matchConditions || [],
    isActive: isActive ?? true, createdBy: userId,
    goals: Array.isArray(goals) ? goals : [],
  });
  await doc.save();
  sendSuccess(req, res, docToPolicy(doc), 'Policy created', 201);
});

export const updatePolicy = asyncHandler(async (req: Request, res: Response) => {
  const { name, nameAr, description, descriptionAr, entityType, priority, matchConditions, isActive } = req.body;
  const doc = await SlaPolicy.findByIdAndUpdate(
    req.params.id,
    { $set: { name, nameAr, description, descriptionAr, entityType, priority, matchConditions, isActive } },
    { new: true, runValidators: true }
  );
  if (!doc) return void sendError(req, res, 404, 'Policy not found');
  sendSuccess(req, res, docToPolicy(doc));
});

export const deletePolicy = asyncHandler(async (req: Request, res: Response) => {
  const doc = await SlaPolicy.findByIdAndDelete(req.params.id);
  if (!doc) return void sendError(req, res, 404, 'Policy not found');
  sendSuccess(req, res, null, 'Policy deleted');
});

export const activatePolicy = asyncHandler(async (req: Request, res: Response) => {
  const doc = await SlaPolicy.findByIdAndUpdate(req.params.id, { $set: { isActive: true } }, { new: true });
  if (!doc) return void sendError(req, res, 404, 'Policy not found');
  sendSuccess(req, res, docToPolicy(doc));
});

export const deactivatePolicy = asyncHandler(async (req: Request, res: Response) => {
  const doc = await SlaPolicy.findByIdAndUpdate(req.params.id, { $set: { isActive: false } }, { new: true });
  if (!doc) return void sendError(req, res, 404, 'Policy not found');
  sendSuccess(req, res, docToPolicy(doc));
});

// ── Goals (embedded in policy) ───────────────────────────────

export const listGoals = asyncHandler(async (req: Request, res: Response) => {
  const doc = await SlaPolicy.findById(req.params.policyId);
  if (!doc) return void sendError(req, res, 404, 'Policy not found');
  sendSuccess(req, res, doc.goals || []);
});

export const createGoal = asyncHandler(async (req: Request, res: Response) => {
  const { metricKey, targetMinutes, calendarId, startEvent, stopEvent, pauseOnStatuses, resumeOnStatuses, breachSeverity } = req.body;
  if (!metricKey || !targetMinutes) {
    return void sendError(req, res, 400, 'metricKey and targetMinutes are required');
  }
  const newGoal = {
    metricKey, targetMinutes, calendarId,
    startEvent: startEvent || 'ticket_created',
    stopEvent: stopEvent || 'resolved',
    pauseOnStatuses: pauseOnStatuses || [],
    resumeOnStatuses: resumeOnStatuses || [],
    breachSeverity: breachSeverity || 'warning',
    escalationRules: [],
  };
  const doc = await SlaPolicy.findByIdAndUpdate(
    req.params.policyId,
    { $push: { goals: newGoal } },
    { new: true }
  );
  if (!doc) return void sendError(req, res, 404, 'Policy not found');
  sendSuccess(req, res, doc.goals[doc.goals.length - 1], 'Goal created', 201);
});

export const updateGoal = asyncHandler(async (req: Request, res: Response) => {
  const doc = await SlaPolicy.findOneAndUpdate(
    { 'goals._id': req.params.goalId },
    { $set: Object.fromEntries(Object.entries(req.body).map(([k, v]) => [`goals.$.${k}`, v])) },
    { new: true }
  );
  if (!doc) return void sendError(req, res, 404, 'Goal not found');
  sendSuccess(req, res, doc.goals.find((g: any) => g._id?.toString() === req.params.goalId));
});

export const deleteGoal = asyncHandler(async (req: Request, res: Response) => {
  const doc = await SlaPolicy.findOneAndUpdate(
    { 'goals._id': req.params.goalId },
    { $pull: { goals: { _id: req.params.goalId } } },
    { new: true }
  );
  if (!doc) return void sendError(req, res, 404, 'Goal not found');
  sendSuccess(req, res, null, 'Goal deleted');
});

// ── Escalation Rules (embedded in goal) ──────────────────────

export const listEscalationRules = asyncHandler(async (req: Request, res: Response) => {
  const doc = await SlaPolicy.findOne({ 'goals._id': req.params.goalId });
  if (!doc) return void sendError(req, res, 404, 'Goal not found');
  const goal = doc.goals.find((g: any) => g._id?.toString() === req.params.goalId);
  sendSuccess(req, res, goal?.escalationRules || []);
});

export const createEscalationRule = asyncHandler(async (req: Request, res: Response) => {
  const { triggerType, offsetMinutes, actionType, actionConfig, isActive, sortOrder } = req.body;
  if (!triggerType || !actionType) {
    return void sendError(req, res, 400, 'triggerType and actionType are required');
  }
  const newRule = {
    triggerType, offsetMinutes: offsetMinutes ?? 0, actionType,
    actionConfig: actionConfig || {}, isActive: isActive ?? true, sortOrder: sortOrder ?? 0,
  };
  const doc = await SlaPolicy.findOneAndUpdate(
    { 'goals._id': req.params.goalId },
    { $push: { 'goals.$.escalationRules': newRule } },
    { new: true }
  );
  if (!doc) return void sendError(req, res, 404, 'Goal not found');
  const goal = doc.goals.find((g: any) => g._id?.toString() === req.params.goalId);
  sendSuccess(req, res, goal?.escalationRules[goal.escalationRules.length - 1], 'Escalation rule created', 201);
});

export const deleteEscalationRule = asyncHandler(async (req: Request, res: Response) => {
  const doc = await SlaPolicy.findOneAndUpdate(
    { 'goals.escalationRules._id': req.params.ruleId },
    { $pull: { 'goals.$[].escalationRules': { _id: req.params.ruleId } } },
    { new: true }
  );
  if (!doc) return void sendError(req, res, 404, 'Escalation rule not found');
  sendSuccess(req, res, null, 'Escalation rule deleted');
});
