/**
 * CSRF Token Hook
 * Provides CSRF token management for API requests
 */

import { useEffect, useState } from 'react';
import { getCsrfToken, fetchCsrfToken, clearCsrfToken } from '@/lib/api/csrf';

export function useCsrfToken() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initializeToken = async () => {
      try {
        setLoading(true);
        const csrfToken = await getCsrfToken();
        setToken(csrfToken);
        setError(null);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to get CSRF token');
        setError(error);
        console.error('CSRF token initialization failed:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeToken();
  }, []);

  const refreshToken = async () => {
    try {
      clearCsrfToken();
      const newToken = await fetchCsrfToken();
      setToken(newToken);
      setError(null);
      return newToken;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to refresh CSRF token');
      setError(error);
      throw error;
    }
  };

  return { token, loading, error, refreshToken };
}
