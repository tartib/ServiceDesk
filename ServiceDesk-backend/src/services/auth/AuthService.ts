/**
 * Auth Service Implementation
 * Refactored to use DI and interfaces
 */

import { IAuthService } from '../../shared/interfaces/services/IAuthService';
import {
  LoginDTO,
  RegisterDTO,
  AuthResponseDTO,
  UserProfileDTO,
  ChangePasswordDTO,
} from '../../shared/dtos/auth';
import User, { IUser } from '../../models/User';
import { generateToken, generateRefreshToken, verifyToken } from '../../utils/jwt';
import ApiError from '../../utils/ApiError';
import logger from '../../utils/logger';

export class AuthService implements IAuthService {
  async login(dto: LoginDTO): Promise<AuthResponseDTO> {
    const user = await User.findOne({ email: dto.email }).select('+password');

    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const isPasswordValid = await user.comparePassword(dto.password);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid email or password');
    }

    if (!user.isActive) {
      throw new ApiError(401, 'User account is deactivated');
    }

    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    logger.info('User logged in', { userId: user._id, email: user.email });

    return {
      accessToken,
      refreshToken,
      user: this.mapToUserProfile(user),
    };
  }

  async register(dto: RegisterDTO): Promise<AuthResponseDTO> {
    const existingUser = await User.findOne({ email: dto.email });
    if (existingUser) {
      throw new ApiError(409, 'Email already registered');
    }

    const user = new User({
      name: dto.name,
      email: dto.email,
      password: dto.password,
    });

    await user.save();

    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    logger.info('User registered', { userId: user._id, email: user.email });

    return {
      accessToken,
      refreshToken,
      user: this.mapToUserProfile(user),
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthResponseDTO> {
    try {
      const decoded = verifyToken(refreshToken);
      const user = await User.findById(decoded.id);

      if (!user || !user.isActive) {
        throw new ApiError(401, 'Invalid refresh token');
      }

      const accessToken = generateToken(user);
      const newRefreshToken = generateRefreshToken(user);

      return {
        accessToken,
        refreshToken: newRefreshToken,
        user: this.mapToUserProfile(user),
      };
    } catch (error) {
      throw new ApiError(401, 'Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    logger.info('User logged out', { userId });
  }

  async changePassword(userId: string, dto: ChangePasswordDTO): Promise<void> {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const isPasswordValid = await user.comparePassword(dto.currentPassword);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Current password is incorrect');
    }

    user.password = dto.newPassword;
    await user.save();

    logger.info('User changed password', { userId });
  }

  async verifyToken(token: string): Promise<UserProfileDTO> {
    try {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id);

      if (!user || !user.isActive) {
        throw new ApiError(401, 'Invalid token');
      }

      return this.mapToUserProfile(user);
    } catch (error) {
      throw new ApiError(401, 'Invalid token');
    }
  }

  async resetPassword(email: string): Promise<void> {
    const user = await User.findOne({ email });

    if (!user) {
      logger.warn('Password reset requested for non-existent user', { email });
      return;
    }

    logger.info('Password reset initiated', { userId: user._id, email });
  }

  async confirmResetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id);

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      user.password = newPassword;
      await user.save();

      logger.info('Password reset completed', { userId: user._id });
    } catch (error) {
      throw new ApiError(401, 'Invalid reset token');
    }
  }

  private mapToUserProfile(user: IUser): UserProfileDTO {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

export default AuthService;
