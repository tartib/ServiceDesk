/**
 * Axios Instance with CSRF Protection
 * Automatically handles CSRF tokens for all requests
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getCsrfToken } from './csrf';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add CSRF token to state-changing requests
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Only add CSRF token for state-changing requests
    if (config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
      try {
        const token = await getCsrfToken();
        config.headers['X-CSRF-Token'] = token;
      } catch (error) {
        console.error('Failed to add CSRF token to request:', error);
        // Continue without token - let server handle the error
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403 && error.response?.data?.message?.includes('CSRF')) {
      console.error('CSRF token validation failed:', error.response.data);
      // Could trigger token refresh here if needed
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
