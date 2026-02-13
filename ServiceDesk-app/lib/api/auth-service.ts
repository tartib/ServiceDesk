/**
 * Authentication Service
 * Handles login, logout, and token management with CSRF protection
 */

import axios from 'axios';
import axiosInstance from './axios-instance';
import { fetchCsrfToken, clearCsrfToken } from './csrf';
import type { AxiosError } from 'axios';

// Auth uses v2 endpoints, create a dedicated instance
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
const authAxios = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
    token: string;
    refreshToken: string;
  };
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

class AuthService {
  /**
   * Initialize CSRF token before making requests
   */
  async initializeCsrf(): Promise<string | null> {
    try {
      return await fetchCsrfToken();
    } catch (error) {
      console.error('Failed to initialize CSRF token:', error);
      // Don't block login if CSRF fetch fails
      return null;
    }
  }

  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      // Ensure CSRF token is available
      await this.initializeCsrf();

      const response = await authAxios.post(
        '/v2/core/auth/login',
        credentials
      );

      const resData = response.data;
      // Backend returns { data: { user, tokens: { accessToken, refreshToken } } }
      const user = resData.data?.user;
      const tokens = resData.data?.tokens;
      const token = tokens?.accessToken || resData.data?.token;
      const refreshToken = tokens?.refreshToken || resData.data?.refreshToken;

      if (token) {
        localStorage.setItem('token', token);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      }

      // Normalize response to match LoginResponse interface
      return {
        success: resData.success,
        data: {
          user,
          token,
          refreshToken,
        },
      } as LoginResponse;
    } catch (error) {
      const err = error as AxiosError;
      console.error('Login failed:', err.response?.data || err.message);
      throw error;
    }
  }

  /**
   * Register new user
   */
  async register(data: RegisterRequest): Promise<LoginResponse> {
    try {
      // Ensure CSRF token is available
      await this.initializeCsrf();

      const response = await authAxios.post(
        '/v2/core/auth/register',
        data
      );

      const resData = response.data;
      const user = resData.data?.user;
      const tokens = resData.data?.tokens;
      const token = tokens?.accessToken || resData.data?.token;
      const refreshToken = tokens?.refreshToken || resData.data?.refreshToken;

      if (token) {
        localStorage.setItem('token', token);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      }

      return {
        success: resData.success,
        data: {
          user,
          token,
          refreshToken,
        },
      } as LoginResponse;
    } catch (error) {
      const err = error as AxiosError;
      console.error('Registration failed:', err.response?.data || err.message);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await axiosInstance.post('/auth/logout');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // Clear tokens regardless of API response
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      clearCsrfToken();
    }
  }

  /**
   * Refresh token
   */
  async refreshToken(): Promise<string> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axiosInstance.post<{ data: { token: string } }>(
        '/auth/refresh',
        { refreshToken }
      );

      const newToken = response.data.data.token;
      localStorage.setItem('token', newToken);

      return newToken;
    } catch (error) {
      const err = error as AxiosError;
      console.error('Token refresh failed:', err.response?.data || err.message);
      // Clear tokens on refresh failure
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      clearCsrfToken();
      throw error;
    }
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

const authService = new AuthService();
export default authService;
