import { ProjectRole } from '../../models/pm/Project';

export enum ProjectPermission {
  // Project management
  VIEW_PROJECT = 'view_project',
  UPDATE_PROJECT = 'update_project',
  DELETE_PROJECT = 'delete_project',
  ARCHIVE_PROJECT = 'archive_project',
  
  // Member management
  ADD_MEMBER = 'add_member',
  REMOVE_MEMBER = 'remove_member',
  UPDATE_MEMBER_ROLE = 'update_member_role',
  
  // Task operations
  VIEW_TASKS = 'view_tasks',
  CREATE_TASK = 'create_task',
  UPDATE_ANY_TASK = 'update_any_task',
  UPDATE_OWN_TASK = 'update_own_task',
  DELETE_ANY_TASK = 'delete_any_task',
  ASSIGN_TASK_TO_SELF = 'assign_task_to_self',
  ASSIGN_TASK_TO_OTHERS = 'assign_task_to_others',
  TRANSITION_TASK = 'transition_task',
  
  // Retrospective operations
  VIEW_RETROSPECTIVE = 'view_retrospective',
  CREATE_RETROSPECTIVE = 'create_retrospective',
  ADD_RETROSPECTIVE_NOTE = 'add_retrospective_note',
  VOTE_ON_RETROSPECTIVE = 'vote_on_retrospective',
  PUBLISH_RETROSPECTIVE = 'publish_retrospective',
  MANAGE_ACTION_ITEMS = 'manage_action_items',
  DELETE_RETROSPECTIVE = 'delete_retrospective',
}

// Role hierarchy: higher index = more permissions
const ROLE_HIERARCHY = [
  ProjectRole.VIEWER,
  ProjectRole.CONTRIBUTOR,
  ProjectRole.MEMBER, // Legacy, same as contributor
  ProjectRole.MANAGER,
  ProjectRole.LEAD,
];

// Permissions by role
const ROLE_PERMISSIONS: Record<string, ProjectPermission[]> = {
  [ProjectRole.VIEWER]: [
    ProjectPermission.VIEW_PROJECT,
    ProjectPermission.VIEW_TASKS,
    ProjectPermission.VIEW_RETROSPECTIVE,
  ],
  
  [ProjectRole.CONTRIBUTOR]: [
    ProjectPermission.VIEW_PROJECT,
    ProjectPermission.VIEW_TASKS,
    ProjectPermission.CREATE_TASK,
    ProjectPermission.UPDATE_OWN_TASK,
    ProjectPermission.ASSIGN_TASK_TO_SELF,
    ProjectPermission.TRANSITION_TASK,
    ProjectPermission.VIEW_RETROSPECTIVE,
    ProjectPermission.ADD_RETROSPECTIVE_NOTE,
    ProjectPermission.VOTE_ON_RETROSPECTIVE,
  ],
  
  [ProjectRole.MEMBER]: [
    // Same as contributor (legacy)
    ProjectPermission.VIEW_PROJECT,
    ProjectPermission.VIEW_TASKS,
    ProjectPermission.CREATE_TASK,
    ProjectPermission.UPDATE_OWN_TASK,
    ProjectPermission.ASSIGN_TASK_TO_SELF,
    ProjectPermission.TRANSITION_TASK,
    ProjectPermission.VIEW_RETROSPECTIVE,
    ProjectPermission.ADD_RETROSPECTIVE_NOTE,
    ProjectPermission.VOTE_ON_RETROSPECTIVE,
  ],
  
  [ProjectRole.MANAGER]: [
    ProjectPermission.VIEW_PROJECT,
    ProjectPermission.UPDATE_PROJECT,
    ProjectPermission.VIEW_TASKS,
    ProjectPermission.CREATE_TASK,
    ProjectPermission.UPDATE_ANY_TASK,
    ProjectPermission.UPDATE_OWN_TASK,
    ProjectPermission.DELETE_ANY_TASK,
    ProjectPermission.ASSIGN_TASK_TO_SELF,
    ProjectPermission.ASSIGN_TASK_TO_OTHERS,
    ProjectPermission.TRANSITION_TASK,
    ProjectPermission.ADD_MEMBER,
    ProjectPermission.REMOVE_MEMBER,
    ProjectPermission.UPDATE_MEMBER_ROLE,
    ProjectPermission.VIEW_RETROSPECTIVE,
    ProjectPermission.CREATE_RETROSPECTIVE,
    ProjectPermission.ADD_RETROSPECTIVE_NOTE,
    ProjectPermission.VOTE_ON_RETROSPECTIVE,
    ProjectPermission.PUBLISH_RETROSPECTIVE,
    ProjectPermission.MANAGE_ACTION_ITEMS,
    ProjectPermission.DELETE_RETROSPECTIVE,
  ],
  
  [ProjectRole.LEAD]: [
    // All permissions
    ...Object.values(ProjectPermission),
  ],
};

