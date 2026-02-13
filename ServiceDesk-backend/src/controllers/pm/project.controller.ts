import { Response } from 'express';
import { FilterQuery } from 'mongoose';
import logger from '../../utils/logger';
import { validationResult } from 'express-validator';
import Project from '../../models/pm/Project';
import type { IProject } from '../../models/pm/Project';
import PMTeam from '../../models/pm/Team';
import Organization from '../../models/pm/Organization';
import User from '../../models/User';
import Task from '../../models/pm/Task';
import { PMAuthRequest as Request, ApiResponse, ProjectRole, MethodologyCode } from '../../types/pm';
import * as permissions from '../../utils/pm/permissions';

export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array().map((e) => ({ field: e.type, message: e.msg })),
      } as ApiResponse);
      return;
    }

    const userId = req.user?.id;
    let organizationId = req.user?.organizationId;

    const { key, name, description, methodology, startDate, targetEndDate } = req.body;

    // If no organization, create or get default one for this user
    if (!organizationId) {
      let defaultOrg = await Organization.findOne({ createdBy: userId });
      if (!defaultOrg) {
        defaultOrg = new Organization({
          name: 'Default Organization',
          slug: `org-${userId}`,
          createdBy: userId,
        });
        await defaultOrg.save();
      }
      organizationId = defaultOrg._id.toString();
    }

    const existingProject = await Project.findOne({ organizationId, key: key.toUpperCase() });
    if (existingProject) {
      res.status(400).json({
        success: false,
        error: 'Project key already exists in this organization',
      } as ApiResponse);
      return;
    }

    const project = new Project({
      organizationId,
      key: key.toUpperCase(),
      name,
      description,
      methodology: {
        code: methodology || MethodologyCode.SCRUM,
      },
      members: [
        {
          userId,
          role: ProjectRole.LEAD,
          permissions: ['*'],
          addedAt: new Date(),
        },
      ],
      startDate,
      targetEndDate,
      createdBy: userId,
    });

    await project.save();

    res.status(201).json({
      success: true,
      data: { project },
      message: 'Project created successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Create project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create project',
    } as ApiResponse);
  }
};

export const getProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    const { status, methodology, page = 1, limit = 20 } = req.query;

    // Build query - if no organizationId, show projects where user is a member
    const query: FilterQuery<IProject> = organizationId 
      ? {
          organizationId,
          $or: [
            { 'members.userId': userId },
            { 'settings.visibility': 'public' },
          ],
        }
      : {
          $or: [
            { 'members.userId': userId },
            { createdBy: userId },
            { 'settings.visibility': 'public' },
          ],
        };

    if (status) query.status = status as any;
    if (methodology) query['methodology.code'] = methodology;

    const skip = (Number(page) - 1) * Number(limit);

    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate('members.userId', 'name profile.firstName profile.lastName profile.avatar email')
        .populate('createdBy', 'name profile.firstName profile.lastName email')
        .populate('teams.teamId', 'name')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Project.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        projects,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
          hasNext: skip + projects.length < total,
          hasPrev: Number(page) > 1,
        },
      },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projects',
    } as ApiResponse);
  }
};

export const getProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;

    const project = await Project.findById(projectId)
      .populate('members.userId', 'profile.firstName profile.lastName profile.avatar email')
      .populate('teams.teamId', 'name members')
      .populate('createdBy', 'profile.firstName profile.lastName');

    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
      return;
    }

    const isMember = project.members.some((m) => {
      const memberUserId = m.userId as any;
      const memberId = memberUserId?._id?.toString() || memberUserId?.toString();
      return memberId === userId;
    });
    const isPublic = project.settings.visibility === 'public';

    if (!isMember && !isPublic) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: { project },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project',
    } as ApiResponse);
  }
};

export const updateProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array().map((e) => ({ field: e.type, message: e.msg })),
      } as ApiResponse);
      return;
    }

    const { projectId } = req.params;
    const userId = req.user?.id;

    const project = await Project.findById(projectId);

    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
      return;
    }

    const member = project.members.find((m) => m.userId?.toString() === userId);
    if (!member || ![ProjectRole.LEAD, ProjectRole.MANAGER].includes(member.role as ProjectRole)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      } as ApiResponse);
      return;
    }

    const { name, description, methodology, startDate, targetEndDate, settings } = req.body;

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (methodology) project.methodology.code = methodology;
    if (startDate) project.startDate = startDate;
    if (targetEndDate) project.targetEndDate = targetEndDate;
    if (settings) project.settings = { ...project.settings, ...settings };

    await project.save();

    res.status(200).json({
      success: true,
      data: { project },
      message: 'Project updated successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Update project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update project',
    } as ApiResponse);
  }
};

