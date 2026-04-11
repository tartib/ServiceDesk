import { Request, Response } from 'express';
import asyncHandler from '../../../utils/asyncHandler';
import problemService from '../../../core/services/ProblemService';
import { ProblemStatus, Priority, RCAMethod } from '../../../core/types/itsm.types';

export class ProblemController {
  createProblem = asyncHandler(async (req: Request, res: Response) => {
    const { title, description, priority, impact, category_id, subcategory_id, site_id, linked_incidents, tags, affected_services } = req.body;
    const user = (req as any).user;
    if (!user) { throw new Error('User not authenticated'); }
    const userId = user.id || user._id;
    const problem = await problemService.createProblem({
      title, description, priority, impact, category_id, subcategory_id,
      owner: { id: typeof userId === 'object' ? userId.toString() : userId, name: user.name, email: user.email },
      site_id, linked_incidents, tags, affected_services,
    });
    res.status(201).json({ success: true, data: { problem }, message: 'Problem created successfully' });
  });

  createFromIncident = asyncHandler(async (req: Request, res: Response) => {
    const problem = await problemService.createFromIncident(req.params.incidentId, (req as any).user!.id, (req as any).user!.name, (req as any).user!.email);
    res.status(201).json({ success: true, data: { problem }, message: 'Problem created from incident successfully' });
  });

  getProblem = asyncHandler(async (req: Request, res: Response) => {
    const problem = await problemService.getProblem(req.params.id);
    res.json({ success: true, data: { problem } });
  });

  updateProblem = asyncHandler(async (req: Request, res: Response) => {
    const problem = await problemService.updateProblem(req.params.id, req.body, (req as any).user!.id, (req as any).user!.name);
    res.json({ success: true, data: { problem }, message: 'Problem updated successfully' });
  });

  updateRootCause = asyncHandler(async (req: Request, res: Response) => {
    const { root_cause, workaround } = req.body;
    const problem = await problemService.updateRootCause(req.params.id, root_cause, workaround, (req as any).user!.id, (req as any).user!.name);
    res.json({ success: true, data: { problem }, message: 'Root cause analysis updated' });
  });

  markAsKnownError = asyncHandler(async (req: Request, res: Response) => {
    const { title, symptoms, root_cause, workaround } = req.body;
    const problem = await problemService.markAsKnownError(
      req.params.id, { title, symptoms, root_cause, workaround, documented_by: (req as any).user!.id },
      (req as any).user!.id, (req as any).user!.name
    );
    res.json({ success: true, data: { problem }, message: 'Problem marked as known error' });
  });

  linkIncident = asyncHandler(async (req: Request, res: Response) => {
    const { incident_id } = req.body;
    const problem = await problemService.linkIncident(req.params.id, incident_id, (req as any).user!.id, (req as any).user!.name);
    res.json({ success: true, data: { problem }, message: `Incident ${incident_id} linked to problem` });
  });

  updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body;
    const user = (req as any).user;
    if (!user) { throw new Error('User not authenticated'); }
    const userId = user.id || user._id;
    const problem = await problemService.updateStatus(
      req.params.id, status as ProblemStatus,
      typeof userId === 'object' ? userId.toString() : userId, user.name
    );
    res.json({ success: true, data: { problem }, message: `Problem status updated to ${status}` });
  });

  resolveProblem = asyncHandler(async (req: Request, res: Response) => {
    const { permanent_fix } = req.body;
    const problem = await problemService.resolveProblem(req.params.id, permanent_fix, (req as any).user!.id, (req as any).user!.name);
    res.json({ success: true, data: { problem }, message: 'Problem resolved successfully' });
  });

  getProblems = asyncHandler(async (req: Request, res: Response) => {
    const { status, priority, owner, site_id, category_id, page, limit } = req.query;
    const result = await problemService.getProblems({
      status: status ? (status as string).split(',') as ProblemStatus[] : undefined,
      priority: priority ? (priority as string).split(',') as Priority[] : undefined,
      owner: owner as string, site_id: site_id as string, category_id: category_id as string,
      page: page ? parseInt(page as string) : 1, limit: limit ? parseInt(limit as string) : 20,
    });
    res.json({ success: true, data: result.data, pagination: result.pagination });
  });

  getStats = asyncHandler(async (req: Request, res: Response) => {
    const { site_id } = req.query;
    const stats = await problemService.getStats(site_id as string);
    res.json({ success: true, data: stats });
  });

  getOpenProblems = asyncHandler(async (_req: Request, res: Response) => {
    const problems = await problemService.getOpenProblems();
    res.json({ success: true, data: problems, count: problems.length });
  });

  getKnownErrors = asyncHandler(async (_req: Request, res: Response) => {
    const problems = await problemService.getKnownErrors();
    res.json({ success: true, data: problems, count: problems.length });
  });

  startRCA = asyncHandler(async (req: Request, res: Response) => {
    const { method } = req.body;
    const user = (req as any).user!;
    if (!method || !Object.values(RCAMethod).includes(method)) {
      res.status(400).json({ success: false, error: `method must be one of: ${Object.values(RCAMethod).join(', ')}` });
      return;
    }
    const problem = await problemService.startRCA(req.params.id, method, user.id, user.name);
    res.json({ success: true, data: { problem }, message: `RCA started using ${method}` });
  });

  completeRCA = asyncHandler(async (req: Request, res: Response) => {
    const { findings, root_cause, contributing_factors } = req.body;
    const user = (req as any).user!;
    if (!findings || !root_cause) {
      res.status(400).json({ success: false, error: 'findings and root_cause are required' });
      return;
    }
    const problem = await problemService.completeRCA(
      req.params.id, findings, root_cause, user.id, user.name,
      Array.isArray(contributing_factors) ? contributing_factors : undefined
    );
    res.json({ success: true, data: { problem }, message: 'RCA completed' });
  });

  publishKnownError = asyncHandler(async (req: Request, res: Response) => {
    const { workaround } = req.body;
    const user = (req as any).user!;
    if (!workaround) {
      res.status(400).json({ success: false, error: 'workaround is required' });
      return;
    }
    const problem = await problemService.publishKnownError(req.params.id, workaround, user.id, user.name);
    res.json({ success: true, data: { problem }, message: 'Known error workaround published' });
  });

  detectRecurring = asyncHandler(async (req: Request, res: Response) => {
    const { site_id, lookback_days, threshold } = req.query;
    const results = await problemService.detectRecurringIncidents(
      site_id as string | undefined,
      lookback_days ? parseInt(lookback_days as string) : 7,
      threshold ? parseInt(threshold as string) : 3
    );
    res.json({ success: true, data: results, count: results.length });
  });
}

export default new ProblemController();
