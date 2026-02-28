/**
 * Axios Instance with CSRF Protection
 * Automatically handles CSRF tokens for all requests
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getCsrfToken } from './csrf';
import { API_URL } from './config';

const API_BASE_URL = API_URL;

// Create axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token and CSRF token
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Attach Bearer token from localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Only add CSRF token for state-changing requests
    if (config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
      try {
        const csrfToken = await getCsrfToken();
        config.headers['X-CSRF-Token'] = csrfToken;
      } catch (error) {
        console.error('Failed to add CSRF token to request:', error);
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
