/**
 * Authentication DTOs
 */

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface RefreshTokenDTO {
  refreshToken: string;
}

export interface AuthResponseDTO {
  accessToken: string;
  refreshToken: string;
  user: UserProfileDTO;
}

export interface UserProfileDTO {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordDTO {
  email: string;
}

export interface ConfirmResetPasswordDTO {
  token: string;
  newPassword: string;
}
