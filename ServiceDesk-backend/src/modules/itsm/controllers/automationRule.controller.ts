import { Request, Response } from 'express';
import {
  AutomationRule,
  RuleExecutionLog,
  RuleTemplate,
  AutomationRuleStatus,
  RuleTriggerType,
} from '../models';
import logger from '../../../utils/logger';
import { getItsmRepos, isItsmPostgres } from '../infrastructure/repositories';
import { PgAutomationRuleRepository } from '../infrastructure/repositories/PgAutomationRuleRepository';
import { PgRuleExecutionLogRepository } from '../infrastructure/repositories/PgRuleExecutionLogRepository';
import asyncHandler from '../../../utils/asyncHandler';
import { sendSuccess, sendPaginated, sendError } from '../../../utils/ApiResponse';

/**
 * Automation Rules Controller
 * Handles CRUD operations for automation rules, execution logs, and templates
 */

// GET /api/v2/itsm/automation/rules - List automation rules
export const getRules = asyncHandler(async (req: Request, res: Response) => {
  const {
      status,
      triggerType,
      q,
      page = '1',
      limit = '25',
      sort = 'createdAt',
      sortDir = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 25));

    // ── PostgreSQL path ──
    if (isItsmPostgres()) {
      const repo = getItsmRepos().automationRule as PgAutomationRuleRepository;
      const result = await repo.searchRules(
        { status, triggerType, q, sort, sortDir },
        pageNum,
        limitNum,
      );
      return void sendPaginated(req, res, result.data, result.page, result.limit, result.total);
    }

    // ── MongoDB path ──
    const skip = (pageNum - 1) * limitNum;

    const query: Record<string, unknown> = {};

    if (status) query.status = status;
    if (triggerType) query['trigger.type'] = triggerType;

    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { ruleId: { $regex: q, $options: 'i' } },
      ];
    }

    const sortObj: Record<string, 1 | -1> = {};
    sortObj[sort as string] = sortDir === 'desc' ? -1 : 1;

    const [rules, total] = await Promise.all([
      AutomationRule.find(query)
        .populate('createdBy', 'name email')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AutomationRule.countDocuments(query),
    ]);

    sendPaginated(req, res, rules, pageNum, limitNum, total);
});

// GET /api/v2/itsm/automation/rules/:id - Get single rule
export const getRule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  let rule: any;
  if (isItsmPostgres()) {
    const repo = getItsmRepos().automationRule as PgAutomationRuleRepository;
    rule = await repo.findByRuleId(id) || await repo.findById(id);
  } else {
    rule = await AutomationRule.findById(id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
  }

  if (!rule) return void sendError(req, res, 404, 'Automation rule not found');
  sendSuccess(req, res, rule);
});

// POST /api/v2/itsm/automation/rules - Create automation rule
export const createRule = asyncHandler(async (req: Request, res: Response) => {
  const ruleData = {
      ...req.body,
      createdBy: req.user?.id,
      updatedBy: req.user?.id,
      status: req.body.status || AutomationRuleStatus.DRAFT,
    };

    // Validate rule structure
    const validationErrors: string[] = [];
    if (!ruleData.trigger?.type) validationErrors.push('Trigger type is required');
    if (!ruleData.actions || ruleData.actions.length === 0) validationErrors.push('At least one action is required');

    ruleData.isValid = validationErrors.length === 0;
    ruleData.validationErrors = validationErrors;

    let rule: any;
    if (isItsmPostgres()) {
      const repo = getItsmRepos().automationRule as PgAutomationRuleRepository;
      rule = await repo.create(ruleData as any);
    } else {
      const mongoRule = new AutomationRule(ruleData);
      await mongoRule.save();
      rule = mongoRule;
    }

    logger.info(`Automation rule created: ${rule.ruleId} by user ${req.user?.id}`);

    sendSuccess(req, res, rule, 'Automation rule created successfully', 201);
});

