'use client';

import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '@/lib/api/config';
import type { TaskFieldDefinition } from '@/types/task-fields';

export function useProjectTaskFields(projectId: string | undefined) {
  const [fields, setFields] = useState<TaskFieldDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getToken = () => localStorage.getItem('token') || localStorage.getItem('accessToken');

  const fetchFields = useCallback(async () => {
    if (!projectId) return;
    const token = getToken();
    if (!token) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/pm/projects/${projectId}/task-fields`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const defs = data.data?.fields;
        if (Array.isArray(defs)) {
          setFields(defs);
        }
      }
    } catch (err) {
      console.error('Failed to fetch task fields:', err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  const createField = async (field: Omit<TaskFieldDefinition, 'position' | 'archived'>): Promise<boolean> => {
    const token = getToken();
    if (!token || !projectId) return false;

    try {
      const res = await fetch(`${API_URL}/pm/projects/${projectId}/task-fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(field),
      });
      if (res.ok) {
        await fetchFields();
        return true;
      }
      const data = await res.json();
      throw new Error(data.error || 'Failed to create field');
    } catch (err) {
      console.error('Failed to create task field:', err);
      return false;
    }
  };

  const updateField = async (fieldId: string, updates: Partial<TaskFieldDefinition>): Promise<boolean> => {
    const token = getToken();
    if (!token || !projectId) return false;

    try {
      const res = await fetch(`${API_URL}/pm/projects/${projectId}/task-fields/${fieldId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        await fetchFields();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to update task field:', err);
      return false;
    }
  };

  const archiveField = async (fieldId: string): Promise<boolean> => {
    const token = getToken();
    if (!token || !projectId) return false;

    try {
      const res = await fetch(`${API_URL}/pm/projects/${projectId}/task-fields/${fieldId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchFields();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to archive task field:', err);
      return false;
    }
  };

  const reorderFields = async (fieldIds: string[]): Promise<boolean> => {
    const token = getToken();
    if (!token || !projectId) return false;

    try {
      const res = await fetch(`${API_URL}/pm/projects/${projectId}/task-fields/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fieldIds }),
      });
      if (res.ok) {
        await fetchFields();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to reorder task fields:', err);
      return false;
    }
  };

  // Active (non-archived) fields, sorted by position
  const activeFields = fields
    .filter(f => !f.archived)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  return {
    fields,
    activeFields,
    isLoading,
    refetch: fetchFields,
    createField,
    updateField,
    archiveField,
    reorderFields,
  };
}
