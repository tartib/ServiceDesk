import { Request, Response } from 'express';
import User from '../models/User';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';

/**
 * Get all active users
 * For dropdowns and user selection
 */
export const getAllUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await User.find({ isActive: true })
    .select('name email role')
    .sort({ name: 1 });

  res.status(200).json(
    new ApiResponse(200, 'Users retrieved successfully', {
      count: users.length,
      users,
    })
  );
});

/**
 * Get users by role
 * Useful for filtering by prep, supervisor, or manager
 */
export const getUsersByRole = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.params;

  const users = await User.find({ role, isActive: true })
    .select('name email role')
    .sort({ name: 1 });

  res.status(200).json(
    new ApiResponse(200, `${role} users retrieved successfully`, {
      count: users.length,
      users,
    })
  );
});

/**
 * Get user by ID
 */
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    res.status(404).json(
      new ApiResponse(404, 'User not found')
    );
    return;
  }

  res.status(200).json(
    new ApiResponse(200, 'User retrieved successfully', { user })
  );
});
