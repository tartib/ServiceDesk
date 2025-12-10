import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import User from '../models/User';
import ApiError from '../utils/ApiError';
import asyncHandler from '../utils/asyncHandler';
import { UserRole } from '../types';

export const authenticate = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  let token: string | undefined;

  // Extract token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized, no token provided');
  }

  try {
    // Verify token
    const decoded = verifyToken(token);

    // Get user from database
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    if (!user.isActive) {
      throw new ApiError(401, 'User account is deactivated');
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, 'Not authorized, token failed');
  }
});

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(401, 'Not authorized');
    }

    if (!roles.includes(req.user.role as UserRole)) {
      throw new ApiError(403, 'You do not have permission to perform this action');
    }

    next();
  };
};
