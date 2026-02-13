import { IProblem } from '../entities/Problem';
import Counter from '../entities/Counter';
import { ProblemStatus, Priority, Impact, IKnownError } from '../types/itsm.types';
import problemRepository from '../repositories/ProblemRepository';
import incidentRepository from '../repositories/IncidentRepository';
import logger from '../../utils/logger';
import ApiError from '../../utils/ApiError';

export interface CreateProblemDTO {
  title: string;
  description: string;
  priority: Priority;
  impact: Impact;
  category_id: string;
  subcategory_id?: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  site_id: string;
  linked_incidents?: string[];
  tags?: string[];
  affected_services?: string[];
}

export interface UpdateProblemDTO {
  title?: string;
  description?: string;
  priority?: Priority;
  impact?: Impact;
  category_id?: string;
  subcategory_id?: string;
  root_cause?: string;
  workaround?: string;
  permanent_fix?: string;
  tags?: string[];
  affected_services?: string[];
}

export class ProblemService {
  /**
   * Create a new problem
   */
  async createProblem(data: CreateProblemDTO): Promise<IProblem> {
    const problemId = await Counter.generateId('PRB');

    const problem = await problemRepository.create({
      problem_id: problemId,
      title: data.title,
      description: data.description,
      status: ProblemStatus.LOGGED,
      priority: data.priority,
      impact: data.impact,
      category_id: data.category_id,
      subcategory_id: data.subcategory_id,
      owner: data.owner,
      site_id: data.site_id,
      linked_incidents: data.linked_incidents || [],
      tags: data.tags || [],
      affected_services: data.affected_services || [],
      timeline: [],
      attachments: [],
    } as Partial<IProblem>);

    // Link incidents to this problem
    if (data.linked_incidents?.length) {
      for (const incidentId of data.linked_incidents) {
        await incidentRepository.addTimelineEvent(incidentId, {
          event: `Linked to Problem ${problemId}`,
          by: data.owner.id,
          by_name: data.owner.name,
        });
      }
    }

    logger.info(`Problem created: ${problemId}`, {
      priority: data.priority,
      linkedIncidents: data.linked_incidents?.length || 0,
    });

    return problem;
  }

  /**
   * Create problem from incident
   */
  async createFromIncident(
    incidentId: string,
    userId: string,
    userName: string,
    userEmail: string
  ): Promise<IProblem> {
    const incident = await incidentRepository.findByIncidentId(incidentId);
    if (!incident) {
      throw new ApiError(404, `Incident ${incidentId} not found`);
    }

    const problem = await this.createProblem({
      title: `Problem from ${incidentId}: ${incident.title}`,
      description: incident.description,
      priority: incident.priority,
      impact: incident.impact,
      category_id: incident.category_id,
      subcategory_id: incident.subcategory_id,
      owner: { id: userId, name: userName, email: userEmail },
      site_id: incident.site_id,
      linked_incidents: [incidentId],
      tags: incident.tags,
    });

    // Update incident with problem link
    incident.linked_problem_id = problem.problem_id;
    await incident.save();

    return problem;
  }

  /**
   * Get problem by ID (supports both _id and problem_id)
   */
  async getProblem(problemId: string): Promise<IProblem> {
    // Try to find by problem_id first (e.g., PRB-2025-00001)
    let problem = await problemRepository.findByProblemId(problemId);
    
    // If not found and looks like MongoDB ObjectId, try finding by _id
    if (!problem && problemId.match(/^[0-9a-fA-F]{24}$/)) {
      problem = await problemRepository.findById(problemId);
    }
    
    if (!problem) {
      throw new ApiError(404, `Problem ${problemId} not found`);
    }
    return problem;
  }

  /**
   * Update problem
   */
  async updateProblem(
    problemId: string,
    data: UpdateProblemDTO,
    userId: string,
    userName: string
  ): Promise<IProblem> {
    const problem = await this.getProblem(problemId);

    const updated = await problemRepository.update(problem._id.toString(), data);
    if (!updated) {
      throw new ApiError(500, 'Failed to update problem');
    }

    // Add timeline event
    updated.timeline.push({
      event: 'Problem Updated',
      by: userId,
      by_name: userName,
      time: new Date(),
      details: data,
    });
    await updated.save();

    logger.info(`Problem updated: ${problemId}`, { updatedBy: userId });

    return updated;
  }

  /**
   * Update root cause analysis
   */
  async updateRootCause(
    problemId: string,
    rootCause: string,
    workaround: string,
    userId: string,
    userName: string
  ): Promise<IProblem> {
    const updated = await problemRepository.updateRootCause(
      problemId,
      rootCause,
      workaround,
      userId,
      userName
    );

    if (!updated) {
      throw new ApiError(500, 'Failed to update root cause');
    }

    logger.info(`Root cause updated for problem: ${problemId}`);

    return updated;
  }

