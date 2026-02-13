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

/**
 * Update user by ID
 */
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, role, phone, isActive } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404).json(new ApiResponse(404, 'User not found'));
    return;
  }

  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (role !== undefined) user.role = role;
  if (phone !== undefined) {
    if (!user.profile) (user as any).profile = {};
    (user as any).profile.phone = phone;
  }
  if (isActive !== undefined) user.isActive = isActive;

  await user.save();

  const updated = await User.findById(user._id).select('-password');
  res.status(200).json(new ApiResponse(200, 'User updated successfully', { user: updated }));
});

export const searchUsers = asyncHandler(async (req: Request, res: Response) => {
  const { q, limit = '20' } = req.query;

  if (!q || typeof q !== 'string' || q.trim().length < 2) {
    res.status(400).json(
      new ApiResponse(400, 'Search query must be at least 2 characters')
    );
    return;
  }

  const searchRegex = new RegExp(q.trim(), 'i');
  const limitNum = Math.min(parseInt(limit as string, 10) || 20, 50);

  const users = await User.find({
    isActive: true,
    $or: [
      { name: searchRegex },
      { 'profile.firstName': searchRegex },
      { 'profile.lastName': searchRegex },
    ],
  })
    .select('name email role profile.firstName profile.lastName')
    .sort({ name: 1 })
    .limit(limitNum);

  res.status(200).json(
    new ApiResponse(200, 'Users retrieved successfully', {
      count: users.length,
      users,
    })
  );
});