export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;

    const project = await Project.findById(projectId);

    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
      return;
    }

    const member = project.members.find((m) => m.userId?.toString() === userId);
    if (!member || member.role !== ProjectRole.LEAD) {
      res.status(403).json({
        success: false,
        error: 'Only project lead can delete the project',
      } as ApiResponse);
      return;
    }

    project.status = 'deleted' as any;
    await project.save();

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete project',
    } as ApiResponse);
  }
};

export const addProjectMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { userId: newUserId, role } = req.body;
    const currentUserId = req.user?.id;

    const project = await Project.findById(projectId);

    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
      return;
    }

    const currentMember = project.members.find((m) => m.userId?.toString() === currentUserId);
    if (!currentMember || ![ProjectRole.LEAD, ProjectRole.MANAGER].includes(currentMember.role as ProjectRole)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      } as ApiResponse);
      return;
    }

    const existingMember = project.members.find((m) => m.userId?.toString() === newUserId);
    if (existingMember) {
      res.status(400).json({
        success: false,
        error: 'User is already a member',
      } as ApiResponse);
      return;
    }

    project.members.push({
      userId: newUserId,
      role: role || ProjectRole.MEMBER,
      permissions: [],
      addedAt: new Date(),
    });

    await project.save();

    res.status(200).json({
      success: true,
      data: { project },
      message: 'Member added successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Add member error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add member',
    } as ApiResponse);
  }
};

export const removeProjectMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, memberId } = req.params;
    const currentUserId = req.user?.id;

    const project = await Project.findById(projectId);

    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
      return;
    }

    const currentMember = project.members.find((m) => m.userId?.toString() === currentUserId);
    if (!currentMember || ![ProjectRole.LEAD, ProjectRole.MANAGER].includes(currentMember.role as ProjectRole)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      } as ApiResponse);
      return;
    }

    const memberIndex = project.members.findIndex((m) => m.userId?.toString() === memberId);
    if (memberIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Member not found',
      } as ApiResponse);
      return;
    }

    if (project.members[memberIndex].role === ProjectRole.LEAD) {
      res.status(400).json({
        success: false,
        error: 'Cannot remove project lead',
      } as ApiResponse);
      return;
    }

    project.members.splice(memberIndex, 1);
    await project.save();

    res.status(200).json({
      success: true,
      message: 'Member removed successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove member',
    } as ApiResponse);
  }
};

// Add member by email or username
export const addMemberByEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array().map((e) => ({ field: e.type, message: e.msg })),
      } as ApiResponse);
      return;
    }

    const { projectId } = req.params;
    const { email, userId, role } = req.body;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      } as ApiResponse);
      return;
    }

    if (!email && !userId) {
      res.status(400).json({
        success: false,
        error: 'Either email or userId is required',
      } as ApiResponse);
      return;
    }

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
      return;
    }

    // Check if current user can add members
    if (!permissions.canManageMembers(project.members as any, currentUserId)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions to add members',
      } as ApiResponse);
      return;
    }

    // Find user by email or userId
    const userToAdd = userId
      ? await User.findById(userId)
      : await User.findOne({ email: email.toLowerCase() });
    if (!userToAdd) {
      res.status(404).json({
        success: false,
        error: userId ? 'User not found' : 'User not found with this email',
      } as ApiResponse);
      return;
    }

    // Check if already a member
    const existingMember = project.members.find((m) => m.userId?.toString() === userToAdd._id.toString());
    if (existingMember) {
      res.status(400).json({
        success: false,
        error: 'User is already a member of this project',
      } as ApiResponse);
      return;
    }

    // Validate role assignment
    const currentMemberRole = permissions.getMemberRole(project.members as any, currentUserId);
    const assignableRoles = permissions.getAvailableRolesForAssignment(currentMemberRole || '');
    const targetRole = role || ProjectRole.CONTRIBUTOR;
    
    if (!assignableRoles.includes(targetRole) && targetRole !== ProjectRole.CONTRIBUTOR) {
      res.status(403).json({
        success: false,
        error: `Cannot assign role '${targetRole}'. Available roles: ${assignableRoles.join(', ')}`,
      } as ApiResponse);
      return;
    }

    project.members.push({
      userId: userToAdd._id,
      role: targetRole,
      permissions: [],
      addedAt: new Date(),
    });

    await project.save();

    // Populate the updated project
    const updatedProject = await Project.findById(projectId)
      .populate('members.userId', 'profile.firstName profile.lastName profile.avatar email');

    // TODO: Send notification to the added user

    res.status(200).json({
      success: true,
      data: { project: updatedProject },
      message: `${userToAdd.email} added to project successfully`,
    } as ApiResponse);
  } catch (error) {
    logger.error('Add member by email error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add member',
    } as ApiResponse);
  }
};

