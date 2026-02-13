/**
 * Project Management (PM) DTOs
 */

// Project DTOs
export interface CreateProjectDTO {
  name: string;
  description?: string;
  key: string;
  category?: string;
  organizationId: string;
  lead?: string;
  members?: string[];
  settings?: {
    isPublic?: boolean;
    allowComments?: boolean;
    allowAttachments?: boolean;
  };
}

export interface UpdateProjectDTO {
  name?: string;
  description?: string;
  category?: string;
  lead?: string;
  settings?: {
    isPublic?: boolean;
    allowComments?: boolean;
    allowAttachments?: boolean;
  };
}

export interface ProjectDTO {
  id: string;
  name: string;
  description?: string;
  key: string;
  category?: string;
  organizationId: string;
  lead: string;
  memberCount: number;
  taskCount: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
}

export interface ProjectListDTO {
  items: ProjectDTO[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Sprint DTOs
export interface CreateSprintDTO {
  name: string;
  description?: string;
  projectId: string;
  startDate: Date;
  endDate: Date;
  goal?: string;
  capacity?: number;
}

export interface UpdateSprintDTO {
  name?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  goal?: string;
  capacity?: number;
  status?: string;
}

export interface SprintDTO {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  startDate: Date;
  endDate: Date;
  goal?: string;
  capacity: number;
  status: string;
  taskCount: number;
  completedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Board DTOs
export interface CreateBoardDTO {
  name: string;
  description?: string;
  projectId: string;
  type?: 'kanban' | 'scrum';
  columns?: string[];
}

export interface UpdateBoardDTO {
  name?: string;
  description?: string;
  columns?: string[];
}

export interface BoardDTO {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  type: 'kanban' | 'scrum';
  columns: string[];
  taskCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Task DTOs (PM)
export interface CreatePMTaskDTO {
  title: string;
  description?: string;
  projectId: string;
  sprintId?: string;
  boardId?: string;
  type?: 'story' | 'task' | 'bug' | 'epic';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  reporter?: string;
  storyPoints?: number;
  dueDate?: Date;
  labels?: string[];
  attachments?: string[];
}

export interface UpdatePMTaskDTO {
  title?: string;
  description?: string;
  type?: 'story' | 'task' | 'bug' | 'epic';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: string;
  assignee?: string;
  storyPoints?: number;
  dueDate?: Date;
  labels?: string[];
}

export interface PMTaskDTO {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  sprintId?: string;
  boardId?: string;
  type: 'story' | 'task' | 'bug' | 'epic';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  assignee?: string;
  reporter: string;
  storyPoints?: number;
  dueDate?: Date;
  labels: string[];
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Epic DTOs
export interface CreateEpicDTO {
  name: string;
  description?: string;
  projectId: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  startDate?: Date;
  endDate?: Date;
}

export interface UpdateEpicDTO {
  name?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface EpicDTO {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  startDate?: Date;
  endDate?: Date;
  taskCount: number;
  completedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Backlog DTOs
export interface BacklogItemDTO {
  id: string;
  title: string;
  type: 'story' | 'task' | 'bug';
  priority: 'low' | 'medium' | 'high' | 'critical';
  storyPoints?: number;
  status: string;
  assignee?: string;
}

export interface BacklogDTO {
  projectId: string;
  items: BacklogItemDTO[];
  total: number;
  page: number;
  limit: number;
}

// Roadmap DTOs
export interface CreateRoadmapDTO {
  name: string;
  description?: string;
  projectId: string;
  startDate: Date;
  endDate: Date;
  phases?: {
    name: string;
    startDate: Date;
    endDate: Date;
    description?: string;
  }[];
}

export interface RoadmapDTO {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  startDate: Date;
  endDate: Date;
  phases: {
    name: string;
    startDate: Date;
    endDate: Date;
    description?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// Member DTOs
export interface ProjectMemberDTO {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: 'lead' | 'manager' | 'contributor' | 'member' | 'viewer';
  joinedAt: Date;
}

export interface InviteMemberDTO {
  email: string;
  role: 'lead' | 'manager' | 'contributor' | 'member' | 'viewer';
}

export interface UpdateMemberRoleDTO {
  role: 'lead' | 'manager' | 'contributor' | 'member' | 'viewer';
}
