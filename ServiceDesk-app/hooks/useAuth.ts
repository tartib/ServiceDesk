import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/api/axios-instance';
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
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await axiosInstance.get('/auth/me') as { data?: User } | User;
      return 'data' in response && response.data ? response.data : response as User;
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { updateUser } = useAuthStore();

  return useMutation({
    mutationFn: async (data: Partial<User>): Promise<{ data?: User } | User> => {
      const response = await axiosInstance.patch('/auth/profile', data);
      return response as { data?: User } | User;
    },
    onSuccess: (response: { data?: User } | User) => {
      let user: User | undefined;
      if ('data' in response && response.data) {
        user = response.data;
      } else if ('id' in response) {
        user = response as User;
      }
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
      const response = await axiosInstance.patch('/auth/password', data);
      return response.data as ApiResponse<void>;
    },
  });
};
