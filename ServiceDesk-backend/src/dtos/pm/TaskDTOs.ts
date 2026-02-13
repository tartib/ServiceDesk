/**
 * Project Management - Task DTOs
 * Defines request/response contracts for task endpoints
 */

// ============================================
// REQUEST DTOs
// ============================================

export interface CreateTaskRequestDTO {
  project_id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status?: string;
  assignee?: string;
  reporter?: string;
  story_points?: number;
  due_date?: string;
  sprint_id?: string;
  epic_id?: string;
  labels?: string[];
  attachments?: string[];
}

export interface UpdateTaskRequestDTO {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: string;
  assignee?: string;
  story_points?: number;
  due_date?: string;
  sprint_id?: string;
  epic_id?: string;
  labels?: string[];
}

export interface TransitionTaskRequestDTO {
  new_status: string;
  comment?: string;
}

export interface AssignTaskRequestDTO {
  assignee_id: string;
}

export interface UnassignTaskRequestDTO {
  // No body required
}

export interface AddWatcherRequestDTO {
  watcher_id: string;
}

export interface RemoveWatcherRequestDTO {
  watcher_id: string;
}

export interface AddCommentRequestDTO {
  content: string;
  attachments?: string[];
}

export interface ListTasksQueryDTO {
  page?: number;
  limit?: number;
  project_id?: string;
  sprint_id?: string;
  status?: string;
  assignee?: string;
  priority?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface MoveTaskRequestDTO {
  target_sprint_id?: string;
  target_position?: number;
}

// ============================================
// RESPONSE DTOs
// ============================================

export interface TaskResponseDTO {
  id: string;
  key: string;
  project_id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  assignee?: UserRefDTO;
  reporter?: UserRefDTO;
  story_points?: number;
  due_date?: string;
  sprint_id?: string;
  epic_id?: string;
  labels: string[];
  watchers: UserRefDTO[];
  comments_count: number;
  attachments: AttachmentRefDTO[];
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface TaskListResponseDTO {
  tasks: TaskResponseDTO[];
  pagination: PaginationDTO;
  total: number;
}

export interface TaskDetailResponseDTO extends TaskResponseDTO {
  comments: CommentDTO[];
  activity_timeline: ActivityEventDTO[];
  related_tasks: TaskRefDTO[];
}

export interface UserRefDTO {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

export interface AttachmentRefDTO {
  id: string;
  file_name: string;
  file_url: string;
  uploaded_at: string;
}

export interface CommentDTO {
  id: string;
  author: UserRefDTO;
  content: string;
  attachments: AttachmentRefDTO[];
  created_at: string;
  updated_at: string;
}

export interface ActivityEventDTO {
  id: string;
  event_type: string;
  actor: UserRefDTO;
  changes: ChangeDTO[];
  created_at: string;
}

export interface ChangeDTO {
  field: string;
  old_value?: unknown;
  new_value?: unknown;
}

export interface TaskRefDTO {
  id: string;
  key: string;
  title: string;
  status: string;
}

export interface PaginationDTO {
  page: number;
  limit: number;
  total_pages: number;
}

// ============================================
// ACTION RESPONSE DTOs
// ============================================

export interface CreateTaskResponseDTO {
  success: boolean;
  task: TaskResponseDTO;
  message: string;
}

export interface UpdateTaskResponseDTO {
  success: boolean;
  task: TaskResponseDTO;
  message: string;
}

export interface TransitionTaskResponseDTO {
  success: boolean;
  task: TaskResponseDTO;
  message: string;
}

export interface AssignTaskResponseDTO {
  success: boolean;
  task: TaskResponseDTO;
  message: string;
}

export interface AddCommentResponseDTO {
  success: boolean;
  comment: CommentDTO;
  message: string;
}

export interface MoveTaskResponseDTO {
  success: boolean;
  task: TaskResponseDTO;
  message: string;
}
