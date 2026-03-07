/**
 * PM Module — Internal API Facade
 *
 * Public contract for other modules to interact with Project Management.
 * Wraps internal models — consumers never import PM models directly.
 */

import { IPmApi, PaginationOptions, PaginatedResult } from '../../../shared/internal-api/types';

export class PmApiImpl implements IPmApi {
  readonly moduleName = 'pm';

  private get Project() {
    return require('../models').Project;
  }

  private get Task() {
    return require('../models').Task;
  }

  private get Sprint() {
    return require('../models').Sprint;
  }

  private get Board() {
    return require('../models').Board;
  }

  async getProject(id: string): Promise<any | null> {
    return this.Project.findById(id).lean();
  }

  async listProjects(
    orgId: string,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const query = { organization: orgId };

    const [data, total] = await Promise.all([
      this.Project.find(query)
        .sort({ [sort]: order === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.Project.countDocuments(query),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getTask(id: string): Promise<any | null> {
    return this.Task.findById(id).lean();
  }

  async listTasks(
    filters: Record<string, any> = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};
    if (filters.project) query.project = filters.project;
    if (filters.sprint) query.sprint = filters.sprint;
    if (filters.assignee) query.assignee = filters.assignee;
    if (filters.status) query['status.name'] = filters.status;

    const [data, total] = await Promise.all([
      this.Task.find(query)
        .sort({ [sort]: order === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.Task.countDocuments(query),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getSprint(id: string): Promise<any | null> {
    return this.Sprint.findById(id).lean();
  }

  async getBoard(id: string): Promise<any | null> {
    return this.Board.findById(id).lean();
  }

  getTaskModel(): any {
    return this.Task;
  }

  getTaskEnums(): { PMStatusCategory: any; PMTaskType: any; PMTaskPriority: any } {
    const taskModule = require('../models/Task');
    return {
      PMStatusCategory: taskModule.PMStatusCategory,
      PMTaskType: taskModule.PMTaskType,
      PMTaskPriority: taskModule.PMTaskPriority,
    };
  }
}
