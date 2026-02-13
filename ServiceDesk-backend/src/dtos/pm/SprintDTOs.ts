/**
 * Project Management - Sprint DTOs
 * Defines request/response contracts for sprint endpoints
 */

// ============================================
// REQUEST DTOs
// ============================================

export interface CreateSprintRequestDTO {
  project_id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  goal?: string;
  capacity?: number;
}

export interface UpdateSprintRequestDTO {
  name?: string;
  description?: string;
  goal?: string;
  capacity?: number;
  end_date?: string;
}

export interface StartSprintRequestDTO {
  skip_validation?: boolean;
  participants?: string[];
}

export interface EndSprintRequestDTO {
  move_incomplete_to_backlog?: boolean;
  notes?: string;
}

export interface AddTaskToSprintRequestDTO {
  task_id: string;
  position?: number;
}

export interface RemoveTaskFromSprintRequestDTO {
  task_id: string;
}

export interface ReorderSprintTasksRequestDTO {
  task_orders: string[];
}

export interface ListSprintsQueryDTO {
  page?: number;
  limit?: number;
  project_id?: string;
  status?: 'planning' | 'active' | 'completed' | 'cancelled';
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// ============================================
// RESPONSE DTOs
// ============================================

export interface SprintResponseDTO {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  goal?: string;
  start_date: string;
  end_date: string;
  capacity?: number;
  used_capacity?: number;
  task_count: number;
  completed_task_count: number;
  velocity?: number;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface SprintListResponseDTO {
  sprints: SprintResponseDTO[];
  pagination: PaginationDTO;
  total: number;
}

export interface SprintDetailResponseDTO extends SprintResponseDTO {
  tasks: SprintTaskDTO[];
  backlog_items: BacklogItemDTO[];
  statistics: SprintStatisticsDTO;
  burndown_chart?: BurndownDataDTO[];
}

export interface SprintTaskDTO {
  id: string;
  key: string;
  title: string;
  status: string;
  assignee?: UserRefDTO;
  story_points?: number;
  priority: string;
  position: number;
}

export interface BacklogItemDTO {
  id: string;
  key: string;
  title: string;
  priority: string;
  story_points?: number;
}

export interface SprintStatisticsDTO {
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  pending_tasks: number;
  total_story_points: number;
  completed_story_points: number;
  completion_percentage: number;
  velocity: number;
  team_members: number;
}

export interface BurndownDataDTO {
  date: string;
  remaining_points: number;
  ideal_remaining: number;
}

export interface UserRefDTO {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

export interface PaginationDTO {
  page: number;
  limit: number;
  total_pages: number;
}

// ============================================
// ACTION RESPONSE DTOs
// ============================================

export interface CreateSprintResponseDTO {
  success: boolean;
  sprint: SprintResponseDTO;
  message: string;
}

export interface UpdateSprintResponseDTO {
  success: boolean;
  sprint: SprintResponseDTO;
  message: string;
}

export interface StartSprintResponseDTO {
  success: boolean;
  sprint: SprintResponseDTO;
  message: string;
}

export interface EndSprintResponseDTO {
  success: boolean;
  sprint: SprintResponseDTO;
  statistics: SprintStatisticsDTO;
  message: string;
}

export interface AddTaskToSprintResponseDTO {
  success: boolean;
  sprint: SprintResponseDTO;
  message: string;
}

export interface RemoveTaskFromSprintResponseDTO {
  success: boolean;
  sprint: SprintResponseDTO;
  message: string;
}

export interface ReorderTasksResponseDTO {
  success: boolean;
  sprint: SprintResponseDTO;
  message: string;
}
