import { Request, Response, NextFunction } from 'express';
import { UserRole } from './index';

// Re-export from models
export { MethodologyCode, ProjectRole, ProjectStatus } from '../models/pm/Project';
export { PMTaskType as TaskType, PMTaskPriority as TaskPriority, PMStatusCategory as StatusCategory } from '../models/pm/Task';

// Organization Role enum
export enum OrganizationRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member'
}

// Auth Request type for PM module - extends Express Request with proper user typing
export interface PMAuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    phone?: string;
    isActive: boolean;
    organizations: Array<{
      organizationId: string;
      role: string;
      joinedAt: Date;
    }>;
    organizationId?: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

// Handler type for PM controllers
export type PMRequestHandler = (req: PMAuthRequest, res: Response, next?: NextFunction) => Promise<void>;

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
