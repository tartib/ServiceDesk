import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import User from '../models/User';
import ApiError from '../utils/ApiError';
import asyncHandler from '../utils/asyncHandler';
import { UserRole } from '../types';

import mongoose from 'mongoose';

export const authenticate = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  let token: string | undefined;

  // Extract token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // If no Authorization header, try to get token from cookies
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized, no token provided');
  }

  try {
    // Verify token
    const decoded = verifyToken(token);

    // Support both 'id' (v1 tokens) and 'userId' (v2 tokens)
    const userId = decoded.id || (decoded as any).userId;

    // Get user from database
    const user = await User.findById(userId).select('-password');

    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    if (!user.isActive) {
      throw new ApiError(401, 'User account is deactivated');
    }

    // Attach user to request
    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      isActive: user.isActive,
      organizations: user.organizations.map((org) => ({
        organizationId: org.organizationId.toString(),
        role: org.role,
        joinedAt: org.joinedAt,
      })),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    // Check for Organization Context header
    const organizationId = req.headers['x-organization-id'];
    if (organizationId && typeof organizationId === 'string') {
      if (mongoose.Types.ObjectId.isValid(organizationId)) {
        // Check if user is member of this organization
        const isMember = user.organizations.some(
          (org) => org.organizationId.toString() === organizationId
        );

        if (isMember && req.user) {
          req.user.organizationId = organizationId;
        }
      }
    }

    next();
  } catch (error) {
    throw new ApiError(401, 'Not authorized, token failed');
  }
});

export const authorize = (...roles: (UserRole | string)[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(401, 'Not authorized');
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, 'You do not have permission to perform this action');
    }

    next();
  };
};
