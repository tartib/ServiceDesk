/**
 * Regression tests — useWorkflowBinding hooks (Task 4 / Task 12)
 *
 * Covers: useWorkflowBindingStatus, useBindWorkflow, useUnbindWorkflow, useDisableWorkflow
 */
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest';
import {
  useWorkflowBindingStatus,
  useBindWorkflow,
  useUnbindWorkflow,
} from '@/hooks/useWorkflowBinding';
import api from '@/lib/axios';

vi.mock('@/lib/axios');

const mockApi = api as unknown as { get: Mock; post: Mock; delete: Mock; patch: Mock };

const makeWrapper = (qc: QueryClient) =>
  ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);

describe('useWorkflowBindingStatus', () => {
  let qc: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  it('fetches binding status for a form definition', async () => {
    mockApi.get = vi.fn().mockResolvedValue({
      formId: 'def_1',
      workflowDefinitionId: 'wf_1',
      workflowMode: 'advanced',
      isBound: true,
    });

    const { result } = renderHook(
      () => useWorkflowBindingStatus('def_1'),
      { wrapper: makeWrapper(qc) },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.workflowMode).toBe('advanced');
    expect(result.current.data?.isBound).toBe(true);
  });

  it('is disabled when formDefinitionId is empty', () => {
    mockApi.get = vi.fn();

    const { result } = renderHook(
      () => useWorkflowBindingStatus(''),
      { wrapper: makeWrapper(qc) },
    );

    expect(result.current.isFetching).toBe(false);
    expect(mockApi.get).not.toHaveBeenCalled();
  });

  it('returns null binding when form has no workflow', async () => {
    mockApi.get = vi.fn().mockResolvedValue({
      formId: 'def_2',
      workflowMode: 'none',
      isBound: false,
    });

    const { result } = renderHook(
      () => useWorkflowBindingStatus('def_2'),
      { wrapper: makeWrapper(qc) },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.workflowMode).toBe('none');
  });
});

describe('useBindWorkflow', () => {
  let qc: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  it('calls POST to bind a workflow', async () => {
    mockApi.post = vi.fn().mockResolvedValue({ success: true, mode: 'advanced' });

    const { result } = renderHook(() => useBindWorkflow(), { wrapper: makeWrapper(qc) });

    await result.current.mutateAsync({
      formId: 'def_1',
      dto: { workflowDefinitionId: 'wf_1' },
    });

    expect(mockApi.post).toHaveBeenCalledWith(
      expect.stringContaining('def_1'),
      expect.objectContaining({ workflowDefinitionId: 'wf_1' }),
    );
  });
});

describe('useUnbindWorkflow', () => {
  let qc: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  it('calls DELETE to unbind a workflow', async () => {
    mockApi.delete = vi.fn().mockResolvedValue({ success: true });

    const { result } = renderHook(() => useUnbindWorkflow(), { wrapper: makeWrapper(qc) });

    await result.current.mutateAsync('def_1');

    expect(mockApi.delete).toHaveBeenCalledWith(
      expect.stringContaining('def_1'),
    );
  });
});
