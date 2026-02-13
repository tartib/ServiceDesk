import { Request, Response } from 'express';
import User from '../models/User';
import { generateToken, generateRefreshToken } from '../utils/jwt';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';
import logger from '../utils/logger';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role, phone } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, 'User already exists with this email');
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role,
    phone,
  });

  // Generate tokens
  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);

  logger.info(`New user registered: ${email}`);

  res.status(201).json(
    new ApiResponse(201, 'User registered successfully', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
      refreshToken,
    })
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    throw new ApiError(400, 'Please provide email and password');
  }

  // Find user with password field
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  
  logger.info(`Login attempt for: ${email}, User found: ${!!user}`);

  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new ApiError(401, 'Your account has been deactivated');
  }

  // Check password
  const isPasswordMatch = await user.comparePassword(password);

  if (!isPasswordMatch) {
    throw new ApiError(401, 'Invalid credentials');
  }

  // Generate tokens
  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);

  logger.info(`User logged in: ${email}`);

  res.status(200).json(
    new ApiResponse(200, 'Login successful', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
      refreshToken,
    })
  );
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.status(200).json(
    new ApiResponse(200, 'User profile retrieved', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    })
  );
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { name, phone, fcmToken } = req.body;

  const user = await User.findById(req.user?.id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (fcmToken) user.fcmToken = fcmToken;

  await user.save();

  logger.info(`User profile updated: ${user.email}`);

  res.status(200).json(
    new ApiResponse(200, 'Profile updated successfully', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    })
  );
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Please provide current and new password');
  }

  const user = await User.findById(req.user?.id).select('+password');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Verify current password
  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  logger.info(`Password changed for user: ${user.email}`);

  res.status(200).json(new ApiResponse(200, 'Password changed successfully'));
});
