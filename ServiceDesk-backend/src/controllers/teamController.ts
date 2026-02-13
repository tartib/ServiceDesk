/**
 * Team Controller - متحكم الفرق
 * Support Team Management
 */

import { Request, Response } from 'express';
import Team from '../models/Team';
import User from '../models/User';
import mongoose from 'mongoose';

/**
 * إنشاء فريق جديد
 * POST /api/v1/teams
 */
export const createTeam = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name, name_ar, description, description_ar, type } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Team name is required',
      });
    }

    const team = new Team({
      name: name.trim(),
      name_ar: name_ar?.trim() || name.trim(),
      description: description?.trim(),
      description_ar: description_ar?.trim(),
      type: type || 'support',
      created_by: userId,
      members: [],
    });

    await team.save();

    res.status(201).json({
      success: true,
      data: team,
      message: 'Team created successfully',
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Team name already exists',
      });
    }
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * الحصول على قائمة الفرق
 * GET /api/v1/teams
 */
export const getTeams = async (req: Request, res: Response) => {
  try {
    const { type, is_active, search } = req.query;

    const query: any = {};

    if (type) {
      query.type = type;
    }

    if (is_active !== undefined) {
      query.is_active = is_active === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { name_ar: { $regex: search, $options: 'i' } },
      ];
    }

    const teams = await Team.find(query)
      .populate('members.user_id', 'name email role')
      .populate('leader_id', 'name email')
      .populate('created_by', 'name email')
      .sort({ created_at: -1 });

    res.json({
      success: true,
      data: teams,
      count: teams.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * الحصول على فريق بواسطة المعرف
 * GET /api/v1/teams/:id
 */
export const getTeamById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const team = await Team.findById(id)
      .populate('members.user_id', 'name email role phone isActive')
      .populate('leader_id', 'name email')
      .populate('created_by', 'name email');

    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found',
      });
    }

    res.json({
      success: true,
      data: team,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * تحديث فريق
 * PUT /api/v1/teams/:id
 */
export const updateTeam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, name_ar, description, description_ar, type, is_active, leader_id } = req.body;

    const team = await Team.findById(id);

    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found',
      });
    }

    if (name) team.name = name.trim();
    if (name_ar) team.name_ar = name_ar.trim();
    if (description !== undefined) team.description = description?.trim();
    if (description_ar !== undefined) team.description_ar = description_ar?.trim();
    if (type) team.type = type;
    if (is_active !== undefined) team.is_active = is_active;
    if (leader_id !== undefined) {
      team.leader_id = leader_id ? new mongoose.Types.ObjectId(leader_id) : undefined;
    }

    await team.save();

    const updatedTeam = await Team.findById(id)
      .populate('members.user_id', 'name email role')
      .populate('leader_id', 'name email');

    res.json({
      success: true,
      data: updatedTeam,
      message: 'Team updated successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * حذف فريق
 * DELETE /api/v1/teams/:id
 */
export const deleteTeam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const team = await Team.findByIdAndDelete(id);

    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found',
      });
    }

    res.json({
      success: true,
      message: 'Team deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * إضافة عضو للفريق
 * POST /api/v1/teams/:id/members
 */
export const addTeamMember = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id, role } = req.body;
    const addedBy = req.user?.id;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const team = await Team.findById(id);

    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found',
      });
    }

    // Check if user exists
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if user is already a member
    const existingMember = team.members.find(
      m => m.user_id.toString() === user_id
    );

    if (existingMember) {
      return res.status(400).json({
        success: false,
        error: 'User is already a member of this team',
      });
    }

    // Add member
    team.members.push({
      user_id: new mongoose.Types.ObjectId(user_id),
      role: role || 'member',
      joined_at: new Date(),
      added_by: addedBy ? new mongoose.Types.ObjectId(addedBy) : undefined,
    });

    // If role is leader, update team leader
    if (role === 'leader') {
      team.leader_id = new mongoose.Types.ObjectId(user_id);
    }

    await team.save();

    const updatedTeam = await Team.findById(id)
      .populate('members.user_id', 'name email role')
      .populate('leader_id', 'name email');

    res.json({
      success: true,
      data: updatedTeam,
      message: 'Member added successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * إزالة عضو من الفريق
 * DELETE /api/v1/teams/:id/members/:userId
 */
export const removeTeamMember = async (req: Request, res: Response) => {
  try {
    const { id, userId } = req.params;

    const team = await Team.findById(id);

    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found',
      });
    }

    const memberIndex = team.members.findIndex(
      m => m.user_id.toString() === userId
    );

    if (memberIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Member not found in team',
      });
    }

    // Remove member
    team.members.splice(memberIndex, 1);

    // If removed member was leader, clear leader
    if (team.leader_id?.toString() === userId) {
      team.leader_id = undefined;
    }

    await team.save();

    const updatedTeam = await Team.findById(id)
      .populate('members.user_id', 'name email role')
      .populate('leader_id', 'name email');

    res.json({
      success: true,
      data: updatedTeam,
      message: 'Member removed successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * تحديث دور عضو في الفريق
 * PATCH /api/v1/teams/:id/members/:userId
 */
export const updateMemberRole = async (req: Request, res: Response) => {
  try {
    const { id, userId } = req.params;
    const { role } = req.body;

    if (!role || !['leader', 'member'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Valid role is required (leader or member)',
      });
    }

    const team = await Team.findById(id);

    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found',
      });
    }

    const member = team.members.find(
      m => m.user_id.toString() === userId
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        error: 'Member not found in team',
      });
    }

    // Update role
    member.role = role;

    // Update team leader if needed
    if (role === 'leader') {
      // Demote current leader to member
      team.members.forEach(m => {
        if (m.role === 'leader' && m.user_id.toString() !== userId) {
          m.role = 'member';
        }
      });
      team.leader_id = new mongoose.Types.ObjectId(userId);
    } else if (team.leader_id?.toString() === userId) {
      team.leader_id = undefined;
    }

    await team.save();

    const updatedTeam = await Team.findById(id)
      .populate('members.user_id', 'name email role')
      .populate('leader_id', 'name email');

    res.json({
      success: true,
      data: updatedTeam,
      message: 'Member role updated successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * الحصول على أعضاء فريق
 * GET /api/v1/teams/:id/members
 */
export const getTeamMembers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const team = await Team.findById(id)
      .populate('members.user_id', 'name email role phone isActive');

    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found',
      });
    }

    res.json({
      success: true,
      data: team.members,
      count: team.members.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
