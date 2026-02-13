/**
 * Project Service Interface (PM)
 */

import {
  CreateProjectDTO,
  UpdateProjectDTO,
  ProjectDTO,
  ProjectListDTO,
  ProjectMemberDTO,
  InviteMemberDTO,
  UpdateMemberRoleDTO,
} from '../../dtos/pm';

export interface IProjectService {
  createProject(dto: CreateProjectDTO): Promise<ProjectDTO>;
  getProject(id: string): Promise<ProjectDTO>;
  updateProject(id: string, dto: UpdateProjectDTO): Promise<ProjectDTO>;
  deleteProject(id: string): Promise<void>;
  archiveProject(id: string): Promise<ProjectDTO>;
  listProjects(filter: ProjectFilterDTO): Promise<ProjectListDTO>;
  getMembers(projectId: string): Promise<ProjectMemberDTO[]>;
  inviteMember(projectId: string, dto: InviteMemberDTO): Promise<ProjectMemberDTO>;
  updateMemberRole(projectId: string, memberId: string, dto: UpdateMemberRoleDTO): Promise<ProjectMemberDTO>;
  removeMember(projectId: string, memberId: string): Promise<void>;
}

export interface ProjectFilterDTO {
  organizationId?: string;
  status?: string;
  category?: string;
  lead?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
