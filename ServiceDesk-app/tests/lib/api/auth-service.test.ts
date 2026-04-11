/**
 * Auth Service Tests
 * Tests CSRF token handling in authentication flow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import authService from '@/lib/api/auth-service';
import axiosInstance from '@/lib/api/axios-instance';
import * as csrfModule from '@/lib/api/csrf';

// Mock axios instance
vi.mock('@/lib/api/axios-instance');

// Mock CSRF module
vi.mock('@/lib/api/csrf', () => ({
  fetchCsrfToken: vi.fn(),
  getCsrfToken: vi.fn(),
  clearCsrfToken: vi.fn(),
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('login', () => {
    it('should initialize CSRF token before login', async () => {
      const mockFetchCsrf = vi.spyOn(csrfModule, 'fetchCsrfToken');
      mockFetchCsrf.mockResolvedValue('test-csrf-token');

      vi.mocked(axiosInstance.post).mockResolvedValue({
        data: {
          success: true,
          data: {
            user: {
              id: '123',
              name: 'Test User',
              email: 'test@example.com',
              role: 'user',
            },
            token: 'jwt-token',
            refreshToken: 'refresh-token',
          },
        },
      });

      await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockFetchCsrf).toHaveBeenCalled();
    });

    it('should store tokens in localStorage on successful login', async () => {
      vi.spyOn(csrfModule, 'fetchCsrfToken').mockResolvedValue('csrf-token');

      vi.mocked(axiosInstance.post).mockResolvedValue({
        data: {
          success: true,
          data: {
            user: {
              id: '123',
              name: 'Test User',
              email: 'test@example.com',
              role: 'user',
            },
            token: 'jwt-token',
            refreshToken: 'refresh-token',
          },
        },
      });

      await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(localStorage.getItem('token')).toBe('jwt-token');
      expect(localStorage.getItem('refreshToken')).toBe('refresh-token');
    });

    it('should make POST request with credentials', async () => {
      vi.spyOn(csrfModule, 'fetchCsrfToken').mockResolvedValue('csrf-token');

      vi.mocked(axiosInstance.post).mockResolvedValue({
        data: {
          success: true,
          data: {
            user: {
              id: '123',
              name: 'Test User',
              email: 'test@example.com',
              role: 'user',
            },
            token: 'jwt-token',
            refreshToken: 'refresh-token',
          },
        },
      });

      await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(axiosInstance.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should throw error on login failure', async () => {
      vi.spyOn(csrfModule, 'fetchCsrfToken').mockResolvedValue('csrf-token');

      const error = new Error('Invalid credentials');
      vi.mocked(axiosInstance.post).mockRejectedValue(error);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrong-password',
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should clear tokens on logout', async () => {
      localStorage.setItem('token', 'jwt-token');
      localStorage.setItem('refreshToken', 'refresh-token');

      vi.mocked(axiosInstance.post).mockResolvedValue({ data: {} });

      await authService.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });

    it('should clear CSRF token on logout', async () => {
      const mockClearCsrf = vi.spyOn(csrfModule, 'clearCsrfToken');

      vi.mocked(axiosInstance.post).mockResolvedValue({ data: {} });

      await authService.logout();

      expect(mockClearCsrf).toHaveBeenCalled();
    });
  });

  describe('getToken', () => {
    it('should return token from localStorage', () => {
      localStorage.setItem('token', 'jwt-token');

      const token = authService.getToken();

      expect(token).toBe('jwt-token');
    });

    it('should return null if no token', () => {
      const token = authService.getToken();

      expect(token).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true if token exists', () => {
      localStorage.setItem('token', 'jwt-token');

      const isAuth = authService.isAuthenticated();

      expect(isAuth).toBe(true);
    });

    it('should return false if no token', () => {
      const isAuth = authService.isAuthenticated();

      expect(isAuth).toBe(false);
    });
  });

  describe('refreshToken', () => {
    it('should refresh JWT token', async () => {
      localStorage.setItem('refreshToken', 'refresh-token');

      vi.mocked(axiosInstance.post).mockResolvedValue({
        data: {
          data: {
            token: 'new-jwt-token',
          },
        },
      });

      const newToken = await authService.refreshToken();

      expect(newToken).toBe('new-jwt-token');
      expect(localStorage.getItem('token')).toBe('new-jwt-token');
    });

    it('should clear tokens on refresh failure', async () => {
      localStorage.setItem('token', 'jwt-token');
      localStorage.setItem('refreshToken', 'refresh-token');

      vi.mocked(axiosInstance.post).mockRejectedValue(new Error('Refresh failed'));

      await expect(authService.refreshToken()).rejects.toThrow('Refresh failed');

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });
});
