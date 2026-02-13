/**
 * PM Domain Contracts
 * 
 * Work Item, Project, Sprint entities and related types
 */

import {
  BaseEntity,
  Assignable,
  Prioritizable,
  Statusable,
  Commentable,
  UserRef,
} from './base.contracts';

// ============================================================
// WORK ITEM TYPES
// ============================================================

export type WorkItemType =
  | 'epic'
  | 'story'
  | 'task'
  | 'bug'
  | 'subtask'
  | 'change'
  | 'incident'
  | 'problem';

export type Methodology =
  | 'scrum'
  | 'kanban'
  | 'waterfall'
  | 'itil'
  | 'lean'
  | 'okr';

export type ProjectMemberRole =
  | 'lead'
  | 'manager'
  | 'contributor'
  | 'member'
  | 'viewer';

export type SprintStatus =
  | 'planning'
  | 'active'
  | 'completed'
  | 'cancelled';

// ============================================================
// PROJECT ENTITY
// ============================================================

export interface ProjectMember {
  user: UserRef;
  role: ProjectMemberRole;
  joinedAt: string;
}

export interface Project extends BaseEntity {
  key: string;                    // PROJ
  name: string;
  description?: string;
  
  // Organization
  organizationId: string;
  
  // Methodology
  methodology: Methodology;
  methodologyConfig?: Record<string, unknown>;
  
  // Dates
  startDate?: string;
  targetEndDate?: string;
  actualEndDate?: string;
  
  // Status
  status: 'active' | 'archived' | 'completed';
  isArchived: boolean;
  
  // Members
  members: ProjectMember[];
  
  // Counters
  taskCount: number;
  nextTaskNumber: number;
}

// ============================================================
// WORK ITEM ENTITY
// ============================================================

export interface WorkItem
  extends BaseEntity,
    Assignable,
    Prioritizable,
    Statusable,
    Commentable {
  // Identity
  key: string;                    // PROJ-123

  // Classification
  type: WorkItemType;

  // Content
  title: string;
  description?: string;

  // Hierarchy
  projectId: string;
  parentId?: string;              // For subtasks
  epicId?: string;                // Parent epic

  // Sprint
  sprintId?: string;

  // Estimation
  storyPoints?: number;
  originalEstimate?: number;      // Hours
  remainingEstimate?: number;
  timeSpent?: number;

  // Dates
  dueDate?: string;
  startDate?: string;
  completedAt?: string;

  // Labels
  labels: string[];

  // Board
  columnOrder: number;
}

// ============================================================
// SPRINT ENTITY
// ============================================================

export interface Sprint extends BaseEntity {
  name: string;
  goal?: string;
  projectId: string;
  
  // Dates
  startDate: string;
  endDate: string;
  
  // Status
  status: SprintStatus;
  
  // Capacity
  capacity?: Record<string, number>;
  
  // Metrics
  totalPoints?: number;
  completedPoints?: number;
  velocity?: number;
}

// ============================================================
// REQUEST/RESPONSE TYPES
// ============================================================

export interface CreateProjectRequest {
  key: string;
  name: string;
  description?: string;
  methodology?: Methodology;
  startDate?: string;
  targetEndDate?: string;
}

export interface CreateWorkItemRequest {
  title: string;
  description?: string;
  type?: WorkItemType;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  assignee?: string;
  storyPoints?: number;
  dueDate?: string;
  sprintId?: string;
  parentId?: string;
  epicId?: string;
  labels?: string[];
}

export interface UpdateWorkItemRequest {
  title?: string;
  description?: string;
  type?: WorkItemType;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  assignee?: string | null;
  storyPoints?: number | null;
  dueDate?: string | null;
  sprintId?: string | null;
  labels?: string[];
}

export interface CreateSprintRequest {
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
  capacity?: Record<string, number>;
}
