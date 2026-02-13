import { useState, useCallback } from 'react';
import api from '@/lib/axios';
import { parseApiResponse, getErrorMessage } from '@/lib/api/response-parser';

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export interface SprintPlanningData {
  sprintId: string;
  goal: string;
  capacity: number;
  committed: number;
  startDate?: Date;
  endDate?: Date;
  teamMembers?: TeamMember[];
  historicalVelocity?: number;
  availabilityPercentage?: number;
}

export interface TeamMember {
  userId: string;
  name: string;
  email: string;
  availability: number; // hours per day
  daysOff: string[]; // dates
}

export interface CapacitySettings {
  sprintDays: number;
  defaultHoursPerDay: number;
  meetings: number; // hours per sprint
  teamMembers: TeamMember[];
}

export const useSprintPlanning = (projectId: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSprintPlanning = useCallback(async (sprintId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<{ data: SprintPlanningData }>(`/pm/sprints/${sprintId}/planning`);
      return response.data;
    } catch (err: unknown) {
      const message = err instanceof Error && 'response' in err ? (err as ApiError).response?.data?.message : undefined;
      setError(message || 'Failed to fetch sprint planning');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCapacity = useCallback(async (sprintId: string, capacity: CapacitySettings) => {
    try {
      setLoading(true);
      setError(null);
      // Transform frontend CapacitySettings to backend's expected teamCapacity format
      const teamCapacity = capacity.teamMembers.map(member => ({
        userId: member.userId,
        availableDays: capacity.sprintDays - member.daysOff.length,
        hoursPerDay: member.availability || capacity.defaultHoursPerDay,
        plannedLeave: member.daysOff.length,
        meetingHours: capacity.meetings / (capacity.teamMembers.length || 1),
      }));
      const response = await api.put<{ data: SprintPlanningData }>(`/pm/sprints/${sprintId}/capacity`, { teamCapacity });
      return response.data;
    } catch (err: unknown) {
      const message = err instanceof Error && 'response' in err ? (err as ApiError).response?.data?.message : undefined;
      setError(message || 'Failed to update capacity');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSprintSettings = useCallback(async (sprintId: string, settings: Partial<SprintPlanningData>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.put<{ data: SprintPlanningData }>(`/pm/sprints/${sprintId}`, settings);
      return response.data;
    } catch (err: unknown) {
      const message = err instanceof Error && 'response' in err ? (err as ApiError).response?.data?.message : undefined;
      setError(message || 'Failed to update sprint settings');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const startSprint = useCallback(async (sprintId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post(`/pm/sprints/${sprintId}/start`);
      return parseApiResponse<SprintPlanningData>(response);
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      setError(message || 'Failed to start sprint');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const completeSprint = useCallback(async (sprintId: string, moveIncompleteToBacklog?: boolean) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post(`/pm/sprints/${sprintId}/complete`, { moveIncompleteToBacklog });
      return parseApiResponse<SprintPlanningData>(response);
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      setError(message || 'Failed to complete sprint');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateTeamCapacity = useCallback((settings: CapacitySettings): number => {
    let totalCapacity = 0;
    
    settings.teamMembers.forEach(member => {
      const workingDays = settings.sprintDays - member.daysOff.length;
      const memberCapacity = workingDays * member.availability;
      totalCapacity += memberCapacity;
    });

    // Subtract meeting time
    totalCapacity -= settings.meetings;

    return Math.max(0, totalCapacity);
  }, []);

  const calculateAvailabilityPercentage = useCallback((settings: CapacitySettings): number => {
    // Calculate ideal capacity (all members, full days, no meetings)
    const idealCapacity = settings.teamMembers.length * settings.sprintDays * settings.defaultHoursPerDay;
    
    if (idealCapacity === 0) return 100;
    
    // Calculate actual available capacity
    const actualCapacity = calculateTeamCapacity(settings);
    
    // Return percentage
    return Math.round((actualCapacity / idealCapacity) * 100);
  }, [calculateTeamCapacity]);

  const calculateCapacityFromVelocity = useCallback((
    historicalVelocity: number,
    availabilityPercentage: number
  ): number => {
    // Recommended approach: Historical Velocity × Availability %
    return Math.round(historicalVelocity * (availabilityPercentage / 100));
  }, []);

  return {
    loading,
    error,
    getSprintPlanning,
    updateCapacity,
    updateSprintSettings,
    startSprint,
    completeSprint,
    calculateTeamCapacity,
    calculateAvailabilityPercentage,
    calculateCapacityFromVelocity,
  };
};
