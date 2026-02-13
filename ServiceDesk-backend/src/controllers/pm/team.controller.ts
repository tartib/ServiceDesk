import { Response } from 'express';
import logger from '../../utils/logger';
import { validationResult } from 'express-validator';
import Team from '../../models/pm/Team';
import User from '../../models/User';
import { PMAuthRequest as Request, ApiResponse, OrganizationRole } from '../../types/pm';

export const createTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array().map((e: any) => ({ field: e.type, message: e.msg })),
      } as ApiResponse);
      return;
    }

    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      res.status(400).json({
        success: false,
        error: 'Organization context required',
      } as ApiResponse);
      return;
    }

    const { name, description, settings } = req.body;

    const existingTeam = await Team.findOne({ organizationId, name });
    if (existingTeam) {
      res.status(400).json({
        success: false,
        error: 'Team with this name already exists',
      } as ApiResponse);
      return;
    }

    const team = new Team({
      organizationId,
      name,
      description,
      lead: userId,
      members: [
        {
          userId,
          role: 'lead',
          joinedAt: new Date(),
        },
      ],
      settings,
    });

    await team.save();

    res.status(201).json({
      success: true,
      data: { team },
      message: 'Team created successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Create team error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create team',
    } as ApiResponse);
  }
};

export const getTeams = async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      res.status(400).json({
        success: false,
        error: 'Organization context required',
      } as ApiResponse);
      return;
    }

    const teams = await Team.find({ organizationId })
      .populate('lead', 'profile.firstName profile.lastName profile.avatar email')
      .populate('members.userId', 'profile.firstName profile.lastName profile.avatar email');

    res.status(200).json({
      success: true,
      data: { teams },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get teams error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch teams',
    } as ApiResponse);
  }
};

export const getTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teamId } = req.params;

    const team = await Team.findById(teamId)
      .populate('lead', 'profile.firstName profile.lastName profile.avatar email')
      .populate('members.userId', 'profile.firstName profile.lastName profile.avatar email');

    if (!team) {
      res.status(404).json({
        success: false,
        error: 'Team not found',
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: { team },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get team error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch team',
    } as ApiResponse);
  }
};

export const updateTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array().map((e: any) => ({ field: e.type, message: e.msg })),
      } as ApiResponse);
      return;
    }

    const { teamId } = req.params;
    const userId = req.user?.id;

    const team = await Team.findById(teamId);

    if (!team) {
      res.status(404).json({
        success: false,
        error: 'Team not found',
      } as ApiResponse);
      return;
    }

    const isLead = team.lead?.toString() === userId;
    const isMemberLead = team.members.some(
      (m) => m.userId?.toString() === userId && m.role === 'lead'
    );

    if (!isLead && !isMemberLead) {
      res.status(403).json({
        success: false,
        error: 'Only team lead can update the team',
      } as ApiResponse);
      return;
    }

    const { name, description, settings } = req.body;

    if (name) team.name = name;
    if (description !== undefined) team.description = description;
    if (settings) team.settings = { ...team.settings, ...settings };

    await team.save();

    res.status(200).json({
      success: true,
      data: { team },
      message: 'Team updated successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Update team error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update team',
    } as ApiResponse);
  }
};

export const deleteTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teamId } = req.params;
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    const team = await Team.findById(teamId);

    if (!team) {
      res.status(404).json({
        success: false,
        error: 'Team not found',
      } as ApiResponse);
      return;
    }

    const user = await User.findById(userId);
    const userOrg = user?.organizations.find(
      (o) => o.organizationId.toString() === organizationId
    );

    const isOrgAdmin = userOrg && [OrganizationRole.OWNER, OrganizationRole.ADMIN].includes(userOrg.role as OrganizationRole);
    const isTeamLead = team.lead?.toString() === userId;

    if (!isOrgAdmin && !isTeamLead) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      } as ApiResponse);
      return;
    }

    await Team.findByIdAndDelete(teamId);

    res.status(200).json({
      success: true,
      message: 'Team deleted successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Delete team error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete team',
    } as ApiResponse);
  }
};

export const addTeamMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teamId } = req.params;
    const { userId: newUserId, role } = req.body;
    const currentUserId = req.user?.id;

    const team = await Team.findById(teamId);

    if (!team) {
      res.status(404).json({
        success: false,
        error: 'Team not found',
      } as ApiResponse);
      return;
    }

    const isLead = team.lead?.toString() === currentUserId;
    if (!isLead) {
      res.status(403).json({
        success: false,
        error: 'Only team lead can add members',
      } as ApiResponse);
      return;
    }

    const existingMember = team.members.find((m) => m.userId?.toString() === newUserId);
    if (existingMember) {
      res.status(400).json({
        success: false,
        error: 'User is already a team member',
      } as ApiResponse);
      return;
    }

    team.members.push({
      userId: newUserId,
      role: role || 'member',
      joinedAt: new Date(),
    });

    await team.save();

    const updatedTeam = await Team.findById(teamId)
      .populate('lead', 'profile.firstName profile.lastName profile.avatar email')
      .populate('members.userId', 'profile.firstName profile.lastName profile.avatar email');

    res.status(200).json({
      success: true,
      data: { team: updatedTeam },
      message: 'Member added successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Add team member error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add member',
    } as ApiResponse);
  }
};

export const removeTeamMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teamId, memberId } = req.params;
    const currentUserId = req.user?.id;

    const team = await Team.findById(teamId);

    if (!team) {
      res.status(404).json({
        success: false,
        error: 'Team not found',
      } as ApiResponse);
      return;
    }

    const isLead = team.lead?.toString() === currentUserId;
    if (!isLead) {
      res.status(403).json({
        success: false,
        error: 'Only team lead can remove members',
      } as ApiResponse);
      return;
    }

    if (memberId === team.lead?.toString()) {
      res.status(400).json({
        success: false,
        error: 'Cannot remove team lead',
      } as ApiResponse);
      return;
    }

    const memberIndex = team.members.findIndex((m) => m.userId?.toString() === memberId);
    if (memberIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Member not found',
      } as ApiResponse);
      return;
    }

    team.members.splice(memberIndex, 1);
    await team.save();

    res.status(200).json({
      success: true,
      message: 'Member removed successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Remove team member error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove member',
    } as ApiResponse);
  }
};
