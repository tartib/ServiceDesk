/**
 * PM Domain Interfaces
 *
 * Core domain entity interfaces for Project Management.
 * Only the primary entities are defined here — secondary models
 * (Phase, Gate, Milestone, etc.) use the Mongoose interfaces directly
 * until they warrant their own domain abstraction.
 */

// Re-export key enums from models
export {
  MethodologyCode,
  ProjectRole,
  ProjectStatus,
} from '../models/Project';

export {
  PMTaskType,
  PMTaskPriority,
  PMStatusCategory,
} from '../models/Task';

// ── Project Domain Entity ────────────────────────────────────

export interface IProjectEntity {
  _id?: string;
  name: string;
  key: string;
  description?: string;
  status: string;
  methodology: string;
  owner: string;
  organization: string;
  members: {
    user: string;
    role: string;
    joinedAt: Date;
  }[];
  startDate?: Date;
  endDate?: Date;
  settings?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

// ── Task Domain Entity ───────────────────────────────────────

export interface ITaskEntity {
  _id?: string;
  key: string;
  title: string;
  description?: string;
  type: string;
  priority: string;
  status: {
    name: string;
    category: string;
  };
  project: string;
  sprint?: string;
  assignee?: string;
  reporter: string;
  parentId?: string;
  subtasks?: string[];
  storyPoints?: number;
  labels?: string[];
  dueDate?: Date;
  startDate?: Date;
  completedAt?: Date;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// ── Sprint Domain Entity ─────────────────────────────────────

export interface ISprintEntity {
  _id?: string;
  name: string;
  project: string;
  goal?: string;
  status: string;
  startDate?: Date;
  endDate?: Date;
  tasks?: string[];
  velocity?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// ── Board Domain Entity ──────────────────────────────────────

export interface IBoardEntity {
  _id?: string;
  name: string;
  project: string;
  columns: {
    id: string;
    name: string;
    statusCategory: string;
    wipLimit?: number;
    order: number;
  }[];
  settings?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}
