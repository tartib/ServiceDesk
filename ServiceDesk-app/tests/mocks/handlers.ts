import { http, HttpResponse } from 'msw';
import {
  ChangeStatus,
  ChangeType,
  Priority,
  Impact,
  RiskLevel,
  ApprovalStatus,
  IChange,
  IChangeStats,
} from '@/types/itsm';

const BASE_URL = 'http://localhost:5000/api';

// Mock data factory
export const createMockChange = (overrides: Partial<IChange> = {}): IChange => ({
  _id: '507f1f77bcf86cd799439011',
  change_id: 'CHG-001',
  type: ChangeType.NORMAL,
  title: 'Test Change Request',
  description: 'Test description for change request',
  status: ChangeStatus.DRAFT,
  priority: Priority.MEDIUM,
  impact: Impact.MEDIUM,
  risk: RiskLevel.LOW,
  risk_assessment: 'Low risk assessment',
  requested_by: {
    id: 'user-001',
    name: 'John Doe',
    email: 'john@example.com',
    department: 'IT',
  },
  owner: {
    id: 'owner-001',
    name: 'Jane Smith',
    email: 'jane@example.com',
  },
  implementation_plan: 'Step 1: Backup, Step 2: Deploy',
  rollback_plan: 'Restore from backup',
  test_plan: 'Run integration tests',
  communication_plan: 'Notify stakeholders',
  cab_required: true,
  approval: {
    cab_status: ApprovalStatus.PENDING,
    required_approvers: 2,
    current_approvers: 0,
    members: [],
  },
  schedule: {
    planned_start: '2024-01-15T10:00:00Z',
    planned_end: '2024-01-15T12:00:00Z',
  },
  affected_services: ['service-001'],
  affected_cis: ['ci-001'],
  timeline: [],
  attachments: [],
  site_id: 'site-001',
  tags: ['infrastructure'],
  reason_for_change: 'Performance improvement',
  business_justification: 'Reduce latency by 50%',
  created_at: '2024-01-10T08:00:00Z',
  updated_at: '2024-01-10T08:00:00Z',
  ...overrides,
});

export const mockChangeStats: IChangeStats = {
  total: 100,
  draft: 10,
  pendingApproval: 15,
  approved: 20,
  scheduled: 25,
  implementing: 5,
  completed: 20,
  failed: 5,
};

