/**
 * SLA Policy Controller
 *
 * CRUD operations for SLA policies, goals, and escalation rules.
 */

import { Request, Response } from 'express';
import { getSlaRepos } from '../infrastructure/repositories/SlaRepositoryFactory';
import logger from '../../../utils/logger';

const asyncHandler = (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response) => fn(req, res).catch((err) => {
    logger.error('[SLA:PolicyController] Unhandled error', { error: err });
    res.status(500).json({ success: false, message: 'Internal server error' });
  });

// ── Policies ─────────────────────────────────────────────────

export const listPolicies = asyncHandler(async (req: Request, res: Response) => {
  const repos = getSlaRepos();
  const tenantId = (req as any).user?.organizationId || req.headers['x-organization-id'] as string;
  if (!tenantId) return void res.status(400).json({ success: false, message: 'Missing organization context' });

  const { entityType, isActive, search, page, limit } = req.query;
  const result = await repos.policyRepo.search(
    tenantId,
    {
      entityType: entityType as string,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      search: search as string,
    },
    Number(page) || 1,
    Number(limit) || 50
  );

  res.json({
    success: true,
    data: result.data,
    pagination: {
      page: Number(page) || 1,
      limit: Number(limit) || 50,
      total: result.total,
      totalPages: Math.ceil(result.total / (Number(limit) || 50)),
    },
  });
});

export const getPolicy = asyncHandler(async (req: Request, res: Response) => {
  const repos = getSlaRepos();
  const policy = await repos.policyRepo.findById(req.params.id);
  if (!policy) return void res.status(404).json({ success: false, message: 'Policy not found' });

  const goals = await repos.policyRepo.findGoalsByPolicyId(policy.id!);
  res.json({ success: true, data: { ...policy, goals } });
});

export const createPolicy = asyncHandler(async (req: Request, res: Response) => {
  const repos = getSlaRepos();
  const tenantId = (req as any).user?.organizationId || req.headers['x-organization-id'] as string;
  if (!tenantId) return void res.status(400).json({ success: false, message: 'Missing organization context' });

  const userId = (req as any).user?.id;
  const { code, name, nameAr, description, descriptionAr, entityType, priority, matchConditions, isActive, goals } = req.body;

  if (!code || !name || !entityType) {
    return void res.status(400).json({ success: false, message: 'code, name, and entityType are required' });
  }

  // Check uniqueness
  const existing = await repos.policyRepo.findByCode(tenantId, code);
  if (existing) return void res.status(409).json({ success: false, message: 'Policy code already exists' });

  const policy = await repos.policyRepo.create({
    tenantId,
    code,
    name,
    nameAr,
    description,
    descriptionAr,
    entityType,
    priority: priority ?? 100,
    matchConditions: matchConditions || [],
    isActive: isActive ?? true,
    createdBy: userId,
  });

  // Create goals if provided
  if (Array.isArray(goals)) {
    for (const g of goals) {
      await repos.policyRepo.createGoal({
        policyId: policy.id!,
        metricKey: g.metricKey,
        targetMinutes: g.targetMinutes,
        calendarId: g.calendarId,
        startEvent: g.startEvent || 'ticket_created',
        stopEvent: g.stopEvent || 'resolved',
        pauseOnStatuses: g.pauseOnStatuses || [],
        resumeOnStatuses: g.resumeOnStatuses || [],
        breachSeverity: g.breachSeverity || 'warning',
      });
    }
  }

  const createdGoals = await repos.policyRepo.findGoalsByPolicyId(policy.id!);
  res.status(201).json({ success: true, data: { ...policy, goals: createdGoals } });
});

export const updatePolicy = asyncHandler(async (req: Request, res: Response) => {
  const repos = getSlaRepos();
  const { name, nameAr, description, descriptionAr, entityType, priority, matchConditions, isActive } = req.body;

  const policy = await repos.policyRepo.update(req.params.id, {
    name,
    nameAr,
    description,
    descriptionAr,
    entityType,
    priority,
    matchConditions,
    isActive,
  });

  if (!policy) return void res.status(404).json({ success: false, message: 'Policy not found' });
  res.json({ success: true, data: policy });
});

