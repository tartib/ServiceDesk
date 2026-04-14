import { Request, Response } from 'express';
import User from '../../../models/User';
import ApiError from '../../../utils/ApiError';
import ApiResponse from '../../../utils/ApiResponse';
import asyncHandler from '../../../utils/asyncHandler';
import logger from '../../../utils/logger';

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, phone, fcmToken } = req.body;

  const user = await User.findById(req.user?.id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (email && email !== user.email) {
    const existing = await User.findOne({ email, _id: { $ne: user._id } });
    if (existing) {
      throw new ApiError(409, 'Email is already in use');
    }
    user.email = email;
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

export {
  register,
  login,
  refreshToken,
  logout,
  me,
  changePassword,
} from '../../pm/controllers/auth.controller';
