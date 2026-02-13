/**
 * Project Management - Project DTOs
 * Defines request/response contracts for project endpoints
 */

// ============================================
// REQUEST DTOs
// ============================================

export interface CreateProjectRequestDTO {
  key: string;
  name: string;
  description?: string;
  methodology: 'scrum' | 'kanban' | 'waterfall' | 'itil' | 'lean' | 'okr';
  start_date?: string;
  target_end_date?: string;
  organization_id: string;
}

export interface UpdateProjectRequestDTO {
  name?: string;
  description?: string;
  methodology?: 'scrum' | 'kanban' | 'waterfall' | 'itil' | 'lean' | 'okr';
  start_date?: string;
  target_end_date?: string;
}

export interface AddProjectMemberRequestDTO {
  user_id: string;
  role: 'lead' | 'manager' | 'contributor' | 'member' | 'viewer';
}

export interface InviteProjectMemberRequestDTO {
  email: string;
  role: 'manager' | 'contributor' | 'viewer';
}

export interface UpdateProjectMemberRoleRequestDTO {
  role: 'lead' | 'manager' | 'contributor' | 'member' | 'viewer';
}

export interface ArchiveProjectRequestDTO {
  reason?: string;
}

export interface ListProjectsQueryDTO {
  page?: number;
  limit?: number;
  status?: 'active' | 'archived' | 'completed';
  methodology?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// ============================================
// RESPONSE DTOs
// ============================================

export interface ProjectResponseDTO {
  id: string;
  key: string;
  name: string;
  description?: string;
  methodology: string;
  organization_id: string;
  status: 'active' | 'archived' | 'completed';
  start_date?: string;
  target_end_date?: string;
  actual_end_date?: string;
  lead_id: string;
  lead_name: string;
  member_count: number;
  task_count: number;
  sprint_count: number;
  created_at: string;
  updated_at: string;
  archived_at?: string;
}

export interface ProjectListResponseDTO {
  projects: ProjectResponseDTO[];
  pagination: PaginationDTO;
  total: number;
}

export interface ProjectMemberResponseDTO {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  role: string;
  permissions: PermissionDTO[];
  joined_at: string;
}

export interface ProjectMembersListResponseDTO {
  members: ProjectMemberResponseDTO[];
  total: number;
}

export interface PermissionDTO {
  action: string;
  resource: string;
  allowed: boolean;
}

export interface ProjectStatisticsResponseDTO {
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  pending_tasks: number;
  total_sprints: number;
  active_sprints: number;
  completed_sprints: number;
  team_members: number;
  completion_percentage: number;
}

export interface PaginationDTO {
  page: number;
  limit: number;
  total_pages: number;
}

// ============================================
// ACTION RESPONSE DTOs
// ============================================

export interface CreateProjectResponseDTO {
  success: boolean;
  project: ProjectResponseDTO;
  message: string;
}

export interface UpdateProjectResponseDTO {
  success: boolean;
  project: ProjectResponseDTO;
  message: string;
}

export interface AddMemberResponseDTO {
  success: boolean;
  member: ProjectMemberResponseDTO;
  message: string;
}

export interface InviteMemberResponseDTO {
  success: boolean;
  invitation_sent: boolean;
  email: string;
  message: string;
}

export interface UpdateMemberRoleResponseDTO {
  success: boolean;
  member: ProjectMemberResponseDTO;
  message: string;
}

export interface ArchiveProjectResponseDTO {
  success: boolean;
  project: ProjectResponseDTO;
  message: string;
}
