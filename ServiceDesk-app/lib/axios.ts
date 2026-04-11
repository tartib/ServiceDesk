import axios, { AxiosRequestConfig } from 'axios';
import { API_URL } from './api/config';
import { getCsrfToken } from './api/csrf';
import { getOrganizationId } from './api/organization-context';

// Type override for axios instance that returns data directly (due to response interceptor)
interface ApiInstance {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
}

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token, organization context, and CSRF token
axiosInstance.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add organization context for PM module
    const organizationId = getOrganizationId();
    if (organizationId) {
      config.headers['X-Organization-ID'] = organizationId;
    }
  }

  // Add CSRF token for state-changing requests
  if (config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
    try {
      const csrfToken = await getCsrfToken();
      config.headers['X-CSRF-Token'] = csrfToken;
    } catch {
      // Don't block request if CSRF fetch fails
    }
  }

  return config;
});

// Response interceptor - unwrap data and handle errors
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    if (error.response?.status === 403 && error.response?.data?.message?.includes('CSRF')) {
      console.error('CSRF token validation failed:', error.response.data);
    }
    return Promise.reject(error);
  }
);

// Cast to ApiInstance to reflect that interceptor returns data directly
const api = axiosInstance as unknown as ApiInstance;

export default api;

// Also export the raw axios instance for cases that need full response (e.g. auth)
export const rawAxiosInstance = axiosInstance;