// Update member role
export const updateMemberRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array().map((e) => ({ field: e.type, message: e.msg })),
      } as ApiResponse);
      return;
    }

    const { projectId, memberId } = req.params;
    const { role } = req.body;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      } as ApiResponse);
      return;
    }

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
      return;
    }

    // Check if current user can manage members
    if (!permissions.canManageMembers(project.members as any, currentUserId)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions to update member roles',
      } as ApiResponse);
      return;
    }

    // Find the member to update
    const memberIndex = project.members.findIndex((m) => m.userId?.toString() === memberId);
    if (memberIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Member not found',
      } as ApiResponse);
      return;
    }

    const targetMember = project.members[memberIndex];

    // Cannot change lead's role
    if (targetMember.role === ProjectRole.LEAD) {
      res.status(400).json({
        success: false,
        error: 'Cannot change the role of project lead',
      } as ApiResponse);
      return;
    }

    // Validate role assignment
    const currentMemberRole = permissions.getMemberRole(project.members as any, currentUserId);
    if (!permissions.canChangeRoleTo(currentMemberRole || '', role)) {
      res.status(403).json({
        success: false,
        error: `Cannot assign role '${role}'. You can only assign roles lower than your own.`,
      } as ApiResponse);
      return;
    }

    // Update the role
    project.members[memberIndex].role = role;
    await project.save();

    const updatedProject = await Project.findById(projectId)
      .populate('members.userId', 'profile.firstName profile.lastName profile.avatar email');

    res.status(200).json({
      success: true,
      data: { project: updatedProject },
      message: 'Member role updated successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Update member role error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update member role',
    } as ApiResponse);
  }
};

// Get project members with their roles
export const getProjectMembers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;

    const project = await Project.findById(projectId)
      .populate('members.userId', 'name profile.firstName profile.lastName profile.avatar email');

    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
      return;
    }

    // Check if user has access to view project
    const isMember = project.members.some((m) => {
      const memberUserId = m.userId as any;
      const memberId = memberUserId?._id?.toString() || memberUserId?.toString();
      return memberId === userId;
    });
    const isPublic = project.settings.visibility === 'public';

    if (!isMember && !isPublic) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      } as ApiResponse);
      return;
    }

    // Get current user's role for permission context
    const currentUserRole = userId ? (permissions.getMemberRole(project.members, userId) ?? '') : '';
    const canManage = userId ? permissions.canManageMembers(project.members, userId) : false;
    const assignableRoles = canManage ? permissions.getAvailableRolesForAssignment(currentUserRole) : [];

    res.status(200).json({
      success: true,
      data: {
        members: project.members,
        permissions: {
          canManageMembers: canManage,
          assignableRoles,
          currentUserRole,
        },
      },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get project members error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project members',
    } as ApiResponse);
  }
};

// Get project labels (distinct labels from all tasks in the project)
export const getProjectLabels = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
      return;
    }

    // Check if user has access to view project
    const isMember = project.members.some((m) => m.userId?.toString() === userId);
    const isPublic = project.settings.visibility === 'public';

    if (!isMember && !isPublic) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      } as ApiResponse);
      return;
    }

    // Get distinct labels from all tasks in this project
    const labels = await Task.distinct('labels', { projectId });

    res.status(200).json({
      success: true,
      data: { labels: labels.filter((l: string) => l) }, // Filter out empty strings
    } as ApiResponse);
  } catch (error) {
    logger.error('Get project labels error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project labels',
    } as ApiResponse);
  }
};

// Archive project
export const archiveProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
      return;
    }

    // Only lead can archive
    const member = project.members.find((m) => m.userId?.toString() === userId);
    if (!member || member.role !== ProjectRole.LEAD) {
      res.status(403).json({
        success: false,
        error: 'Only project lead can archive the project',
      } as ApiResponse);
      return;
    }

    project.status = 'archived' as any;
    await project.save();

    res.status(200).json({
      success: true,
      data: { project },
      message: 'Project archived successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Archive project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to archive project',
    } as ApiResponse);
  }
};