// PUT /api/v2/itsm/automation/rules/:id - Update automation rule
export const updateRule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const trackFields = ['name', 'status', 'trigger', 'conditions', 'actions'];

  // ── PostgreSQL path ──
  if (isItsmPostgres()) {
    const repo = getItsmRepos().automationRule as PgAutomationRuleRepository;
    let rule = await repo.findByRuleId(id) || await repo.findById(id);
    if (!rule) return void sendError(req, res, 404, 'Automation rule not found');
      const ruleId = (rule as any)._id || (rule as any).id;

      const changes: Record<string, { old: unknown; new: unknown }> = {};
      for (const field of trackFields) {
        if (req.body[field] !== undefined) {
          changes[field] = { old: (rule as any)[field], new: req.body[field] };
        }
      }

      if (Object.keys(changes).length > 0) {
        await repo.pushToJsonArray(ruleId, 'history', {
          version: (rule as any).version || 1,
          timestamp: new Date(),
          userId: req.user?.id,
          changes,
        });
        await repo.incrementVersion(ruleId);
      }

      // Re-validate
      const merged = { ...(rule as any), ...req.body };
      const validationErrors: string[] = [];
      if (!merged.trigger?.type) validationErrors.push('Trigger type is required');
      if (!merged.actions || merged.actions.length === 0) validationErrors.push('At least one action is required');

      rule = await repo.updateById(ruleId, {
        ...req.body,
        updatedBy: req.user?.id,
        isValid: validationErrors.length === 0,
        validationErrors,
      } as any);

      logger.info(`Automation rule updated: ${(rule as any).ruleId} by user ${req.user?.id}`);
      return void sendSuccess(req, res, rule, 'Automation rule updated successfully');
    }

    // ── MongoDB path ──
    const rule = await AutomationRule.findById(id);
    if (!rule) return void sendError(req, res, 404, 'Automation rule not found');

    // Track changes for history
    const changes: Record<string, { old: unknown; new: unknown }> = {};

    for (const field of trackFields) {
      if (req.body[field] !== undefined) {
        changes[field] = { old: rule.get(field), new: req.body[field] };
      }
    }

    if (Object.keys(changes).length > 0) {
      rule.history.push({
        version: rule.version,
        timestamp: new Date(),
        userId: req.user?.id as any,
        changes,
      });
      rule.version += 1;
    }

    Object.assign(rule, req.body, {
      updatedBy: req.user?.id,
    });

    // Re-validate
    const validationErrors: string[] = [];
    if (!rule.trigger?.type) validationErrors.push('Trigger type is required');
    if (!rule.actions || rule.actions.length === 0) validationErrors.push('At least one action is required');
    rule.isValid = validationErrors.length === 0;
    rule.validationErrors = validationErrors;

    await rule.save();

    logger.info(`Automation rule updated: ${rule.ruleId} by user ${req.user?.id}`);

    sendSuccess(req, res, rule, 'Automation rule updated successfully');
});

// DELETE /api/v2/itsm/automation/rules/:id - Delete automation rule
export const deleteRule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // ── PostgreSQL path ──
  if (isItsmPostgres()) {
    const repo = getItsmRepos().automationRule as PgAutomationRuleRepository;
    const rule = await repo.findByRuleId(id) || await repo.findById(id);
    if (!rule) return void sendError(req, res, 404, 'Automation rule not found');
    await repo.updateById((rule as any)._id || (rule as any).id, { status: AutomationRuleStatus.DEPRECATED, updatedBy: req.user?.id } as any);
    logger.info(`Automation rule deprecated: ${(rule as any).ruleId} by user ${req.user?.id}`);
    return void sendSuccess(req, res, null, 'Automation rule deprecated successfully');
  }

  // ── MongoDB path ──
  const rule = await AutomationRule.findById(id);
  if (!rule) return void sendError(req, res, 404, 'Automation rule not found');

  // Soft delete - deprecate instead of removing
  rule.status = AutomationRuleStatus.DEPRECATED;
  rule.updatedBy = req.user?.id as any;
  await rule.save();

  logger.info(`Automation rule deprecated: ${rule.ruleId} by user ${req.user?.id}`);
  sendSuccess(req, res, null, 'Automation rule deprecated successfully');
});

// POST /api/v2/itsm/automation/rules/:id/activate - Activate rule
export const activateRule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // ── PostgreSQL path ──
  if (isItsmPostgres()) {
    const repo = getItsmRepos().automationRule as PgAutomationRuleRepository;
    const rule = await repo.findByRuleId(id) || await repo.findById(id);
    if (!rule) return void sendError(req, res, 404, 'Automation rule not found');
    if (!(rule as any).isValid) return void sendError(req, res, 400, 'Cannot activate invalid rule');
    const updated = await repo.updateById((rule as any)._id || (rule as any).id, { status: AutomationRuleStatus.ACTIVE, updatedBy: req.user?.id } as any);
    return void sendSuccess(req, res, updated, 'Automation rule activated');
  }

  // ── MongoDB path ──
  const rule = await AutomationRule.findById(id);
  if (!rule) return void sendError(req, res, 404, 'Automation rule not found');
  if (!rule.isValid) return void sendError(req, res, 400, 'Cannot activate invalid rule');

  rule.status = AutomationRuleStatus.ACTIVE;
  rule.updatedBy = req.user?.id as any;
  await rule.save();

  sendSuccess(req, res, rule, 'Automation rule activated');
});

