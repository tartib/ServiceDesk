import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import authService from '@/lib/api/auth-service';
import { useAuthStore } from '@/store/authStore';
import { LoginFormData, RegisterFormData, User, ApiResponse } from '@/types';
import { useRouter } from 'next/navigation';

export const useLogin = () => {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: LoginFormData) => {
      return await authService.login({
        email: data.email,
        password: data.password,
      });
    },
    onSuccess: (response) => {
      const user = response.data.user as unknown as User;
      const token = response.data.token;
      if (user && token) {
        setAuth(user, token);
        router.push('/');
      }
    },
  });
};

export const useRegister = () => {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: RegisterFormData) => {
      return await authService.register({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: (data as unknown as Record<string, unknown>).phone as string | undefined,
      });
    },
    onSuccess: (response) => {
      const user = response.data.user as unknown as User;
      const token = response.data.token;
      if (user && token) {
        setAuth(user, token);
        router.push('/');
      }
    },
  });
};

export const useCurrentUser = () => {
  const { updateUser, isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const body = await api.get<Record<string, unknown>>('/core/auth/me');
      // Backend returns { success, data: { user: { id, name, email, role, ... } } }
      const data = body?.data as Record<string, unknown> | undefined;
      const user = (data?.user || data || body) as User;
      if (user) {
        updateUser(user);
      }
      return user;
    },
    enabled: isAuthenticated,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { updateUser } = useAuthStore();

  return useMutation({
    mutationFn: async (data: Partial<User>): Promise<User> => {
      const response = await api.patch<{ data?: User } | User>('/core/auth/profile', data);
      // Unwrap if nested
      if (response && typeof response === 'object' && 'data' in response && (response as { data?: User }).data) {
        return (response as { data: User }).data;
      }
      return response as User;
    },
    onSuccess: (user: User) => {
      if (user) {
        updateUser(user);
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      }
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      return await api.patch<ApiResponse<void>>('/core/auth/password', data);
    },
  });
};