export interface ProjectMember {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userId: any; // Accepts ObjectId, string, or objects with toString()
  role: string;
  permissions?: string[];
}

export function getMemberRole(members: ProjectMember[], userId: string): string | null {
  const member = members.find((m) => {
    const memberUserId = m.userId as { _id?: string; toString(): string } | string;
    const memberId = typeof memberUserId === 'string' 
      ? memberUserId 
      : (memberUserId?._id?.toString() || memberUserId?.toString());
    return memberId === userId;
  });
  return member?.role || null;
}

export function hasPermission(
  members: ProjectMember[],
  userId: string,
  permission: ProjectPermission
): boolean {
  const role = getMemberRole(members, userId);
  if (!role) return false;
  
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  return rolePermissions.includes(permission);
}

export function hasAnyPermission(
  members: ProjectMember[],
  userId: string,
  permissions: ProjectPermission[]
): boolean {
  return permissions.some((p) => hasPermission(members, userId, p));
}

export function canManageMembers(members: ProjectMember[], userId: string): boolean {
  return hasPermission(members, userId, ProjectPermission.ADD_MEMBER);
}

export function canUpdateProject(members: ProjectMember[], userId: string): boolean {
  return hasPermission(members, userId, ProjectPermission.UPDATE_PROJECT);
}

export function canDeleteProject(members: ProjectMember[], userId: string): boolean {
  return hasPermission(members, userId, ProjectPermission.DELETE_PROJECT);
}

export function canCreateTask(members: ProjectMember[], userId: string): boolean {
  return hasPermission(members, userId, ProjectPermission.CREATE_TASK);
}

export function canUpdateTask(
  members: ProjectMember[],
  userId: string,
  taskAssigneeId?: string,
  taskReporterId?: string
): boolean {
  // Can update any task
  if (hasPermission(members, userId, ProjectPermission.UPDATE_ANY_TASK)) {
    return true;
  }
  
  // Can update own task (assigned to self or reported by self)
  if (hasPermission(members, userId, ProjectPermission.UPDATE_OWN_TASK)) {
    return taskAssigneeId === userId || taskReporterId === userId;
  }
  
  return false;
}

export function canDeleteTask(members: ProjectMember[], userId: string): boolean {
  return hasPermission(members, userId, ProjectPermission.DELETE_ANY_TASK);
}

export function canAssignTask(
  members: ProjectMember[],
  userId: string,
  targetUserId: string
): boolean {
  // Assigning to self
  if (targetUserId === userId) {
    return hasPermission(members, userId, ProjectPermission.ASSIGN_TASK_TO_SELF);
  }
  
  // Assigning to others
  return hasPermission(members, userId, ProjectPermission.ASSIGN_TASK_TO_OTHERS);
}

export function canTransitionTask(members: ProjectMember[], userId: string): boolean {
  return hasPermission(members, userId, ProjectPermission.TRANSITION_TASK);
}

