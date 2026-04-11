/**
 * Dedicated Auth Axios Client
 * 
 * Single auth HTTP client for login, logout, register, refresh, and related endpoints.
 * All auth routes live under /api/v2/core/auth/* on the backend.
 * 
 * Exported so that tests can mock '@/lib/api/auth-client' in one place.
 */

import axios from 'axios';
import { API_BASE_URL } from './config';
import { getCsrfToken } from './csrf';

const authAxios = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Attach Bearer token for protected auth endpoints (e.g. logout, refresh)
authAxios.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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

export default authAxios;