export const handlers = [
  // IMPORTANT: Specific routes MUST come before parameterized routes
  
  // GET /v2/changes/stats - Get change stats
  http.get(`${BASE_URL}/v2/changes/stats`, () => {
    return HttpResponse.json(mockChangeStats);
  }),

  // GET /v2/changes/pending-cab - Get pending CAB approval
  http.get(`${BASE_URL}/v2/changes/pending-cab`, () => {
    return HttpResponse.json([
      createMockChange({ status: ChangeStatus.CAB_REVIEW, change_id: 'CHG-CAB-001' }),
      createMockChange({ status: ChangeStatus.CAB_REVIEW, change_id: 'CHG-CAB-002' }),
    ]);
  }),

  // GET /v2/changes/scheduled - Get scheduled changes
  http.get(`${BASE_URL}/v2/changes/scheduled`, ({ request }) => {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');

    if (!startDate || !endDate) {
      return HttpResponse.json(
        { success: false, message: 'start_date and end_date required' },
        { status: 400 }
      );
    }

    return HttpResponse.json([
      createMockChange({ status: ChangeStatus.SCHEDULED, change_id: 'CHG-SCHED-001' }),
    ]);
  }),

  // GET /v2/changes/emergency - Get emergency changes
  http.get(`${BASE_URL}/v2/changes/emergency`, () => {
    return HttpResponse.json([
      createMockChange({ 
        type: ChangeType.EMERGENCY, 
        status: ChangeStatus.IMPLEMENTING,
        change_id: 'CHG-EMRG-001' 
      }),
    ]);
  }),

  // GET /v2/changes/my-requests - Get user's change requests
  http.get(`${BASE_URL}/v2/changes/my-requests`, () => {
    return HttpResponse.json({
      success: true,
      data: [createMockChange({ change_id: 'CHG-MY-001' })],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    });
  }),

  // GET /v2/changes - List changes (must come before :changeId)
  http.get(`${BASE_URL}/v2/changes`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    let changes = [
      createMockChange({ change_id: 'CHG-001', status: ChangeStatus.DRAFT }),
      createMockChange({ change_id: 'CHG-002', status: ChangeStatus.APPROVED }),
      createMockChange({ change_id: 'CHG-003', status: ChangeStatus.IMPLEMENTING }),
    ];

    if (status) {
      const statusFilter = status.split(',');
      changes = changes.filter((c) => statusFilter.includes(c.status));
    }

    return HttpResponse.json({
      success: true,
      data: changes,
      pagination: {
        page,
        limit,
        total: changes.length,
        totalPages: Math.ceil(changes.length / limit),
      },
    });
  }),

  // GET /v2/changes/:changeId - Get single change (parameterized route LAST)
  http.get(`${BASE_URL}/v2/changes/:changeId`, ({ params }) => {
    const { changeId } = params;
    
    if (changeId === 'not-found') {
      return HttpResponse.json(
        { success: false, message: 'Change not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      change: createMockChange({ change_id: changeId as string }),
    });
  }),

  // POST /v2/changes - Create change
  http.post(`${BASE_URL}/v2/changes`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    
    if (!body.title) {
      return HttpResponse.json(
        { success: false, message: 'Title is required' },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      success: true,
      change: createMockChange({
        change_id: 'CHG-NEW-001',
        title: body.title as string,
        status: ChangeStatus.DRAFT,
      }),
    });
  }),

  // PATCH /v2/changes/:changeId - Update change
  http.patch(`${BASE_URL}/v2/changes/:changeId`, async ({ params, request }) => {
    const { changeId } = params;
    const body = await request.json() as Record<string, unknown>;

    return HttpResponse.json({
      success: true,
      change: createMockChange({
        change_id: changeId as string,
        ...body,
      }),
    });
  }),

  // POST /v2/changes/:changeId/submit - Submit for approval
  http.post(`${BASE_URL}/v2/changes/:changeId/submit`, ({ params }) => {
    const { changeId } = params;

    return HttpResponse.json({
      success: true,
      change: createMockChange({
        change_id: changeId as string,
        status: ChangeStatus.SUBMITTED,
      }),
    });
  }),

  // POST /v2/changes/:changeId/cab/approve - CAB approval
  http.post(`${BASE_URL}/v2/changes/:changeId/cab/approve`, async ({ params, request }) => {
    const { changeId } = params;
    const body = await request.json() as { decision: ApprovalStatus };

    const newStatus = body.decision === ApprovalStatus.APPROVED 
      ? ChangeStatus.APPROVED 
      : ChangeStatus.REJECTED;

    return HttpResponse.json({
      success: true,
      change: createMockChange({
        change_id: changeId as string,
        status: newStatus,
        approval: {
          cab_status: body.decision,
          required_approvers: 2,
          current_approvers: body.decision === ApprovalStatus.APPROVED ? 2 : 0,
          members: [],
        },
      }),
    });
  }),

  // POST /v2/changes/:changeId/schedule - Schedule change
  http.post(`${BASE_URL}/v2/changes/:changeId/schedule`, async ({ params, request }) => {
    const { changeId } = params;
    const body = await request.json() as { planned_start: string; planned_end: string };

    return HttpResponse.json({
      success: true,
      change: createMockChange({
        change_id: changeId as string,
        status: ChangeStatus.SCHEDULED,
        schedule: {
          planned_start: body.planned_start,
          planned_end: body.planned_end,
        },
      }),
    });
  }),

  // POST /v2/changes/:changeId/implement - Start implementation
  http.post(`${BASE_URL}/v2/changes/:changeId/implement`, ({ params }) => {
    const { changeId } = params;

    return HttpResponse.json({
      success: true,
      change: createMockChange({
        change_id: changeId as string,
        status: ChangeStatus.IMPLEMENTING,
      }),
    });
  }),

  // POST /v2/changes/:changeId/complete - Complete change
  http.post(`${BASE_URL}/v2/changes/:changeId/complete`, async ({ params, request }) => {
    const { changeId } = params;
    const body = await request.json() as { success: boolean };

    return HttpResponse.json({
      success: true,
      change: createMockChange({
        change_id: changeId as string,
        status: body.success ? ChangeStatus.COMPLETED : ChangeStatus.FAILED,
      }),
    });
  }),

  // POST /v2/changes/:changeId/cancel - Cancel change
  http.post(`${BASE_URL}/v2/changes/:changeId/cancel`, ({ params }) => {
    const { changeId } = params;

    return HttpResponse.json({
      success: true,
      change: createMockChange({
        change_id: changeId as string,
        status: ChangeStatus.CANCELLED,
      }),
    });
  }),
];
