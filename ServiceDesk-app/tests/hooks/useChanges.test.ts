import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';
import { mockChangeStats } from '../mocks/handlers';
import {
  useChanges,
  useChange,
  useChangeStats,
  usePendingCabApproval,
  useScheduledChanges,
  useEmergencyChanges,
  useMyChangeRequests,
  useCreateChange,
  useUpdateChange,
  useSubmitChangeForApproval,
  useAddCabApproval,
  useScheduleChange,
  useStartImplementation,
  useCompleteChange,
  useCancelChange,
} from '@/hooks/useChanges';
import {
  ChangeStatus,
  ChangeType,
  Priority,
  Impact,
  RiskLevel,
  ApprovalStatus,
} from '@/types/itsm';

const BASE_URL = 'http://localhost:5000/api';

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  TestWrapper.displayName = 'TestWrapper';
  return TestWrapper;
};

describe('useChanges Hooks - White Box Testing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // Query Hooks Tests
  // ============================================

  describe('useChanges', () => {
    it('should fetch changes list without filters', async () => {
      const { result } = renderHook(() => useChanges(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.data).toHaveLength(3);
      expect(result.current.data?.pagination).toBeDefined();
    });

    it('should fetch changes with status filter', async () => {
      const { result } = renderHook(
        () => useChanges({ status: [ChangeStatus.DRAFT] }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.data.every((c) => c.status === ChangeStatus.DRAFT)).toBe(true);
    });

    it('should fetch changes with pagination', async () => {
      const { result } = renderHook(
        () => useChanges({ page: 2, limit: 5 }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.pagination.page).toBe(2);
      expect(result.current.data?.pagination.limit).toBe(5);
    });

    it('should fetch changes with multiple filters', async () => {
      const { result } = renderHook(
        () =>
          useChanges({
            status: [ChangeStatus.APPROVED],
            type: [ChangeType.NORMAL],
            priority: [Priority.HIGH],
            site_id: 'site-001',
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toBeDefined();
    });

    it('should handle API error gracefully', async () => {
      server.use(
        http.get(`${BASE_URL}/v2/changes`, () => {
          return HttpResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
          );
        })
      );

      const { result } = renderHook(() => useChanges(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useChange', () => {
    it('should fetch single change by ID', async () => {
      const { result } = renderHook(() => useChange('CHG-001'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.change_id).toBe('CHG-001');
    });

    it('should not fetch when changeId is empty', async () => {
      const { result } = renderHook(() => useChange(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(result.current.data).toBeUndefined();
    });

    it('should handle 404 error for non-existent change', async () => {
      const { result } = renderHook(() => useChange('not-found'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useChangeStats', () => {
    it('should fetch change statistics', async () => {
      const { result } = renderHook(() => useChangeStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockChangeStats);
      expect(result.current.data?.total).toBe(100);
      expect(result.current.data?.draft).toBe(10);
    });

    it('should fetch stats with site filter', async () => {
      const { result } = renderHook(() => useChangeStats('site-001'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toBeDefined();
    });
  });

  describe('usePendingCabApproval', () => {
    it('should fetch changes pending CAB approval', async () => {
      const { result } = renderHook(() => usePendingCabApproval(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.every((c) => c.status === ChangeStatus.CAB_REVIEW)).toBe(true);
    });
  });

  describe('useScheduledChanges', () => {
    it('should fetch scheduled changes within date range', async () => {
      const { result } = renderHook(
        () => useScheduledChanges('2024-01-01', '2024-01-31'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0].status).toBe(ChangeStatus.SCHEDULED);
    });

    it('should not fetch when dates are missing', async () => {
      const { result } = renderHook(() => useScheduledChanges('', ''), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('useEmergencyChanges', () => {
    it('should fetch emergency changes', async () => {
      const { result } = renderHook(() => useEmergencyChanges(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0].type).toBe(ChangeType.EMERGENCY);
    });
  });

  describe('useMyChangeRequests', () => {
    it('should fetch user change requests', async () => {
      const { result } = renderHook(() => useMyChangeRequests(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch with pagination params', async () => {
      const { result } = renderHook(() => useMyChangeRequests(1, 20), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toBeDefined();
    });
  });

  // ============================================
  // Mutation Hooks Tests
  // ============================================

  describe('useCreateChange', () => {
    it('should create a new change request', async () => {
      const { result } = renderHook(() => useCreateChange(), {
        wrapper: createWrapper(),
      });

      const newChange = {
        type: ChangeType.NORMAL,
        title: 'New Change Request',
        description: 'Test description',
        priority: Priority.MEDIUM,
        impact: Impact.MEDIUM,
        risk: RiskLevel.LOW,
        risk_assessment: 'Low risk',
        implementation_plan: 'Deploy changes',
        rollback_plan: 'Revert to previous version',
        schedule: {
          planned_start: '2024-02-01T10:00:00Z',
          planned_end: '2024-02-01T12:00:00Z',
        },
        affected_services: ['service-001'],
        site_id: 'site-001',
        reason_for_change: 'Improvement',
      };

      result.current.mutate(newChange);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.title).toBe('New Change Request');
      expect(result.current.data?.status).toBe(ChangeStatus.DRAFT);
    });

    it('should handle validation error', async () => {
      server.use(
        http.post(`${BASE_URL}/v2/changes`, () => {
          return HttpResponse.json(
            { success: false, message: 'Validation failed' },
            { status: 400 }
          );
        })
      );

      const { result } = renderHook(() => useCreateChange(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        type: ChangeType.NORMAL,
        title: '',
        description: '',
        priority: Priority.LOW,
        impact: Impact.LOW,
        risk: RiskLevel.LOW,
        risk_assessment: '',
        implementation_plan: '',
        rollback_plan: '',
        schedule: { planned_start: '', planned_end: '' },
        affected_services: [],
        site_id: '',
        reason_for_change: '',
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useUpdateChange', () => {
    it('should update an existing change', async () => {
      const { result } = renderHook(() => useUpdateChange(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        changeId: 'CHG-001',
        data: { title: 'Updated Title' },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.change_id).toBe('CHG-001');
    });
  });

  describe('useSubmitChangeForApproval', () => {
    it('should submit change for approval', async () => {
      const { result } = renderHook(() => useSubmitChangeForApproval(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('CHG-001');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.status).toBe(ChangeStatus.SUBMITTED);
    });
  });

  describe('useAddCabApproval', () => {
    it('should approve change via CAB', async () => {
      const { result } = renderHook(() => useAddCabApproval(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        changeId: 'CHG-001',
        decision: ApprovalStatus.APPROVED,
        comments: 'Looks good',
        role: 'CAB Member',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.status).toBe(ChangeStatus.APPROVED);
      expect(result.current.data?.approval.cab_status).toBe(ApprovalStatus.APPROVED);
    });

    it('should reject change via CAB', async () => {
      const { result } = renderHook(() => useAddCabApproval(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        changeId: 'CHG-001',
        decision: ApprovalStatus.REJECTED,
        comments: 'Needs more details',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.status).toBe(ChangeStatus.REJECTED);
    });
  });

  describe('useScheduleChange', () => {
    it('should schedule a change', async () => {
      const { result } = renderHook(() => useScheduleChange(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        changeId: 'CHG-001',
        schedule: {
          planned_start: '2024-02-15T08:00:00Z',
          planned_end: '2024-02-15T10:00:00Z',
          maintenance_window: 'weekend',
        },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.status).toBe(ChangeStatus.SCHEDULED);
      expect(result.current.data?.schedule.planned_start).toBe('2024-02-15T08:00:00Z');
    });
  });

  describe('useStartImplementation', () => {
    it('should start change implementation', async () => {
      const { result } = renderHook(() => useStartImplementation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('CHG-001');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.status).toBe(ChangeStatus.IMPLEMENTING);
    });
  });

  describe('useCompleteChange', () => {
    it('should complete change successfully', async () => {
      const { result } = renderHook(() => useCompleteChange(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        changeId: 'CHG-001',
        success: true,
        notes: 'Deployment successful',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.status).toBe(ChangeStatus.COMPLETED);
    });

    it('should mark change as failed', async () => {
      const { result } = renderHook(() => useCompleteChange(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        changeId: 'CHG-001',
        success: false,
        notes: 'Rollback performed due to errors',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.status).toBe(ChangeStatus.FAILED);
    });
  });

  describe('useCancelChange', () => {
    it('should cancel a change request', async () => {
      const { result } = renderHook(() => useCancelChange(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        changeId: 'CHG-001',
        reason: 'No longer needed',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.status).toBe(ChangeStatus.CANCELLED);
    });
  });

  // ============================================
  // Edge Cases & Error Handling
  // ============================================

  describe('Edge Cases', () => {
    it('should handle network timeout', async () => {
      server.use(
        http.get(`${BASE_URL}/v2/changes`, async () => {
          await new Promise((resolve) => setTimeout(resolve, 10000));
          return HttpResponse.json({ data: [] });
        })
      );

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            gcTime: 0,
          },
        },
      });

      const TimeoutWrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);
      TimeoutWrapper.displayName = 'TimeoutWrapper';

      const { result } = renderHook(() => useChanges(), { wrapper: TimeoutWrapper });

      // Query should be in loading state
      expect(result.current.isLoading).toBe(true);
    });

    it('should handle empty response', async () => {
      server.use(
        http.get(`${BASE_URL}/v2/changes`, () => {
          return HttpResponse.json({
            success: true,
            data: [],
            pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
          });
        })
      );

      const { result } = renderHook(() => useChanges(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.data).toHaveLength(0);
    });

    it('should handle malformed response gracefully', async () => {
      server.use(
        http.get(`${BASE_URL}/v2/changes/:changeId`, () => {
          return HttpResponse.json({ unexpected: 'format' });
        })
      );

      const { result } = renderHook(() => useChange('CHG-001'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isFetched).toBe(true));
      // Should not crash, data.change will be undefined
      expect(result.current.data).toBeUndefined();
    });
  });

  // ============================================
  // Query Key & Cache Invalidation Tests
  // ============================================

  describe('Cache Invalidation', () => {
    it('should invalidate queries after mutation', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false, gcTime: 0 },
          mutations: { retry: false },
        },
      });

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const CacheWrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);
      CacheWrapper.displayName = 'CacheWrapper';

      const { result } = renderHook(() => useCreateChange(), { wrapper: CacheWrapper });

      result.current.mutate({
        type: ChangeType.NORMAL,
        title: 'Test',
        description: 'Test',
        priority: Priority.LOW,
        impact: Impact.LOW,
        risk: RiskLevel.LOW,
        risk_assessment: 'Low',
        implementation_plan: 'Plan',
        rollback_plan: 'Rollback',
        schedule: { planned_start: '2024-01-01', planned_end: '2024-01-02' },
        affected_services: [],
        site_id: 'site-001',
        reason_for_change: 'Test',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['changes'] });
    });
  });
});
