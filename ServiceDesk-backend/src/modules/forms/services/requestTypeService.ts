/**
 * RequestTypeService — CRUD + workspace filtering for RequestType entities.
 */

import RequestType, {
  type IRequestTypeDocument,
  type RequestTypePriority,
} from '../models/RequestType';
import type { WorkspaceType } from '../../../shared/types/workspace.types';

export interface CreateRequestTypeDTO {
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  icon?: string;
  workspaceType?: WorkspaceType;
  formSchemaId?: string;
  workflowTemplateId?: string;
  defaultPriority?: RequestTypePriority;
  isClientVisible?: boolean;
  category?: string;
  categoryAr?: string;
  sortOrder?: number;
  organizationId: string;
  createdBy: string;
}

export interface UpdateRequestTypeDTO {
  name?: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  icon?: string;
  workspaceType?: WorkspaceType;
  formSchemaId?: string;
  workflowTemplateId?: string;
  defaultPriority?: RequestTypePriority;
  isClientVisible?: boolean;
  isActive?: boolean;
  category?: string;
  categoryAr?: string;
  sortOrder?: number;
  updatedBy: string;
}

export interface RequestTypeListOptions {
  organizationId: string;
  workspaceType?: WorkspaceType;
  isActive?: boolean;
  isClientVisible?: boolean;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface RequestTypeListResult {
  items: IRequestTypeDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class RequestTypeService {
  async create(dto: CreateRequestTypeDTO): Promise<IRequestTypeDocument> {
    const requestType = new RequestType(dto);
    return requestType.save();
  }

  async getById(id: string): Promise<IRequestTypeDocument | null> {
    return RequestType.findById(id);
  }

  async update(
    id: string,
    dto: UpdateRequestTypeDTO,
  ): Promise<IRequestTypeDocument | null> {
    return RequestType.findByIdAndUpdate(id, { $set: dto }, { new: true });
  }

  async delete(id: string): Promise<boolean> {
    const result = await RequestType.findByIdAndDelete(id);
    return !!result;
  }

  async list(options: RequestTypeListOptions): Promise<RequestTypeListResult> {
    const page = Math.max(options.page ?? 1, 1);
    const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {
      organizationId: options.organizationId,
    };

    if (options.workspaceType !== undefined) {
      filter.workspaceType = options.workspaceType;
    }
    if (options.isActive !== undefined) {
      filter.isActive = options.isActive;
    }
    if (options.isClientVisible !== undefined) {
      filter.isClientVisible = options.isClientVisible;
    }
    if (options.category) {
      filter.category = options.category;
    }
    if (options.search) {
      filter.$or = [
        { name: { $regex: options.search, $options: 'i' } },
        { nameAr: { $regex: options.search, $options: 'i' } },
        { description: { $regex: options.search, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      RequestType.find(filter).sort({ sortOrder: 1, name: 1 }).skip(skip).limit(limit),
      RequestType.countDocuments(filter),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async listByWorkspace(
    organizationId: string,
    workspaceType: WorkspaceType,
  ): Promise<IRequestTypeDocument[]> {
    return RequestType.find({
      organizationId,
      workspaceType,
      isActive: true,
    }).sort({ sortOrder: 1, name: 1 });
  }

  async getCategories(organizationId: string): Promise<string[]> {
    const result = await RequestType.distinct('category', {
      organizationId,
      isActive: true,
      category: { $ne: null },
    });
    return result.filter(Boolean) as string[];
  }
}

export const requestTypeService = new RequestTypeService();
export default requestTypeService;
