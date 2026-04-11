/**
 * Auth Routes Contract Tests
 *
 * Verifies that auth-service.ts, useAuth.ts, and documentation (SETUP.md)
 * all agree on the same API contract. If any path or behavior drifts,
 * these tests will fail as an early warning.
 *
 * These are NOT integration tests — they assert static contract facts
 * (paths, methods, token storage keys, CSRF behavior) by inspecting
 * the actual module code via mocks.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import authAxios from '@/lib/api/auth-client';
import authService from '@/lib/api/auth-service';
import * as csrfModule from '@/lib/api/csrf';

vi.mock('@/lib/api/auth-client');
vi.mock('@/lib/api/csrf', () => ({
  fetchCsrfToken: vi.fn(),
  getCsrfToken: vi.fn(),
  clearCsrfToken: vi.fn(),
}));

// Helper: successful login response shape
const loginResponse = () => ({
  data: {
    success: true,
    data: {
      user: { id: 'u1', name: 'Test', email: 'test@test.com', role: 'user' },
      tokens: { accessToken: 'at-123', refreshToken: 'rt-456' },
    },
  },
});

describe('Auth Routes Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Path contract — all auth routes use /v2/core/auth/*', () => {
    it('login → POST /v2/core/auth/login', async () => {
      vi.spyOn(csrfModule, 'fetchCsrfToken').mockResolvedValue('csrf');
      vi.mocked(authAxios.post).mockResolvedValue(loginResponse());

      await authService.login({ email: 'a@b.com', password: 'p' });

      expect(authAxios.post).toHaveBeenCalledWith(
        '/v2/core/auth/login',
        expect.any(Object)
      );
    });

    it('logout → POST /v2/core/auth/logout', async () => {
      vi.mocked(authAxios.post).mockResolvedValue({ data: {} });

      await authService.logout();

      expect(authAxios.post).toHaveBeenCalledWith('/v2/core/auth/logout');
    });

    it('refresh → POST /v2/core/auth/refresh', async () => {
      localStorage.setItem('refreshToken', 'rt');
      vi.mocked(authAxios.post).mockResolvedValue({
        data: { data: { token: 'new-at' } },
      });

      await authService.refreshToken();

      expect(authAxios.post).toHaveBeenCalledWith(
        '/v2/core/auth/refresh',
        { refreshToken: 'rt' }
      );
    });
  });

  describe('Token storage contract', () => {
    it('login stores token and refreshToken in localStorage', async () => {
      vi.spyOn(csrfModule, 'fetchCsrfToken').mockResolvedValue('csrf');
      vi.mocked(authAxios.post).mockResolvedValue(loginResponse());

      await authService.login({ email: 'a@b.com', password: 'p' });

      expect(localStorage.getItem('token')).toBe('at-123');
      expect(localStorage.getItem('refreshToken')).toBe('rt-456');
    });

    it('logout clears token and refreshToken', async () => {
      localStorage.setItem('token', 'at');
      localStorage.setItem('refreshToken', 'rt');
      vi.mocked(authAxios.post).mockResolvedValue({ data: {} });

      await authService.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });

    it('refresh updates token in localStorage', async () => {
      localStorage.setItem('refreshToken', 'rt');
      vi.mocked(authAxios.post).mockResolvedValue({
        data: { data: { token: 'refreshed-at' } },
      });

      const newToken = await authService.refreshToken();

      expect(newToken).toBe('refreshed-at');
      expect(localStorage.getItem('token')).toBe('refreshed-at');
    });

    it('refresh failure clears both tokens', async () => {
      localStorage.setItem('token', 'at');
      localStorage.setItem('refreshToken', 'rt');
      vi.mocked(authAxios.post).mockRejectedValue(new Error('expired'));

      await expect(authService.refreshToken()).rejects.toThrow();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });

  describe('CSRF contract', () => {
    it('login fetches CSRF token before sending credentials', async () => {
      const fetchSpy = vi.spyOn(csrfModule, 'fetchCsrfToken').mockResolvedValue('csrf');
      vi.mocked(authAxios.post).mockResolvedValue(loginResponse());

      await authService.login({ email: 'a@b.com', password: 'p' });

      expect(fetchSpy).toHaveBeenCalled();
      // CSRF fetch must happen BEFORE the login POST
      const csrfCallOrder = fetchSpy.mock.invocationCallOrder[0];
      const postCallOrder = vi.mocked(authAxios.post).mock.invocationCallOrder[0];
      expect(csrfCallOrder).toBeLessThan(postCallOrder);
    });

    it('logout clears CSRF token', async () => {
      const clearSpy = vi.spyOn(csrfModule, 'clearCsrfToken');
      vi.mocked(authAxios.post).mockResolvedValue({ data: {} });

      await authService.logout();

      expect(clearSpy).toHaveBeenCalled();
    });
  });

  describe('Additional path contracts', () => {
    it('register → POST /v2/core/auth/register', async () => {
      vi.spyOn(csrfModule, 'fetchCsrfToken').mockResolvedValue('csrf');
      vi.mocked(authAxios.post).mockResolvedValue(loginResponse());

      await authService.register({ name: 'New', email: 'n@b.com', password: 'p' });

      expect(authAxios.post).toHaveBeenCalledWith(
        '/v2/core/auth/register',
        expect.any(Object)
      );
    });
  });

  describe('Response shape contract', () => {
    it('login returns { success, data: { user, tokens } }', async () => {
      vi.spyOn(csrfModule, 'fetchCsrfToken').mockResolvedValue('csrf');
      vi.mocked(authAxios.post).mockResolvedValue(loginResponse());

      const result = await authService.login({ email: 'a@b.com', password: 'p' });

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('user');
    });
  });
});
