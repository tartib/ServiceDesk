/**
 * Regression tests — useRecordViews hooks (Task 8 / Task 12)
 *
 * Covers: useRecordsByDefinition, useRecordViewMode
 */
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest';
import { useRecordsByDefinition, useRecordViewMode } from '@/hooks/useRecordViews';
import api from '@/lib/axios';

vi.mock('@/lib/axios');

const mockApi = api as unknown as { get: Mock };

const makeWrapper = () => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
};

const MOCK_RECORDS_RESPONSE = {
  submissions: [
    {
      submissionId: 'sub_1',
      formDefinitionId: 'def_abc',
      formVersion: 1,
      status: 'submitted',
      data: { name: 'Test' },
      submittedBy: { userId: 'u1', name: 'Alice', email: 'alice@test.com' },
      timeline: [],
      comments: [],
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  total: 1,
  page: 1,
  limit: 20,
  total_pages: 1,
};

describe('useRecordsByDefinition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches records for a given definitionId', async () => {
    mockApi.get = vi.fn().mockResolvedValue(MOCK_RECORDS_RESPONSE);

    const { result } = renderHook(
      () => useRecordsByDefinition('def_abc'),
      { wrapper: makeWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi.get).toHaveBeenCalledWith(
      '/forms/submissions',
      expect.objectContaining({ params: expect.objectContaining({ formTemplateId: 'def_abc' }) }),
    );
    expect(result.current.data?.records).toHaveLength(1);
    expect(result.current.data?.records[0].status).toBe('submitted');
  });

  it('is disabled when definitionId is empty string', async () => {
    mockApi.get = vi.fn();

    const { result } = renderHook(
      () => useRecordsByDefinition(''),
      { wrapper: makeWrapper() },
    );

    expect(result.current.isFetching).toBe(false);
    expect(mockApi.get).not.toHaveBeenCalled();
  });

  it('returns total and pagination metadata', async () => {
    mockApi.get = vi.fn().mockResolvedValue(MOCK_RECORDS_RESPONSE);

    const { result } = renderHook(
      () => useRecordsByDefinition('def_abc'),
      { wrapper: makeWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.total).toBe(1);
    expect(result.current.data?.page).toBe(1);
  });
});

describe('useRecordViewMode', () => {
  it('initialises to the provided default mode', () => {
    const { result } = renderHook(() => useRecordViewMode('kanban'));
    expect(result.current.viewMode).toBe('kanban');
  });

  it('defaults to table when no default provided', () => {
    const { result } = renderHook(() => useRecordViewMode());
    expect(result.current.viewMode).toBe('table');
  });

  it('updates view mode on setViewMode call', () => {
    const { result } = renderHook(() => useRecordViewMode('table'));
    act(() => {
      result.current.setViewMode('inbox');
    });
    expect(result.current.viewMode).toBe('inbox');
  });

  it('accepts all three valid modes', () => {
    const { result } = renderHook(() => useRecordViewMode('table'));
    const modes = ['table', 'kanban', 'inbox'] as const;
    for (const mode of modes) {
      act(() => result.current.setViewMode(mode));
      expect(result.current.viewMode).toBe(mode);
    }
  });
});
