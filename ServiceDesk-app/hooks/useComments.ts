import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

export interface CommentAuthor {
  _id: string;
  email?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
}

export interface TaskComment {
  _id: string;
  taskId: string;
  projectId?: string;
  content: string;
  author: CommentAuthor;
  mentions?: string[];
  parentId?: string;
  isEdited?: boolean;
  editedAt?: string;
  reactions?: Array<{ emoji: string; users: string[] }>;
  replies?: TaskComment[];
  createdAt: string;
  updatedAt?: string;
}

interface CommentsResponse {
  success: boolean;
  data?: { comments: TaskComment[] };
}

interface CommentResponse {
  success: boolean;
  data?: { comment: TaskComment };
}

export const useTaskComments = (taskId: string) => {
  return useQuery({
    queryKey: ['comments', 'task', taskId],
    queryFn: async () => {
      const response = await api.get<CommentsResponse>(`/pm/tasks/${taskId}/comments`);
      return (response as unknown as CommentsResponse).data?.comments || [];
    },
    enabled: !!taskId,
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      taskId, 
      content, 
      parentId 
    }: { 
      taskId: string; 
      content: string; 
      parentId?: string 
    }) => {
      const response = await api.post<CommentResponse>(`/pm/tasks/${taskId}/comments`, {
        content,
        parentId,
      });
      return (response as unknown as CommentResponse).data?.comment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', 'task', variables.taskId] });
    },
  });
};

export const useUpdateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      commentId, 
      content,
      taskId,
    }: { 
      commentId: string; 
      content: string;
      taskId: string;
    }) => {
      const response = await api.put<CommentResponse>(`/pm/comments/${commentId}`, {
        content,
      });
      return (response as unknown as CommentResponse).data?.comment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', 'task', variables.taskId] });
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, taskId }: { commentId: string; taskId: string }) => {
      await api.delete(`/pm/comments/${commentId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', 'task', variables.taskId] });
    },
  });
};
