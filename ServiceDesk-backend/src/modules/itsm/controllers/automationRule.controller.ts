import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import {
  AutomationRule,
  RuleExecutionLog,
  RuleTemplate,
  AutomationRuleStatus,
  RuleTriggerType,
} from '../models';
import { ApiResponse } from '../../../types/pm';
import logger from '../../../utils/logger';
import { getItsmRepos, isItsmPostgres } from '../infrastructure/repositories';
import { PgAutomationRuleRepository } from '../infrastructure/repositories/PgAutomationRuleRepository';
import { PgRuleExecutionLogRepository } from '../infrastructure/repositories/PgRuleExecutionLogRepository';

/**
 * Automation Rules Controller
 * Handles CRUD operations for automation rules, execution logs, and templates
 */

// GET /api/v2/itsm/automation/rules - List automation rules
export const getRules = async (req: Request, res: Response): Promise<void> => {
  try {
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
      res.json({
        success: true,
        data: {
          rules: result.data,
          pagination: { page: result.page, limit: result.limit, total: result.total, pages: result.totalPages },
        },
      } as ApiResponse);
      return;
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

    res.json({
      success: true,
      data: {
        rules,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    } as ApiResponse);
  } catch (error) {
    logger.error('Error fetching automation rules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch automation rules',
    } as ApiResponse);
  }
};

// GET /api/v2/itsm/automation/rules/:id - Get single rule
export const getRule = async (req: Request, res: Response): Promise<void> => {
  try {
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

    if (!rule) {
      res.status(404).json({
        success: false,
        error: 'Automation rule not found',
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: rule,
    } as ApiResponse);
  } catch (error) {
    logger.error('Error fetching automation rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch automation rule',
    } as ApiResponse);
  }
};

// POST /api/v2/itsm/automation/rules - Create automation rule
export const createRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array().map((e) => ({ field: e.type, message: e.msg })),
      } as ApiResponse);
      return;
    }

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

    res.status(201).json({
      success: true,
      data: rule,
      message: 'Automation rule created successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Error creating automation rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create automation rule',
    } as ApiResponse);
  }
};

// PUT /api/v2/itsm/automation/rules/:id - Update automation rule
export const updateRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array().map((e) => ({ field: e.type, message: e.msg })),
      } as ApiResponse);
      return;
    }

    const { id } = req.params;
    const trackFields = ['name', 'status', 'trigger', 'conditions', 'actions'];

    // ── PostgreSQL path ──
    if (isItsmPostgres()) {
      const repo = getItsmRepos().automationRule as PgAutomationRuleRepository;
      let rule = await repo.findByRuleId(id) || await repo.findById(id);
      if (!rule) {
        res.status(404).json({ success: false, error: 'Automation rule not found' } as ApiResponse);
        return;
      }
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
      res.json({ success: true, data: rule, message: 'Automation rule updated successfully' } as ApiResponse);
      return;
    }

    // ── MongoDB path ──
    const rule = await AutomationRule.findById(id);
    if (!rule) {
      res.status(404).json({
        success: false,
        error: 'Automation rule not found',
      } as ApiResponse);
      return;
    }

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

    res.json({
      success: true,
      data: rule,
      message: 'Automation rule updated successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Error updating automation rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update automation rule',
    } as ApiResponse);
  }
};

// DELETE /api/v2/itsm/automation/rules/:id - Delete automation rule
export const deleteRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // ── PostgreSQL path ──
    if (isItsmPostgres()) {
      const repo = getItsmRepos().automationRule as PgAutomationRuleRepository;
      const rule = await repo.findByRuleId(id) || await repo.findById(id);
      if (!rule) {
        res.status(404).json({ success: false, error: 'Automation rule not found' } as ApiResponse);
        return;
      }
      await repo.updateById((rule as any)._id || (rule as any).id, { status: AutomationRuleStatus.DEPRECATED, updatedBy: req.user?.id } as any);
      logger.info(`Automation rule deprecated: ${(rule as any).ruleId} by user ${req.user?.id}`);
      res.json({ success: true, message: 'Automation rule deprecated successfully' } as ApiResponse);
      return;
    }

    // ── MongoDB path ──
    const rule = await AutomationRule.findById(id);
    if (!rule) {
      res.status(404).json({
        success: false,
        error: 'Automation rule not found',
      } as ApiResponse);
      return;
    }

    // Soft delete - deprecate instead of removing
    rule.status = AutomationRuleStatus.DEPRECATED;
    rule.updatedBy = req.user?.id as any;
    await rule.save();

    logger.info(`Automation rule deprecated: ${rule.ruleId} by user ${req.user?.id}`);

    res.json({
      success: true,
      message: 'Automation rule deprecated successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Error deleting automation rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete automation rule',
    } as ApiResponse);
  }
};

