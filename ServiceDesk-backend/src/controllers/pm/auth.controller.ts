import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { getService } from '../../infrastructure/di/middleware';
import { IAuthService } from '../../infrastructure/di/types';
import { ApiResponse } from '../../types/pm';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array().map((e) => ({ field: e.type, message: e.msg })),
      } as ApiResponse);
      return;
    }

    const { email, password, firstName, lastName, organizationName } = req.body;
    const authService: IAuthService = getService(req, 'authService');

    const result = await authService.register({
      email,
      password,
      firstName,
      lastName,
      organizationName,
    });

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        organization: result.organization,
        tokens: result.tokens,
      },
      message: 'Registration successful',
    } as ApiResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    res.status(400).json({
      success: false,
      error: message,
    } as ApiResponse);
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array().map((e) => ({ field: e.type, message: e.msg })),
      } as ApiResponse);
      return;
    }

    const { email, password } = req.body;
    const authService: IAuthService = getService(req, 'authService');

    const result = await authService.login({ email, password });

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        tokens: result.tokens,
      },
      message: 'Login successful',
    } as ApiResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    res.status(401).json({
      success: false,
      error: message,
    } as ApiResponse);
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: 'Refresh token is required',
      } as ApiResponse);
      return;
    }

    const authService: IAuthService = getService(req, 'authService');
    const tokens = await authService.refreshTokens(refreshToken);

    res.status(200).json({
      success: true,
      data: { tokens },
    } as ApiResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Token refresh failed';
    res.status(401).json({
      success: false,
      error: message,
    } as ApiResponse);
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
      } as ApiResponse);
      return;
    }

    const authService: IAuthService = getService(req, 'authService');
    await authService.logout(userId);

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Logout failed',
    } as ApiResponse);
  }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array().map((e) => ({ field: e.type, message: e.msg })),
      } as ApiResponse);
      return;
    }

    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
      } as ApiResponse);
      return;
    }

    const authService: IAuthService = getService(req, 'authService');
    await authService.changePassword(userId, currentPassword, newPassword);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    } as ApiResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Password change failed';
    res.status(400).json({
      success: false,
      error: message,
    } as ApiResponse);
  }
};

export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const User = (await import('../../models/User')).default;
    
    const user = await User.findById(userId).populate('organizations.organizationId');

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: { user },
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
    } as ApiResponse);
  }
};
