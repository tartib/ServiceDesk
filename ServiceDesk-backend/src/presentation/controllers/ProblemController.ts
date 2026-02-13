import { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler';
import problemService from '../../core/services/ProblemService';
import { ProblemStatus, Priority } from '../../core/types/itsm.types';

export class ProblemController {
  /**
   * Create a new problem
   * POST /api/v2/problems
   */
  createProblem = asyncHandler(async (req: Request, res: Response) => {
    const {
      title,
      description,
      priority,
      impact,
      category_id,
      subcategory_id,
      site_id,
      linked_incidents,
      tags,
      affected_services,
    } = req.body;

    const user = (req as any).user;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const userId = user.id || user._id;
    const problem = await problemService.createProblem({
      title,
      description,
      priority,
      impact,
      category_id,
      subcategory_id,
      owner: {
        id: typeof userId === 'object' ? userId.toString() : userId,
        name: user.name,
        email: user.email,
      },
      site_id,
      linked_incidents,
      tags,
      affected_services,
    });

    res.status(201).json({
      success: true,
      data: { problem },
      message: 'Problem created successfully',
    });
  });

  /**
   * Create problem from incident
   * POST /api/v2/problems/from-incident/:incidentId
   */
  createFromIncident = asyncHandler(async (req: Request, res: Response) => {
    const problem = await problemService.createFromIncident(
      req.params.incidentId,
      (req as any).user!._id.toString(),
      (req as any).user!.name,
      (req as any).user!.email
    );

    res.status(201).json({
      success: true,
      data: { problem },
      message: 'Problem created from incident successfully',
    });
  });

  /**
   * Get problem by ID
   * GET /api/v2/problems/:id
   */
  getProblem = asyncHandler(async (req: Request, res: Response) => {
    const problem = await problemService.getProblem(req.params.id);

    res.json({
      success: true,
      data: { problem },
    });
  });

  /**
   * Update problem
   * PATCH /api/v2/problems/:id
   */
  updateProblem = asyncHandler(async (req: Request, res: Response) => {
    const problem = await problemService.updateProblem(
      req.params.id,
      req.body,
      (req as any).user!._id.toString(),
      (req as any).user!.name
    );

    res.json({
      success: true,
      data: { problem },
      message: 'Problem updated successfully',
    });
  });

  /**
   * Update root cause analysis
   * PATCH /api/v2/problems/:id/rca
   */
  updateRootCause = asyncHandler(async (req: Request, res: Response) => {
    const { root_cause, workaround } = req.body;

    const problem = await problemService.updateRootCause(
      req.params.id,
      root_cause,
      workaround,
      (req as any).user!._id.toString(),
      (req as any).user!.name
    );

    res.json({
      success: true,
      data: { problem },
      message: 'Root cause analysis updated',
    });
  });

  /**
   * Mark problem as known error
   * POST /api/v2/problems/:id/known-error
   */
  markAsKnownError = asyncHandler(async (req: Request, res: Response) => {
    const { title, symptoms, root_cause, workaround } = req.body;

    const problem = await problemService.markAsKnownError(
      req.params.id,
      { title, symptoms, root_cause, workaround, documented_by: (req as any).user!._id.toString() },
      (req as any).user!._id.toString(),
      (req as any).user!.name
    );

    res.json({
      success: true,
      data: { problem },
      message: 'Problem marked as known error',
    });
  });

  /**
   * Link incident to problem
   * POST /api/v2/problems/:id/link-incident
   */
  linkIncident = asyncHandler(async (req: Request, res: Response) => {
    const { incident_id } = req.body;

    const problem = await problemService.linkIncident(
      req.params.id,
      incident_id,
      (req as any).user!._id.toString(),
      (req as any).user!.name
    );

    res.json({
      success: true,
      data: { problem },
      message: `Incident ${incident_id} linked to problem`,
    });
  });

  /**
   * Update problem status
   * PATCH /api/v2/problems/:id/status
   */
  updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body;
    const user = (req as any).user;
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const userId = user.id || user._id;
    const problem = await problemService.updateStatus(
      req.params.id,
      status as ProblemStatus,
      typeof userId === 'object' ? userId.toString() : userId,
      user.name
    );

    res.json({
      success: true,
      data: { problem },
      message: `Problem status updated to ${status}`,
    });
  });

  /**
   * Resolve problem
   * POST /api/v2/problems/:id/resolve
   */
  resolveProblem = asyncHandler(async (req: Request, res: Response) => {
    const { permanent_fix } = req.body;

    const problem = await problemService.resolveProblem(
      req.params.id,
      permanent_fix,
      (req as any).user!._id.toString(),
      (req as any).user!.name
    );

    res.json({
      success: true,
      data: { problem },
      message: 'Problem resolved successfully',
    });
  });

  /**
   * Get problems with filters
   * GET /api/v2/problems
   */
  getProblems = asyncHandler(async (req: Request, res: Response) => {
    const { status, priority, owner, site_id, category_id, page, limit } = req.query;

    const result = await problemService.getProblems({
      status: status ? (status as string).split(',') as ProblemStatus[] : undefined,
      priority: priority ? (priority as string).split(',') as Priority[] : undefined,
      owner: owner as string,
      site_id: site_id as string,
      category_id: category_id as string,
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
   * Get problem statistics
   * GET /api/v2/problems/stats
   */
  getStats = asyncHandler(async (req: Request, res: Response) => {
    const { site_id } = req.query;

    const stats = await problemService.getStats(site_id as string);

    res.json({
      success: true,
      data: stats,
    });
  });

  /**
   * Get open problems
   * GET /api/v2/problems/open
   */
  getOpenProblems = asyncHandler(async (_req: Request, res: Response) => {
    const problems = await problemService.getOpenProblems();

    res.json({
      success: true,
      data: problems,
      count: problems.length,
    });
  });

  /**
   * Get known errors
   * GET /api/v2/problems/known-errors
   */
  getKnownErrors = asyncHandler(async (_req: Request, res: Response) => {
    const problems = await problemService.getKnownErrors();

    res.json({
      success: true,
      data: problems,
      count: problems.length,
    });
  });
}

export default new ProblemController();
