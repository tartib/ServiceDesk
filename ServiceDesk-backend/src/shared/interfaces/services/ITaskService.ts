/**
 * Task Service Interface (ITSM)
 */

import {
  CreateTaskDTO,
  UpdateTaskDTO,
  TaskDTO,
  TaskListDTO,
} from '../../dtos/itsm';

export interface ITaskService {
  createTask(dto: CreateTaskDTO): Promise<TaskDTO>;
  getTask(id: string): Promise<TaskDTO>;
  updateTask(id: string, dto: UpdateTaskDTO): Promise<TaskDTO>;
  deleteTask(id: string): Promise<void>;
  listTasks(filter: TaskFilterDTO): Promise<TaskListDTO>;
  assignTask(id: string, userId: string): Promise<TaskDTO>;
  changeStatus(id: string, status: string): Promise<TaskDTO>;
  addComment(taskId: string, comment: string): Promise<void>;
  addAttachment(taskId: string, fileUrl: string): Promise<void>;
}

export interface TaskFilterDTO {
  status?: string;
  priority?: string;
  assignee?: string;
  reporter?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
