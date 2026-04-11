import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  organizationId: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  setOrganizationId: (orgId: string | null) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      organizationId: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token);
        }
        const orgId = (user as unknown as Record<string, unknown>).organizationId as string | undefined;
        if (orgId && typeof window !== 'undefined') {
          localStorage.setItem('organizationId', orgId);
        }
        set({ user, token, organizationId: orgId || null, isAuthenticated: true });
      },
      setOrganizationId: (orgId) => {
        if (typeof window !== 'undefined') {
          if (orgId) {
            localStorage.setItem('organizationId', orgId);
          } else {
            localStorage.removeItem('organizationId');
          }
        }
        set({ organizationId: orgId });
      },
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('organizationId');
        }
        set({ user: null, token: null, organizationId: null, isAuthenticated: false });
      },
      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
    }),
    {
      name: 'auth-storage',
    }
  )
);