// POST /api/v2/itsm/automation/rules/:id/deactivate - Deactivate rule
export const deactivateRule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // ── PostgreSQL path ──
  if (isItsmPostgres()) {
    const repo = getItsmRepos().automationRule as PgAutomationRuleRepository;
    const rule = await repo.findByRuleId(id) || await repo.findById(id);
    if (!rule) return void sendError(req, res, 404, 'Automation rule not found');
    const updated = await repo.updateById((rule as any)._id || (rule as any).id, { status: AutomationRuleStatus.INACTIVE, updatedBy: req.user?.id } as any);
    return void sendSuccess(req, res, updated, 'Automation rule deactivated');
  }

  // ── MongoDB path ──
  const rule = await AutomationRule.findById(id);
  if (!rule) return void sendError(req, res, 404, 'Automation rule not found');

  rule.status = AutomationRuleStatus.INACTIVE;
  rule.updatedBy = req.user?.id as any;
  await rule.save();

  sendSuccess(req, res, rule, 'Automation rule deactivated');
});

// GET /api/v2/itsm/automation/rules/:id/logs - Get execution logs for a rule
export const getRuleLogs = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { page = '1', limit = '25', status } = req.query;

  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 25));

  // ── PostgreSQL path ──
  if (isItsmPostgres()) {
    const logRepo = getItsmRepos().ruleExecutionLog as PgRuleExecutionLogRepository;
    const result = await logRepo.findByRuleId(id, { status: status as string }, pageNum, limitNum);
    return void sendPaginated(req, res, result.data, result.page, result.limit, result.total);
  }

  // ── MongoDB path ──
  const skip = (pageNum - 1) * limitNum;

  const query: Record<string, unknown> = { ruleId: id };
  if (status) query.status = status;

  const [logs, total] = await Promise.all([
    RuleExecutionLog.find(query)
      .sort({ startedAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    RuleExecutionLog.countDocuments(query),
  ]);

  sendPaginated(req, res, logs, pageNum, limitNum, total);
});

// GET /api/v2/itsm/automation/templates - List rule templates
export const getTemplates = asyncHandler(async (req: Request, res: Response) => {
  const { category, q } = req.query;

  const query: Record<string, unknown> = {};
  if (category) query.category = category;
  if (q) {
    query.$or = [
      { name: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
    ];
  }

  const templates = await RuleTemplate.find(query)
    .sort({ usageCount: -1 })
    .lean();

  sendSuccess(req, res, templates);
});

// POST /api/v2/itsm/automation/rules/from-template/:templateId - Create rule from template
export const createRuleFromTemplate = asyncHandler(async (req: Request, res: Response) => {
  const { templateId } = req.params;

  const template = await RuleTemplate.findById(templateId);
  if (!template) return void sendError(req, res, 404, 'Template not found');

    const { name, description } = req.body;

    const rule = new AutomationRule({
      name: name || `${template.name} (Copy)`,
      description: description || template.description,
      trigger: template.trigger,
      conditions: template.conditions,
      actions: template.actions,
      execution: template.execution,
      scope: template.scope,
      status: AutomationRuleStatus.DRAFT,
      createdBy: req.user?.id,
      updatedBy: req.user?.id,
      isValid: true,
    });

    await rule.save();

    // Increment template usage
    await RuleTemplate.findByIdAndUpdate(templateId, { $inc: { usageCount: 1 } });

    sendSuccess(req, res, rule, 'Rule created from template successfully', 201);
});

// GET /api/v2/itsm/automation/stats - Get automation statistics
export const getAutomationStats = asyncHandler(async (req: Request, res: Response) => {
  // ── PostgreSQL path ──
  if (isItsmPostgres()) {
      const ruleRepo = getItsmRepos().automationRule as PgAutomationRuleRepository;
      const logRepo = getItsmRepos().ruleExecutionLog as PgRuleExecutionLogRepository;
      const [ruleStats, recentExecutions, executionStats] = await Promise.all([
        ruleRepo.getStats(),
        logRepo.getRecent(10),
        logRepo.getExecutionStats(),
      ]);
      return void sendSuccess(req, res, { ...ruleStats, recentExecutions, executionStats });
    }

    // ── MongoDB path ──
    const [
      totalRules,
      activeRules,
      statusCounts,
      triggerCounts,
      recentExecutions,
      executionStats,
    ] = await Promise.all([
      AutomationRule.countDocuments(),
      AutomationRule.countDocuments({ status: AutomationRuleStatus.ACTIVE }),
      AutomationRule.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      AutomationRule.aggregate([
        { $match: { status: AutomationRuleStatus.ACTIVE } },
        { $group: { _id: '$trigger.type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      RuleExecutionLog.find()
        .sort({ startedAt: -1 })
        .limit(10)
        .select('ruleName status durationMs startedAt triggerType')
        .lean(),
      RuleExecutionLog.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgDuration: { $avg: '$durationMs' },
          },
        },
      ]),
    ]);

    sendSuccess(req, res, {
      totalRules,
      activeRules,
      byStatus: statusCounts,
      byTrigger: triggerCounts,
      recentExecutions,
      executionStats,
    });
});
