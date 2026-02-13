import { Request, Response } from 'express';
import logger from '../../utils/logger';
import { validationResult } from 'express-validator';
import Organization from '../../models/pm/Organization';
import User from '../../models/User';
import { ApiResponse, OrganizationRole } from '../../types/pm';

export const createOrganization = async (req: Request, res: Response): Promise<void> => {
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
    const { name, description, settings } = req.body;

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const existingOrg = await Organization.findOne({ slug });
    if (existingOrg) {
      res.status(400).json({
        success: false,
        error: 'Organization with this name already exists',
      } as ApiResponse);
      return;
    }

    const organization = new Organization({
      name,
      slug,
      description,
      settings,
      createdBy: userId,
    });

    await organization.save();

    await User.findByIdAndUpdate(userId, {
      $push: {
        organizations: {
          organizationId: organization._id,
          role: OrganizationRole.OWNER,
          joinedAt: new Date(),
        },
      },
    });

    res.status(201).json({
      success: true,
      data: { organization },
      message: 'Organization created successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Create organization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create organization',
    } as ApiResponse);
  }
};

export const getOrganizations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      } as ApiResponse);
      return;
    }

    const orgIds = user.organizations.map((o) => o.organizationId);
    const organizations = await Organization.find({ _id: { $in: orgIds } });

    const orgsWithRoles = organizations.map((org) => {
      const userOrg = user.organizations.find(
        (o) => o.organizationId.toString() === org._id.toString()
      );
      return {
        ...org.toJSON(),
        role: userOrg?.role,
        joinedAt: userOrg?.joinedAt,
      };
    });

    res.status(200).json({
      success: true,
      data: { organizations: orgsWithRoles },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get organizations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch organizations',
    } as ApiResponse);
  }
};

export const getOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const userId = req.user?.id;

    const organization = await Organization.findById(organizationId);

    if (!organization) {
      res.status(404).json({
        success: false,
        error: 'Organization not found',
      } as ApiResponse);
      return;
    }

    const user = await User.findById(userId);
    const userOrg = user?.organizations.find(
      (o) => o.organizationId.toString() === organizationId
    );

    if (!userOrg) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        organization: {
          ...organization.toJSON(),
          role: userOrg.role,
        },
      },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get organization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch organization',
    } as ApiResponse);
  }
};

export const updateOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array().map((e: any) => ({ field: e.type, message: e.msg })),
      } as ApiResponse);
      return;
    }

    const { organizationId } = req.params;
    const userId = req.user?.id;

    const user = await User.findById(userId);
    const userOrg = user?.organizations.find(
      (o) => o.organizationId.toString() === organizationId
    );

    if (!userOrg || ![OrganizationRole.OWNER, OrganizationRole.ADMIN].includes(userOrg.role as OrganizationRole)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      } as ApiResponse);
      return;
    }

    const { name, description, settings } = req.body;

    const organization = await Organization.findByIdAndUpdate(
      organizationId,
      {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(settings && { settings }),
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: { organization },
      message: 'Organization updated successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Update organization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update organization',
    } as ApiResponse);
  }
};

export const getOrganizationMembers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { organizationId } = req.params;

    const users = await User.find({
      'organizations.organizationId': organizationId,
    }).select('email profile organizations');

    const members = users.map((user) => {
      const orgMembership = user.organizations.find(
        (o) => o.organizationId.toString() === organizationId
      );
      return {
        _id: user._id,
        email: user.email,
        profile: user.profile,
        role: orgMembership?.role,
        joinedAt: orgMembership?.joinedAt,
      };
    });

    res.status(200).json({
      success: true,
      data: { members },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get members error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch members',
    } as ApiResponse);
  }
};

export const inviteMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const { email, role } = req.body;
    const userId = req.user?.id;

    const currentUser = await User.findById(userId);
    const currentUserOrg = currentUser?.organizations.find(
      (o) => o.organizationId.toString() === organizationId
    );

    if (!currentUserOrg || ![OrganizationRole.OWNER, OrganizationRole.ADMIN].includes(currentUserOrg.role as OrganizationRole)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      } as ApiResponse);
      return;
    }

    const invitedUser = await User.findOne({ email: email.toLowerCase() });
    if (!invitedUser) {
      res.status(404).json({
        success: false,
        error: 'User not found. They must register first.',
      } as ApiResponse);
      return;
    }

    const alreadyMember = invitedUser.organizations.some(
      (o) => o.organizationId.toString() === organizationId
    );

    if (alreadyMember) {
      res.status(400).json({
        success: false,
        error: 'User is already a member',
      } as ApiResponse);
      return;
    }

    invitedUser.organizations.push({
      organizationId: organizationId as any,
      role: role || OrganizationRole.MEMBER,
      joinedAt: new Date(),
    });

    await invitedUser.save();

    res.status(200).json({
      success: true,
      message: 'Member added successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Invite member error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to invite member',
    } as ApiResponse);
  }
};

export const removeMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { organizationId, memberId } = req.params;
    const userId = req.user?.id;

    const currentUser = await User.findById(userId);
    const currentUserOrg = currentUser?.organizations.find(
      (o) => o.organizationId.toString() === organizationId
    );

    if (!currentUserOrg || ![OrganizationRole.OWNER, OrganizationRole.ADMIN].includes(currentUserOrg.role as OrganizationRole)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      } as ApiResponse);
      return;
    }

    if (memberId === userId) {
      res.status(400).json({
        success: false,
        error: 'Cannot remove yourself',
      } as ApiResponse);
      return;
    }

    const memberUser = await User.findById(memberId);
    if (!memberUser) {
      res.status(404).json({
        success: false,
        error: 'Member not found',
      } as ApiResponse);
      return;
    }

    const memberOrg = memberUser.organizations.find(
      (o) => o.organizationId.toString() === organizationId
    );

    if (memberOrg?.role === OrganizationRole.OWNER) {
      res.status(400).json({
        success: false,
        error: 'Cannot remove organization owner',
      } as ApiResponse);
      return;
    }

    memberUser.organizations = memberUser.organizations.filter(
      (o) => o.organizationId.toString() !== organizationId
    );

    await memberUser.save();

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

export const switchOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const userId = req.user?.id;

    const user = await User.findById(userId);
    const userOrg = user?.organizations.find(
      (o) => o.organizationId.toString() === organizationId
    );

    if (!userOrg) {
      res.status(403).json({
        success: false,
        error: 'Not a member of this organization',
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: { organizationId },
      message: 'Organization switched successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Switch organization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to switch organization',
    } as ApiResponse);
  }
};
