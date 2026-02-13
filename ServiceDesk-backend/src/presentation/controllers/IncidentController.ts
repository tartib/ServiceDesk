import { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler';
import incidentService from '../../core/services/IncidentService';
import { IncidentStatus, Priority, Channel } from '../../core/types/itsm.types';

export class IncidentController {
  /**
   * Create a new incident
   * POST /api/v2/incidents
   */
  createIncident = asyncHandler(async (req: Request, res: Response) => {
    const {
      title,
      description,
      impact,
      urgency,
      category_id,
      subcategory_id,
      channel,
      site_id,
      tags,
      is_major,
    } = req.body;

    const requester = {
      id: (req as any).user!.id,
      name: (req as any).user!.name,
      email: (req as any).user!.email,
      department: req.body.department || 'General',
      phone: req.body.phone,
    };

    const incident = await incidentService.createIncident({
      title,
      description,
      impact: impact || 'medium',
      urgency: urgency || 'medium',
      category_id: category_id || 'general',
      subcategory_id,
      requester,
      channel: channel || Channel.SELF_SERVICE,
      site_id: site_id || 'default',
      tags,
      is_major,
    });

    res.status(201).json({
      success: true,
      data: { incident },
      message: 'Incident created successfully',
    });
  });

  /**
   * Get incident by ID
   * GET /api/v2/incidents/:id
   */
  getIncident = asyncHandler(async (req: Request, res: Response) => {
    const incident = await incidentService.getIncident(req.params.id);

    res.json({
      success: true,
      data: { incident },
    });
  });

  /**
   * Update incident
   * PATCH /api/v2/incidents/:id
   */
  updateIncident = asyncHandler(async (req: Request, res: Response) => {
    const incident = await incidentService.updateIncident(
      req.params.id,
      req.body,
      (req as any).user!.id,
      (req as any).user!.name
    );

    res.json({
      success: true,
      data: { incident },
      message: 'Incident updated successfully',
    });
  });

  /**
   * Update incident status
   * PATCH /api/v2/incidents/:id/status
   */
  updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const { status, resolution } = req.body;

    const incident = await incidentService.updateStatus(
      req.params.id,
      status as IncidentStatus,
      (req as any).user!.id,
      (req as any).user!.name,
      resolution
    );

    res.json({
      success: true,
      data: { incident },
      message: `Incident status updated to ${status}`,
    });
  });

  /**
   * Assign technician to incident
   * PATCH /api/v2/incidents/:id/assign
   */
  assignIncident = asyncHandler(async (req: Request, res: Response) => {
    const { technician_id, name, email, group_id, group_name } = req.body;

    const incident = await incidentService.assignIncident(
      req.params.id,
      { technician_id, name, email, group_id, group_name },
      (req as any).user!.id,
      (req as any).user!.name
    );

    res.json({
      success: true,
      data: { incident },
      message: `Incident assigned to ${name}`,
    });
  });

  /**
   * Add worklog to incident
   * POST /api/v2/incidents/:id/worklogs
   */
  addWorklog = asyncHandler(async (req: Request, res: Response) => {
    const { minutes_spent, note, is_internal } = req.body;

    const incident = await incidentService.addWorklog(req.params.id, {
      by: (req as any).user!.id,
      by_name: (req as any).user!.name,
      minutes_spent,
      note,
      is_internal: is_internal || false,
    });

    res.status(201).json({
      success: true,
      data: { incident },
      message: 'Worklog added successfully',
    });
  });

  /**
   * Escalate incident
   * POST /api/v2/incidents/:id/escalate
   */
  escalateIncident = asyncHandler(async (req: Request, res: Response) => {
    const { reason } = req.body;

    const incident = await incidentService.escalateIncident(
      req.params.id,
      reason,
      (req as any).user!.id,
      (req as any).user!.name
    );

    res.json({
      success: true,
      data: { incident },
      message: 'Incident escalated successfully',
    });
  });

  /**
   * Link incident to problem
   * POST /api/v2/incidents/:id/link-problem
   */
  linkToProblem = asyncHandler(async (req: Request, res: Response) => {
    const { problem_id } = req.body;

    const incident = await incidentService.linkToProblem(
      req.params.id,
      problem_id,
      (req as any).user!.id,
      (req as any).user!.name
    );

    res.json({
      success: true,
      data: { incident },
      message: `Incident linked to problem ${problem_id}`,
    });
  });

  /**
   * Get incidents with filters
   * GET /api/v2/incidents
   */
  getIncidents = asyncHandler(async (req: Request, res: Response) => {
    const {
      status,
      priority,
      assignee,
      requester,
      site_id,
      category_id,
      is_major,
      breached,
      page,
      limit,
    } = req.query;

    const result = await incidentService.getIncidents({
      status: status ? (status as string).split(',') as IncidentStatus[] : undefined,
      priority: priority ? (priority as string).split(',') as Priority[] : undefined,
      assignee: assignee as string,
      requester: requester as string,
      site_id: site_id as string,
      category_id: category_id as string,
      is_major: is_major === 'true',
      breached: breached === 'true',
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
   * Search incidents
   * GET /api/v2/incidents/search
   */
  searchIncidents = asyncHandler(async (req: Request, res: Response) => {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const incidents = await incidentService.searchIncidents(q as string);

    res.json({
      success: true,
      data: incidents,
      count: incidents.length,
    });
  });

  /**
   * Get incident statistics
   * GET /api/v2/incidents/stats
   */
  getStats = asyncHandler(async (req: Request, res: Response) => {
    const { site_id } = req.query;

    const stats = await incidentService.getStats(site_id as string);

    res.json({
      success: true,
      data: stats,
    });
  });

  /**
   * Get open incidents
   * GET /api/v2/incidents/open
   */
  getOpenIncidents = asyncHandler(async (_req: Request, res: Response) => {
    const incidents = await incidentService.getOpenIncidents();

    res.json({
      success: true,
      data: incidents,
      count: incidents.length,
    });
  });

  /**
   * Get breached incidents
   * GET /api/v2/incidents/breached
   */
  getBreachedIncidents = asyncHandler(async (_req: Request, res: Response) => {
    const incidents = await incidentService.getBreachedIncidents();

    res.json({
      success: true,
      data: incidents,
      count: incidents.length,
    });
  });

  /**
   * Get unassigned incidents
   * GET /api/v2/incidents/unassigned
   */
  getUnassignedIncidents = asyncHandler(async (_req: Request, res: Response) => {
    const incidents = await incidentService.getUnassignedIncidents();

    res.json({
      success: true,
      data: incidents,
      count: incidents.length,
    });
  });

  /**
   * Get major incidents
   * GET /api/v2/incidents/major
   */
  getMajorIncidents = asyncHandler(async (_req: Request, res: Response) => {
    const incidents = await incidentService.getMajorIncidents();

    res.json({
      success: true,
      data: incidents,
      count: incidents.length,
    });
  });

  /**
   * Get my incidents (as requester)
   * GET /api/v2/incidents/my-requests
   */
  getMyRequests = asyncHandler(async (req: Request, res: Response) => {
    const result = await incidentService.getIncidents({
      requester: (req as any).user!.id,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  });

  /**
   * Get my assigned incidents (as technician)
   * GET /api/v2/incidents/my-assignments
   */
  getMyAssignments = asyncHandler(async (req: Request, res: Response) => {
    const result = await incidentService.getIncidents({
      assignee: (req as any).user!.id,
      status: [IncidentStatus.OPEN, IncidentStatus.IN_PROGRESS, IncidentStatus.PENDING],
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  });
}

export default new IncidentController();