// Get teams associated with a project
export const getProjectTeams = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;

    const project = await Project.findById(projectId)
      .populate({
        path: 'teams.teamId',
        select: 'name description avatar lead members settings',
        populate: {
          path: 'members.userId',
          select: 'email profile.firstName profile.lastName profile.avatar'
        }
      });

    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
      return;
    }

    // Check if user has access to view project
    const isMember = project.members.some((m) => m.userId?.toString() === userId);
    const isPublic = project.settings.visibility === 'public';

    if (!isMember && !isPublic) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      } as ApiResponse);
      return;
    }

    // Map teams with their roles
    const teams = project.teams.map((t) => ({
      team: t.teamId,
      role: t.role,
    }));

    res.status(200).json({
      success: true,
      data: { teams },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get project teams error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project teams',
    } as ApiResponse);
  }
};

// Get all available teams in the organization (for adding to project)
export const getAvailableTeams = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
      return;
    }

    // Check if user has access to view project
    const isMember = project.members.some((m) => m.userId?.toString() === userId);
    const isPublic = project.settings.visibility === 'public';

    if (!isMember && !isPublic) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      } as ApiResponse);
      return;
    }

    // Get all teams in the organization
    const allTeams = await PMTeam.find({ organizationId: project.organizationId })
      .select('name description avatar members')
      .populate('members.userId', 'email profile.firstName profile.lastName profile.avatar');

    // Get IDs of teams already in the project
    const projectTeamIds = project.teams.map((t) => t.teamId?.toString());

    // Mark which teams are already added
    const teams = allTeams.map((team) => ({
      _id: team._id,
      name: team.name,
      description: team.description,
      avatar: team.avatar,
      memberCount: team.members?.length || 0,
      isAdded: projectTeamIds.includes(team._id.toString()),
    }));

    res.status(200).json({
      success: true,
      data: { teams },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get available teams error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available teams',
    } as ApiResponse);
  }
};

// Add a team to a project (either existing teamId or create new with name/description)
export const addProjectTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { teamId, name, description, role } = req.body;
    const userId = req.user?.id;

    // Validate: must have either teamId or name
    if (!teamId && !name) {
      res.status(400).json({
        success: false,
        error: 'Either teamId (to add existing team) or name (to create new team) is required',
      } as ApiResponse);
      return;
    }

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
      return;
    }

    // Check if user has permission to manage project
    const member = project.members.find((m) => m.userId?.toString() === userId);
    if (!member || ![ProjectRole.LEAD, ProjectRole.MANAGER].includes(member.role as ProjectRole)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      } as ApiResponse);
      return;
    }

    let targetTeamId = teamId;

    // If no teamId provided, create a new team or find existing by name
    if (!teamId && name) {
      // Check if team with this name already exists in the organization
      const existingTeamByName = await PMTeam.findOne({ 
        organizationId: project.organizationId, 
        name 
      });
      
      if (existingTeamByName) {
        // Use existing team
        targetTeamId = existingTeamByName._id;
      } else {
        // Create new team
        const newTeam = new PMTeam({
          organizationId: project.organizationId,
          name,
          description,
          members: [{
            userId,
            role: 'lead',
            joinedAt: new Date(),
          }],
        });
        await newTeam.save();
        targetTeamId = newTeam._id;
      }
    }

    // Check if team is already added
    const existingTeam = project.teams.find((t) => t.teamId?.toString() === targetTeamId?.toString());
    if (existingTeam) {
      res.status(400).json({
        success: false,
        error: 'Team is already added to this project',
      } as ApiResponse);
      return;
    }

    project.teams.push({
      teamId: targetTeamId,
      role: role || 'primary',
    });

    await project.save();

    const updatedProject = await Project.findById(projectId)
      .populate('teams.teamId', 'name description avatar lead members');

    res.status(201).json({
      success: true,
      data: { teams: updatedProject?.teams },
      message: teamId ? 'Team added to project successfully' : 'Team created and added to project successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Add project team error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add team to project',
    } as ApiResponse);
  }
};

// Remove a team from a project
export const removeProjectTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, teamId } = req.params;
    const userId = req.user?.id;

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
      return;
    }

    // Check if user has permission to manage project
    const member = project.members.find((m) => m.userId?.toString() === userId);
    if (!member || ![ProjectRole.LEAD, ProjectRole.MANAGER].includes(member.role as ProjectRole)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      } as ApiResponse);
      return;
    }

    const teamIndex = project.teams.findIndex((t) => t.teamId?.toString() === teamId);
    if (teamIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Team not found in project',
      } as ApiResponse);
      return;
    }

    project.teams.splice(teamIndex, 1);
    await project.save();

    res.status(200).json({
      success: true,
      message: 'Team removed from project successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Remove project team error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove team from project',
    } as ApiResponse);
  }
};

