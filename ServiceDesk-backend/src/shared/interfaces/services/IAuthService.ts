/**
 * Authentication Service Interface
 */

import {
  LoginDTO,
  RegisterDTO,
  AuthResponseDTO,
  UserProfileDTO,
  ChangePasswordDTO,
} from '../../dtos/auth';

export interface IAuthService {
  login(dto: LoginDTO): Promise<AuthResponseDTO>;
  register(dto: RegisterDTO): Promise<AuthResponseDTO>;
  refreshToken(refreshToken: string): Promise<AuthResponseDTO>;
  logout(userId: string): Promise<void>;
  changePassword(userId: string, dto: ChangePasswordDTO): Promise<void>;
  verifyToken(token: string): Promise<UserProfileDTO>;
  resetPassword(email: string): Promise<void>;
  confirmResetPassword(token: string, newPassword: string): Promise<void>;
}