export const deletePolicy = asyncHandler(async (req: Request, res: Response) => {
  const repos = getSlaRepos();
  const deleted = await repos.policyRepo.delete(req.params.id);
  if (!deleted) return void res.status(404).json({ success: false, message: 'Policy not found' });
  res.json({ success: true, message: 'Policy deleted' });
});

export const activatePolicy = asyncHandler(async (req: Request, res: Response) => {
  const repos = getSlaRepos();
  const policy = await repos.policyRepo.activate(req.params.id);
  if (!policy) return void res.status(404).json({ success: false, message: 'Policy not found' });
  res.json({ success: true, data: policy });
});

export const deactivatePolicy = asyncHandler(async (req: Request, res: Response) => {
  const repos = getSlaRepos();
  const policy = await repos.policyRepo.deactivate(req.params.id);
  if (!policy) return void res.status(404).json({ success: false, message: 'Policy not found' });
  res.json({ success: true, data: policy });
});

// ── Goals ────────────────────────────────────────────────────

export const listGoals = asyncHandler(async (req: Request, res: Response) => {
  const repos = getSlaRepos();
  const goals = await repos.policyRepo.findGoalsByPolicyId(req.params.policyId);
  res.json({ success: true, data: goals });
});

export const createGoal = asyncHandler(async (req: Request, res: Response) => {
  const repos = getSlaRepos();
  const { metricKey, targetMinutes, calendarId, startEvent, stopEvent, pauseOnStatuses, resumeOnStatuses, breachSeverity } = req.body;

  if (!metricKey || !targetMinutes) {
    return void res.status(400).json({ success: false, message: 'metricKey and targetMinutes are required' });
  }

  const goal = await repos.policyRepo.createGoal({
    policyId: req.params.policyId,
    metricKey,
    targetMinutes,
    calendarId,
    startEvent: startEvent || 'ticket_created',
    stopEvent: stopEvent || 'resolved',
    pauseOnStatuses: pauseOnStatuses || [],
    resumeOnStatuses: resumeOnStatuses || [],
    breachSeverity: breachSeverity || 'warning',
  });

  res.status(201).json({ success: true, data: goal });
});

export const updateGoal = asyncHandler(async (req: Request, res: Response) => {
  const repos = getSlaRepos();
  const goal = await repos.policyRepo.updateGoal(req.params.goalId, req.body);
  if (!goal) return void res.status(404).json({ success: false, message: 'Goal not found' });
  res.json({ success: true, data: goal });
});

export const deleteGoal = asyncHandler(async (req: Request, res: Response) => {
  const repos = getSlaRepos();
  const deleted = await repos.policyRepo.deleteGoal(req.params.goalId);
  if (!deleted) return void res.status(404).json({ success: false, message: 'Goal not found' });
  res.json({ success: true, message: 'Goal deleted' });
});

// ── Escalation Rules ─────────────────────────────────────────

export const listEscalationRules = asyncHandler(async (req: Request, res: Response) => {
  const repos = getSlaRepos();
  const rules = await repos.policyRepo.findEscalationRulesByGoalId(req.params.goalId);
  res.json({ success: true, data: rules });
});

export const createEscalationRule = asyncHandler(async (req: Request, res: Response) => {
  const repos = getSlaRepos();
  const { triggerType, offsetMinutes, actionType, actionConfig, isActive, sortOrder } = req.body;

  if (!triggerType || !actionType) {
    return void res.status(400).json({ success: false, message: 'triggerType and actionType are required' });
  }

  const rule = await repos.policyRepo.createEscalationRule({
    goalId: req.params.goalId,
    triggerType,
    offsetMinutes: offsetMinutes ?? 0,
    actionType,
    actionConfig: actionConfig || {},
    isActive: isActive ?? true,
    sortOrder: sortOrder ?? 0,
  });

  res.status(201).json({ success: true, data: rule });
});

export const deleteEscalationRule = asyncHandler(async (req: Request, res: Response) => {
  const repos = getSlaRepos();
  const deleted = await repos.policyRepo.deleteEscalationRule(req.params.ruleId);
  if (!deleted) return void res.status(404).json({ success: false, message: 'Escalation rule not found' });
  res.json({ success: true, message: 'Escalation rule deleted' });
});