// Helper to verify team belongs to project
const verifyTeamInProject = async (projectId: string, teamId: string, userId: string, res: Response): Promise<{ project: any; team: any } | null> => {
  const project = await Project.findById(projectId);
  if (!project) {
    res.status(404).json({ success: false, error: 'Project not found' } as ApiResponse);
    return null;
  }

  // Check user has access to project
  const member = project.members.find((m) => m.userId?.toString() === userId);
  const isPublic = project.settings.visibility === 'public';
  if (!member && !isPublic) {
    res.status(403).json({ success: false, error: 'Access denied' } as ApiResponse);
    return null;
  }

  // Check team is in project
  const projectTeam = project.teams.find((t) => t.teamId?.toString() === teamId);
  if (!projectTeam) {
    res.status(404).json({ success: false, error: 'Team not found in project' } as ApiResponse);
    return null;
  }

  const team = await PMTeam.findById(teamId);
  if (!team) {
    res.status(404).json({ success: false, error: 'Team not found' } as ApiResponse);
    return null;
  }

  return { project, team };
};

// Get members of a team within a project context
export const getProjectTeamMembers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, teamId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
      return;
    }

    const result = await verifyTeamInProject(projectId, teamId, userId, res);
    if (!result) return;

    const team = await PMTeam.findById(teamId)
      .populate('members.userId', 'email profile.firstName profile.lastName profile.avatar');

    res.status(200).json({
      success: true,
      data: { members: team?.members || [] },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get project team members error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch team members',
    } as ApiResponse);
  }
};

// Add member to a team within a project context
export const addProjectTeamMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, teamId } = req.params;
    const { userId: newUserId, email, role } = req.body;
    const currentUserId = req.user?.id as string | undefined;

    if (!currentUserId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      } as ApiResponse);
      return;
    }

    const result = await verifyTeamInProject(projectId, teamId, currentUserId as string, res);
    if (!result) return;

    const { project, team } = result;

    // Check if current user can manage project (lead or manager)
    const member = project.members.find((m: any) => m.userId?.toString() === currentUserId);
    if (!member || ![ProjectRole.LEAD, ProjectRole.MANAGER].includes(member.role as ProjectRole)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions to manage team members',
      } as ApiResponse);
      return;
    }

    // Find user to add - by userId or email
    let userToAdd;
    if (newUserId) {
      userToAdd = await User.findById(newUserId);
    } else if (email) {
      userToAdd = await User.findOne({ email: email.toLowerCase() });
    }

    if (!userToAdd) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      } as ApiResponse);
      return;
    }

    // Check if already a member
    const existingMember = team.members.find((m: any) => m.userId?.toString() === userToAdd._id.toString());
    if (existingMember) {
      res.status(400).json({
        success: false,
        error: 'User is already a team member',
      } as ApiResponse);
      return;
    }

    team.members.push({
      userId: userToAdd._id,
      role: role || 'member',
      joinedAt: new Date(),
    });

    await team.save();

    const updatedTeam = await PMTeam.findById(teamId)
      .populate('members.userId', 'email profile.firstName profile.lastName profile.avatar');

    res.status(200).json({
      success: true,
      data: { members: updatedTeam?.members },
      message: 'Member added to team successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Add project team member error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add team member',
    } as ApiResponse);
  }
};

// Remove member from a team within a project context
export const removeProjectTeamMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, teamId, memberId } = req.params;
    const currentUserId = req.user?.id as string | undefined;

    if (!currentUserId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      } as ApiResponse);
      return;
    }

    const result = await verifyTeamInProject(projectId, teamId, currentUserId as string, res);
    if (!result) return;

    const { project, team } = result;

    // Check if current user can manage project
    const member = project.members.find((m: any) => m.userId?.toString() === currentUserId);
    if (!member || ![ProjectRole.LEAD, ProjectRole.MANAGER].includes(member.role as ProjectRole)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions to manage team members',
      } as ApiResponse);
      return;
    }

    const memberIndex = team.members.findIndex((m: any) => 
      m._id?.toString() === memberId || m.userId?.toString() === memberId
    );
    if (memberIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Member not found in team',
      } as ApiResponse);
      return;
    }

    team.members.splice(memberIndex, 1);
    await team.save();

    res.status(200).json({
      success: true,
      message: 'Member removed from team successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Remove project team member error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove team member',
    } as ApiResponse);
  }
};
