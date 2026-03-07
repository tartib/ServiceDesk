/**
 * ITSM Module — Internal API Facade
 *
 * Public contract for other modules to interact with ITSM.
 * Wraps internal models — consumers never import ITSM models directly.
 */

import { IItsmApi, PaginationOptions, PaginatedResult } from '../../../shared/internal-api/types';

export class ItsmApiImpl implements IItsmApi {
  readonly moduleName = 'itsm';

  private get ServiceRequest() {
    return require('../models').ServiceRequest;
  }

  private get ConfigurationItem() {
    return require('../models').ConfigurationItem;
  }

  private get ServiceCatalog() {
    return require('../models').ServiceCatalog;
  }

  private get AutomationRule() {
    return require('../models').AutomationRule;
  }

  async getServiceRequest(id: string): Promise<any | null> {
    return this.ServiceRequest.findById(id).lean();
  }

  async listServiceRequests(
    filters: Record<string, any> = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};
    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.assignedTo) query.assignedTo = filters.assignedTo;
    if (filters.department) query.department = filters.department;

    const [data, total] = await Promise.all([
      this.ServiceRequest.find(query)
        .sort({ [sort]: order === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.ServiceRequest.countDocuments(query),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getConfigItem(id: string): Promise<any | null> {
    return this.ConfigurationItem.findById(id).lean();
  }

  async listConfigItems(
    filters: Record<string, any> = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};
    if (filters.ciType) query.ciType = filters.ciType;
    if (filters.status) query.status = filters.status;
    if (filters.criticality) query.criticality = filters.criticality;

    const [data, total] = await Promise.all([
      this.ConfigurationItem.find(query)
        .sort({ [sort]: order === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.ConfigurationItem.countDocuments(query),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getCatalogItem(id: string): Promise<any | null> {
    return this.ServiceCatalog.findById(id).lean();
  }

  async listCatalogItems(filters: Record<string, any> = {}): Promise<any[]> {
    const query: Record<string, any> = {};
    if (filters.category) query.category = filters.category;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    return this.ServiceCatalog.find(query).lean();
  }

  async getAutomationRule(id: string): Promise<any | null> {
    return this.AutomationRule.findById(id).lean();
  }
}
