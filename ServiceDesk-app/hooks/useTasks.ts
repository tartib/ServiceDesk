import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { 
  Task, 
  TaskFormData,
  TaskStatus
} from '@/types';
import { normalizeList, normalizeEntity, getErrorMessage } from '@/lib/api/normalize';

// API Response interface
interface InventoryUsageItem {
  itemId: string;
  quantityUsed: number;
  unit?: string;
}

/**
 * Get all tasks for a project
 * @param projectId - Project ID (required)
 */
export const useAllTasks = (projectId: string) => {
  return useQuery({
    queryKey: ['tasks', 'all', projectId],
    queryFn: async () => {
      const response = await api.get(`/pm/projects/${projectId}/tasks`);
      return normalizeList<Task>(response);
    },
    enabled: !!projectId,
  });
};

/**
 * Get today's tasks for a project
 * @param projectId - Project ID (required)
 */
export const useTodayTasks = (projectId: string) => {
  return useQuery({
    queryKey: ['tasks', 'today', projectId],
    queryFn: async () => {
      const response = await api.get(`/pm/projects/${projectId}/tasks`, {
        params: { dueDate: new Date().toISOString().split('T')[0] },
      });
      return normalizeList<Task>(response);
    },
    enabled: !!projectId,
  });
};

/**
 * Get current user's tasks for a project
 * @param projectId - Project ID (required)
 */
export const useMyTasks = (projectId: string) => {
  return useQuery({
    queryKey: ['tasks', 'my-tasks', projectId],
    queryFn: async () => {
      const response = await api.get(`/pm/projects/${projectId}/tasks`, {
        params: { assignee: 'me' },
      });
      return normalizeList<Task>(response);
    },
    enabled: !!projectId,
  });
};

/**
 * Get tasks filtered by status
 * @param projectId - Project ID (required)
 * @param status - Task status to filter by
 */
export const useTasksByStatus = (projectId: string, status: TaskStatus) => {
  return useQuery({
    queryKey: ['tasks', 'status', projectId, status],
    queryFn: async () => {
      const response = await api.get(`/pm/projects/${projectId}/tasks`, {
        params: { status },
      });
      return normalizeList<Task>(response);
    },
    enabled: !!projectId && !!status,
  });
};

/**
 * Get tasks for a specific product (legacy - use useTasksByStatus instead)
 * @deprecated Use useTasksByStatus with project context instead
 */
export const useProductTasks = (projectId: string, productId: string) => {
  return useQuery({
    queryKey: ['tasks', 'product', projectId, productId],
    queryFn: async () => {
      const response = await api.get(`/pm/projects/${projectId}/tasks`, {
        params: { product: productId },
      });
      return normalizeList<Task>(response);
    },
    enabled: !!projectId && !!productId,
  });
};



/**
 * Get a single task by ID
 * @param taskId - Task ID (required)
 */
export const useTask = (taskId: string) => {
  return useQuery({
    queryKey: ['tasks', taskId],
    queryFn: async () => {
      const response = await api.get(`/pm/tasks/${taskId}`);
      return normalizeEntity<Task>(response);
    },
    enabled: !!taskId,
  });
};



/**
 * Start a task (transition to in-progress status)
 */
export const useStartTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const response = await api.post(`/pm/tasks/${taskId}/transition`, {
        statusId: 'in-progress',
      });
      return normalizeEntity<Task>(response);
    },
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error) => {
      console.error('❌ Start Task Error:', getErrorMessage(error));
    },
  });
};

/**
 * Complete a task (transition to done status)
 */
export const useCompleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, notes }: { taskId: string; notes?: string }) => {
      const response = await api.post(`/pm/tasks/${taskId}/transition`, {
        statusId: 'done',
        comment: notes,
      });
      return normalizeEntity<Task>(response);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error) => {
      console.error('❌ Complete Task Error:', getErrorMessage(error));
    },
  });
};


/**
 * Create a new task in a project
 */
export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TaskFormData & { projectId: string }) => {
      const { projectId, ...taskData } = data;
      const response = await api.post(`/pm/projects/${projectId}/tasks`, taskData);
      return normalizeEntity<Task>(response);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', 'all', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error) => {
      console.error('❌ Create Task Error:', getErrorMessage(error));
    },
  });
};

/**
 * Assign a task to a user
 */
export const useAssignTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, userId }: { taskId: string; userId: string }) => {
      const response = await api.patch(`/pm/tasks/${taskId}`, { assignee: userId });
      return normalizeEntity<Task>(response);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error) => {
      console.error('❌ Assign Task Error:', getErrorMessage(error));
    },
  });
};

/**
 * Mark a task as late
 * @deprecated This endpoint may not be available in the backend
 */
export const useMarkTaskLate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const response = await api.patch(`/pm/tasks/${taskId}`, { isLate: true });
      return normalizeEntity<Task>(response);
    },
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error) => {
      console.error('❌ Mark Task Late Error:', getErrorMessage(error));
    },
  });
};

/**
 * Update task inventory usage
 * @deprecated This endpoint may not be available in the backend
 */
export const useUpdateTaskUsage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, inventoryUsage }: { taskId: string; inventoryUsage: InventoryUsageItem[] }) => {
      const response = await api.patch(`/pm/tasks/${taskId}`, { inventoryUsage });
      return normalizeEntity<Task>(response);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (error) => {
      console.error('❌ Update Task Usage Error:', getErrorMessage(error));
    },
  });
};