export function getRoleHierarchyLevel(role: string): number {
  const index = ROLE_HIERARCHY.indexOf(role as ProjectRole);
  return index === -1 ? 0 : index;
}

export function canChangeRoleTo(
  currentUserRole: string,
  targetRole: string
): boolean {
  // Can only assign roles lower than your own
  const currentLevel = getRoleHierarchyLevel(currentUserRole);
  const targetLevel = getRoleHierarchyLevel(targetRole);
  
  // Lead can assign any role except lead
  if (currentUserRole === ProjectRole.LEAD) {
    return targetRole !== ProjectRole.LEAD;
  }
  
  // Manager can assign contributor/member/viewer
  if (currentUserRole === ProjectRole.MANAGER) {
    return targetLevel < currentLevel;
  }
  
  return false;
}

export function getAvailableRolesForAssignment(currentUserRole: string): string[] {
  if (currentUserRole === ProjectRole.LEAD) {
    return [ProjectRole.MANAGER, ProjectRole.CONTRIBUTOR, ProjectRole.VIEWER];
  }
  if (currentUserRole === ProjectRole.MANAGER) {
    return [ProjectRole.CONTRIBUTOR, ProjectRole.VIEWER];
  }
  return [];
}

export interface TaskPermissions {
  canUpdate: boolean;
  canDelete: boolean;
  canAssign: boolean;
  canTransition: boolean;
}

export function getTaskPermissions(
  members: ProjectMember[],
  userId: string,
  taskAssigneeId?: string | undefined,
  taskReporterId?: string | undefined
): TaskPermissions {
  return {
    canUpdate: canUpdateTask(members, userId, taskAssigneeId, taskReporterId),
    canDelete: canDeleteTask(members, userId),
    canAssign: hasPermission(members, userId, ProjectPermission.ASSIGN_TASK_TO_OTHERS),
    canTransition: canTransitionTask(members, userId),
  };
}

export function canViewRetrospective(members: ProjectMember[], userId: string): boolean {
  return hasPermission(members, userId, ProjectPermission.VIEW_RETROSPECTIVE);
}

export function canCreateRetrospective(members: ProjectMember[], userId: string): boolean {
  return hasPermission(members, userId, ProjectPermission.CREATE_RETROSPECTIVE);
}

export function canAddRetrospectiveNote(members: ProjectMember[], userId: string): boolean {
  return hasPermission(members, userId, ProjectPermission.ADD_RETROSPECTIVE_NOTE);
}

export function canVoteOnRetrospective(members: ProjectMember[], userId: string): boolean {
  return hasPermission(members, userId, ProjectPermission.VOTE_ON_RETROSPECTIVE);
}

export function canPublishRetrospective(members: ProjectMember[], userId: string): boolean {
  return hasPermission(members, userId, ProjectPermission.PUBLISH_RETROSPECTIVE);
}

export function canManageActionItems(members: ProjectMember[], userId: string): boolean {
  return hasPermission(members, userId, ProjectPermission.MANAGE_ACTION_ITEMS);
}

export function canDeleteRetrospective(members: ProjectMember[], userId: string): boolean {
  return hasPermission(members, userId, ProjectPermission.DELETE_RETROSPECTIVE);
}

export interface RetrospectivePermissions {
  canView: boolean;
  canCreate: boolean;
  canAddNote: boolean;
  canVote: boolean;
  canPublish: boolean;
  canManageActionItems: boolean;
  canDelete: boolean;
}

export function getRetrospectivePermissions(
  members: ProjectMember[],
  userId: string
): RetrospectivePermissions {
  return {
    canView: canViewRetrospective(members, userId),
    canCreate: canCreateRetrospective(members, userId),
    canAddNote: canAddRetrospectiveNote(members, userId),
    canVote: canVoteOnRetrospective(members, userId),
    canPublish: canPublishRetrospective(members, userId),
    canManageActionItems: canManageActionItems(members, userId),
    canDelete: canDeleteRetrospective(members, userId),
  };
}