  /**
   * Mark problem as known error
   */
  async markAsKnownError(
    problemId: string,
    knownError: Omit<IKnownError, 'ke_id' | 'documented_at'>,
    userId: string,
    userName: string
  ): Promise<IProblem> {
    const keId = `KE-${Date.now()}`;

    const updated = await problemRepository.markAsKnownError(
      problemId,
      {
        ...knownError,
        ke_id: keId,
        documented_by: userId,
      },
      userId,
      userName
    );

    if (!updated) {
      throw new ApiError(500, 'Failed to mark as known error');
    }

    logger.info(`Problem marked as known error: ${problemId} -> ${keId}`);

    return updated;
  }

  /**
   * Link incident to problem
   */
  async linkIncident(
    problemId: string,
    incidentId: string,
    userId: string,
    userName: string
  ): Promise<IProblem> {
    // Verify incident exists
    const incident = await incidentRepository.findByIncidentId(incidentId);
    if (!incident) {
      throw new ApiError(404, `Incident ${incidentId} not found`);
    }

    const updated = await problemRepository.linkIncident(problemId, incidentId);
    if (!updated) {
      throw new ApiError(500, 'Failed to link incident');
    }

    // Update incident with problem link
    incident.linked_problem_id = problemId;
    await incidentRepository.addTimelineEvent(incidentId, {
      event: `Linked to Problem ${problemId}`,
      by: userId,
      by_name: userName,
    });
    await incident.save();

    logger.info(`Incident ${incidentId} linked to problem ${problemId}`);

    return updated;
  }

  /**
   * Update problem status
   */
  async updateStatus(
    problemId: string,
    status: ProblemStatus,
    userId: string,
    userName: string
  ): Promise<IProblem> {
    const problem = await this.getProblem(problemId);

    problem.status = status;
    if (status === ProblemStatus.CLOSED) {
      problem.closed_at = new Date();
    }

    problem.timeline.push({
      event: `Status changed to ${status}`,
      by: userId,
      by_name: userName,
      time: new Date(),
    });

    await problem.save();

    logger.info(`Problem status updated: ${problemId} -> ${status}`);

    return problem;
  }

  /**
   * Resolve problem with permanent fix
   */
  async resolveProblem(
    problemId: string,
    permanentFix: string,
    userId: string,
    userName: string
  ): Promise<IProblem> {
    const problem = await this.getProblem(problemId);

    problem.permanent_fix = permanentFix;
    problem.status = ProblemStatus.RESOLVED;

    problem.timeline.push({
      event: 'Problem Resolved',
      by: userId,
      by_name: userName,
      time: new Date(),
      details: { permanent_fix: permanentFix },
    });

    await problem.save();

    // Notify linked incidents
    for (const incidentId of problem.linked_incidents) {
      await incidentRepository.addTimelineEvent(incidentId, {
        event: `Linked Problem ${problemId} has been resolved`,
        by: 'system',
        details: { permanent_fix: permanentFix },
      });
    }

    logger.info(`Problem resolved: ${problemId}`);

    return problem;
  }

  /**
   * Get problems by various filters
   */
  async getProblems(filters: {
    status?: ProblemStatus[];
    priority?: Priority[];
    owner?: string;
    site_id?: string;
    category_id?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: IProblem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const query: any = {};

    if (filters.status?.length) {
      query.status = { $in: filters.status };
    }
    if (filters.priority?.length) {
      query.priority = { $in: filters.priority };
    }
    if (filters.owner) {
      query['owner.id'] = filters.owner;
    }
    if (filters.site_id) {
      query.site_id = filters.site_id;
    }
    if (filters.category_id) {
      query.category_id = filters.category_id;
    }

    return problemRepository.findWithPagination(
      query,
      filters.page || 1,
      filters.limit || 20,
      { priority: -1, created_at: -1 }
    );
  }

  /**
   * Get problem statistics
   */
  async getStats(siteId?: string) {
    return problemRepository.getProblemStats(siteId);
  }

  /**
   * Get open problems
   */
  async getOpenProblems(): Promise<IProblem[]> {
    return problemRepository.findOpenProblems();
  }

  /**
   * Get known errors
   */
  async getKnownErrors(): Promise<IProblem[]> {
    return problemRepository.findKnownErrors();
  }

  /**
   * Find problems by linked incident
   */
  async findByIncident(incidentId: string): Promise<IProblem[]> {
    return problemRepository.findByLinkedIncident(incidentId);
  }
}

export default new ProblemService();
