'use client';

import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '@/lib/api/config';

export interface IssueType {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
}

const DEFAULT_ISSUE_TYPES: IssueType[] = [
  { id: 'epic', name: 'Epic', icon: '⚡', color: 'text-info' },
  { id: 'feature', name: 'Feature', icon: '📦', color: 'text-warning' },
  { id: 'task', name: 'Task', icon: '✓', color: 'text-brand' },
  { id: 'story', name: 'Story', icon: '📖', color: 'text-success' },
  { id: 'bug', name: 'Bug', icon: '🐛', color: 'text-destructive' },
];

export function useProjectIssueTypes(projectId: string | undefined) {
  const [issueTypes, setIssueTypes] = useState<IssueType[]>(DEFAULT_ISSUE_TYPES);
  const [isLoading, setIsLoading] = useState(false);

  const getToken = () => localStorage.getItem('token') || localStorage.getItem('accessToken');

  const fetchIssueTypes = useCallback(async () => {
    if (!projectId) return;
    const token = getToken();
    if (!token) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/pm/projects/${projectId}/issue-types`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const types = data.data?.issueTypes;
        if (types && types.length > 0) {
          setIssueTypes(types);
        }
      }
    } catch (err) {
      console.error('Failed to fetch issue types:', err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchIssueTypes();
  }, [fetchIssueTypes]);

  const addIssueType = async (issueType: IssueType): Promise<boolean> => {
    const token = getToken();
    if (!token || !projectId) return false;

    try {
      const res = await fetch(`${API_URL}/pm/projects/${projectId}/issue-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(issueType),
      });
      if (res.ok) {
        await fetchIssueTypes();
        return true;
      }
      const data = await res.json();
      throw new Error(data.error || 'Failed to add issue type');
    } catch (err) {
      console.error('Failed to add issue type:', err);
      return false;
    }
  };

  const updateIssueType = async (typeId: string, updates: Partial<IssueType>): Promise<boolean> => {
    const token = getToken();
    if (!token || !projectId) return false;

    try {
      const res = await fetch(`${API_URL}/pm/projects/${projectId}/issue-types/${typeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        await fetchIssueTypes();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to update issue type:', err);
      return false;
    }
  };

  const deleteIssueType = async (typeId: string): Promise<{ success: boolean; error?: string }> => {
    const token = getToken();
    if (!token || !projectId) return { success: false, error: 'Not authenticated' };

    try {
      const res = await fetch(`${API_URL}/pm/projects/${projectId}/issue-types/${typeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        await fetchIssueTypes();
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to delete' };
    } catch (err) {
      console.error('Failed to delete issue type:', err);
      return { success: false, error: 'Network error' };
    }
  };

  return {
    issueTypes,
    isLoading,
    refetch: fetchIssueTypes,
    addIssueType,
    updateIssueType,
    deleteIssueType,
  };
}
