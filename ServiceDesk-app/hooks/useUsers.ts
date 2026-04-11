import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { UserRole } from '@/types';
import { normalizeList, normalizeEntity } from '@/lib/api/normalize';

export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: string;
  phone?: string;
}

interface UsersApiResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: {
    count: number;
    users: User[];
  };
}

// Fetch all users
export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/core/users');
      const apiResponse = response as unknown as UsersApiResponse;
      const users = apiResponse.data?.users || [];
      return normalizeList<User>(users);
    },
  });
};

// Fetch users by role (for filtered dropdowns)
export const useUsersByRole = (role: 'admin' | 'manager' | 'supervisor' | 'prep') => {
  return useQuery({
    queryKey: ['users', 'role', role],
    queryFn: async () => {
      const response = await api.get(`/core/users/role/${role}`);
      const apiResponse = response as unknown as UsersApiResponse;
      const users = apiResponse.data?.users || [];
      return normalizeList<User>(users);
    },
    enabled: !!role,
  });
};

// Fetch single user by ID
export const useUser = (userId: string) => {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: async () => {
      const response = await api.get(`/core/users/${userId}`);
      const apiResponse = response as unknown as { data: { user: User } };
      return normalizeEntity<User>(apiResponse.data?.user);
    },
    enabled: !!userId,
  });
};

// Create new user
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData: CreateUserInput) => {
      const response = await api.post('/core/auth/register', userData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