// POST /api/v2/itsm/automation/rules/:id/activate - Activate rule
export const activateRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // ── PostgreSQL path ──
    if (isItsmPostgres()) {
      const repo = getItsmRepos().automationRule as PgAutomationRuleRepository;
      const rule = await repo.findByRuleId(id) || await repo.findById(id);
      if (!rule) {
        res.status(404).json({ success: false, error: 'Automation rule not found' } as ApiResponse);
        return;
      }
      if (!(rule as any).isValid) {
        res.status(400).json({ success: false, error: 'Cannot activate invalid rule', data: { validationErrors: (rule as any).validationErrors } } as ApiResponse);
        return;
      }
      const updated = await repo.updateById((rule as any)._id || (rule as any).id, { status: AutomationRuleStatus.ACTIVE, updatedBy: req.user?.id } as any);
      res.json({ success: true, data: updated, message: 'Automation rule activated' } as ApiResponse);
      return;
    }

    // ── MongoDB path ──
    const rule = await AutomationRule.findById(id);
    if (!rule) {
      res.status(404).json({
        success: false,
        error: 'Automation rule not found',
      } as ApiResponse);
      return;
    }

    if (!rule.isValid) {
      res.status(400).json({
        success: false,
        error: 'Cannot activate invalid rule',
        data: { validationErrors: rule.validationErrors },
      } as ApiResponse);
      return;
    }

    rule.status = AutomationRuleStatus.ACTIVE;
    rule.updatedBy = req.user?.id as any;
    await rule.save();

    res.json({
      success: true,
      data: rule,
      message: 'Automation rule activated',
    } as ApiResponse);
  } catch (error) {
    logger.error('Error activating rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to activate rule',
    } as ApiResponse);
  }
};

// POST /api/v2/itsm/automation/rules/:id/deactivate - Deactivate rule
export const deactivateRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // ── PostgreSQL path ──
    if (isItsmPostgres()) {
      const repo = getItsmRepos().automationRule as PgAutomationRuleRepository;
      const rule = await repo.findByRuleId(id) || await repo.findById(id);
      if (!rule) {
        res.status(404).json({ success: false, error: 'Automation rule not found' } as ApiResponse);
        return;
      }
      const updated = await repo.updateById((rule as any)._id || (rule as any).id, { status: AutomationRuleStatus.INACTIVE, updatedBy: req.user?.id } as any);
      res.json({ success: true, data: updated, message: 'Automation rule deactivated' } as ApiResponse);
      return;
    }

    // ── MongoDB path ──
    const rule = await AutomationRule.findById(id);
    if (!rule) {
      res.status(404).json({
        success: false,
        error: 'Automation rule not found',
      } as ApiResponse);
      return;
    }

    rule.status = AutomationRuleStatus.INACTIVE;
    rule.updatedBy = req.user?.id as any;
    await rule.save();

    res.json({
      success: true,
      data: rule,
      message: 'Automation rule deactivated',
    } as ApiResponse);
  } catch (error) {
    logger.error('Error deactivating rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate rule',
    } as ApiResponse);
  }
};

// GET /api/v2/itsm/automation/rules/:id/logs - Get execution logs for a rule
export const getRuleLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '25', status } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 25));

    // ── PostgreSQL path ──
    if (isItsmPostgres()) {
      const logRepo = getItsmRepos().ruleExecutionLog as PgRuleExecutionLogRepository;
      const result = await logRepo.findByRuleId(id, { status: status as string }, pageNum, limitNum);
      res.json({
        success: true,
        data: {
          logs: result.data,
          pagination: { page: result.page, limit: result.limit, total: result.total, pages: result.totalPages },
        },
      } as ApiResponse);
      return;
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

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    } as ApiResponse);
  } catch (error) {
    logger.error('Error fetching rule logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch execution logs',
    } as ApiResponse);
  }
};

// GET /api/v2/itsm/automation/templates - List rule templates
export const getTemplates = async (req: Request, res: Response): Promise<void> => {
  try {
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

    res.json({
      success: true,
      data: templates,
    } as ApiResponse);
  } catch (error) {
    logger.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch templates',
    } as ApiResponse);
  }
};

// POST /api/v2/itsm/automation/rules/from-template/:templateId - Create rule from template
export const createRuleFromTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { templateId } = req.params;

    const template = await RuleTemplate.findById(templateId);
    if (!template) {
      res.status(404).json({
        success: false,
        error: 'Template not found',
      } as ApiResponse);
      return;
    }

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

    res.status(201).json({
      success: true,
      data: rule,
      message: 'Rule created from template successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Error creating rule from template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create rule from template',
    } as ApiResponse);
  }
};

// GET /api/v2/itsm/automation/stats - Get automation statistics
export const getAutomationStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // ── PostgreSQL path ──
    if (isItsmPostgres()) {
      const ruleRepo = getItsmRepos().automationRule as PgAutomationRuleRepository;
      const logRepo = getItsmRepos().ruleExecutionLog as PgRuleExecutionLogRepository;
      const [ruleStats, recentExecutions, executionStats] = await Promise.all([
        ruleRepo.getStats(),
        logRepo.getRecent(10),
        logRepo.getExecutionStats(),
      ]);
      res.json({
        success: true,
        data: {
          ...ruleStats,
          recentExecutions,
          executionStats,
        },
      } as ApiResponse);
      return;
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

    res.json({
      success: true,
      data: {
        totalRules,
        activeRules,
        byStatus: statusCounts,
        byTrigger: triggerCounts,
        recentExecutions,
        executionStats,
      },
    } as ApiResponse);
  } catch (error) {
    logger.error('Error fetching automation stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch automation statistics',
    } as ApiResponse);
  }
};
