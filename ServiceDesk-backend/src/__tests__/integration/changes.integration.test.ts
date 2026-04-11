/// <reference types="jest" />
import request from 'supertest';
import app from '../../app';
import Change from '../../core/entities/Change';
import Counter from '../../core/entities/Counter';
import { setupTestDB } from '../helpers/testSetup';
import { seedUser, TestUser } from '../helpers/authHelper';

/**
 * Integration Tests for Changes API
 * 
 * These tests cover the full change management lifecycle including:
 * - CRUD operations
 * - Status transitions
 * - CAB approval workflow
 * - Authorization checks
 */

setupTestDB({ dropAfterEach: false });

let prepUser: TestUser;
let supervisorUser: TestUser;
let managerUser: TestUser;

beforeAll(async () => {
  prepUser = await seedUser({ email: 'prep-chg@test.com', role: 'prep' });
  supervisorUser = await seedUser({ email: 'sup-chg@test.com', role: 'supervisor' });
  managerUser = await seedUser({ email: 'mgr-chg@test.com', role: 'manager' });

  // Initialize counter for change IDs (using correct schema)
  const currentYear = new Date().getFullYear();
  await Counter.findOneAndUpdate(
    { _id: 'CHG' },
    { $setOnInsert: { sequence: 0, year: currentYear } },
    { upsert: true }
  );
});

beforeEach(async () => {
  // Clean up changes between tests
  await Change.deleteMany({});
});

// Helper to create a valid change request payload
const createChangePayload = (overrides = {}) => ({
  type: 'normal',
  title: 'Test Change Request',
  description: 'Test description for integration test',
  priority: 'medium',
  impact: 'medium',
  risk: 'low',
  risk_assessment: 'Low risk - standard deployment',
  implementation_plan: 'Step 1: Backup, Step 2: Deploy, Step 3: Verify',
  rollback_plan: 'Restore from backup',
  test_plan: 'Run integration tests',
  schedule: {
    planned_start: '2024-02-01T10:00:00Z',
    planned_end: '2024-02-01T12:00:00Z',
  },
  affected_services: ['service-001'],
  site_id: 'site-001',
  reason_for_change: 'Performance improvement',
  ...overrides,
});

describe('Changes API - Integration Tests', () => {
  // ============================================
  // CREATE CHANGE
  // ============================================

  describe('POST /api/v2/itsm/changes - Create Change', () => {
    it('should create a change request as prep user', async () => {
      const res = await request(app)
        .post('/api/v2/itsm/changes')
        .set('Authorization', `Bearer ${prepUser.token}`)
        .send(createChangePayload());

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.change).toBeDefined();
      expect(res.body.data.change.change_id).toMatch(/^CHG-/);
      expect(res.body.data.change.status).toBe('draft');
      expect(res.body.data.change.title).toBe('Test Change Request');
    });

    it('should create emergency change', async () => {
      const res = await request(app)
        .post('/api/v2/itsm/changes')
        .set('Authorization', `Bearer ${prepUser.token}`)
        .send(createChangePayload({ type: 'emergency', risk: 'high' }));

      expect(res.status).toBe(201);
      expect(res.body.data.change.type).toBe('emergency');
      expect(res.body.data.change.cab_required).toBe(false); // Emergency bypasses CAB
    });

    it('should create standard change without CAB requirement', async () => {
      const res = await request(app)
        .post('/api/v2/itsm/changes')
        .set('Authorization', `Bearer ${prepUser.token}`)
        .send(createChangePayload({ type: 'standard' }));

      expect(res.status).toBe(201);
      expect(res.body.data.change.type).toBe('standard');
      expect(res.body.data.change.cab_required).toBe(false);
    });

    it('should require CAB for normal high-risk change', async () => {
      const res = await request(app)
        .post('/api/v2/itsm/changes')
        .set('Authorization', `Bearer ${prepUser.token}`)
        .send(createChangePayload({ risk: 'high' }));

      expect(res.status).toBe(201);
      expect(res.body.data.change.cab_required).toBe(true);
    });

    it('should reject request without authentication', async () => {
      const res = await request(app)
        .post('/api/v2/itsm/changes')
        .send(createChangePayload());

      expect(res.status).toBe(401);
    });

    it('should reject invalid change type', async () => {
      const res = await request(app)
        .post('/api/v2/itsm/changes')
        .set('Authorization', `Bearer ${prepUser.token}`)
        .send(createChangePayload({ type: 'invalid_type' }));

      // Invalid enum value causes Mongoose validation error → 500
      expect(res.status).toBe(500);
    });
  });

  // ============================================
  // GET CHANGES
  // ============================================

  describe('GET /api/v2/itsm/changes - List Changes', () => {
    beforeEach(async () => {
      // Create test changes
      await request(app)
        .post('/api/v2/itsm/changes')
        .set('Authorization', `Bearer ${prepUser.token}`)
        .send(createChangePayload({ title: 'Change 1' }));

      await request(app)
        .post('/api/v2/itsm/changes')
        .set('Authorization', `Bearer ${prepUser.token}`)
        .send(createChangePayload({ title: 'Change 2', type: 'emergency' }));

      await request(app)
        .post('/api/v2/itsm/changes')
        .set('Authorization', `Bearer ${prepUser.token}`)
        .send(createChangePayload({ title: 'Change 3', priority: 'high' }));
    });

    it('should list changes for supervisor', async () => {
      const res = await request(app)
        .get('/api/v2/itsm/changes')
        .set('Authorization', `Bearer ${supervisorUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(3);
    });

    it('should list changes for manager', async () => {
      const res = await request(app)
        .get('/api/v2/itsm/changes')
        .set('Authorization', `Bearer ${managerUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3);
    });

    it('should deny access for prep user', async () => {
      const res = await request(app)
        .get('/api/v2/itsm/changes')
        .set('Authorization', `Bearer ${prepUser.token}`);

      expect(res.status).toBe(403);
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get('/api/v2/itsm/changes?status=draft')
        .set('Authorization', `Bearer ${managerUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((c: any) => c.status === 'draft')).toBe(true);
    });

    it('should filter by type', async () => {
      const res = await request(app)
        .get('/api/v2/itsm/changes?type=emergency')
        .set('Authorization', `Bearer ${managerUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((c: any) => c.type === 'emergency')).toBe(true);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/v2/itsm/changes?page=1&limit=2')
        .set('Authorization', `Bearer ${managerUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(2);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(2);
    });
  });

  // ============================================
  // GET SINGLE CHANGE
  // ============================================

  describe('GET /api/v2/itsm/changes/:id - Get Single Change', () => {
    let changeId: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/v2/itsm/changes')
        .set('Authorization', `Bearer ${prepUser.token}`)
        .send(createChangePayload());
      changeId = res.body.data.change.change_id;
    });

    it('should get change by ID', async () => {
      const res = await request(app)
        .get(`/api/v2/itsm/changes/${changeId}`)
        .set('Authorization', `Bearer ${prepUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.change.change_id).toBe(changeId);
    });

    it('should return 404 for non-existent change', async () => {
      const res = await request(app)
        .get('/api/v2/itsm/changes/CHG-99999')
        .set('Authorization', `Bearer ${prepUser.token}`);

      expect(res.status).toBe(404);
    });
  });

  // ============================================
  // UPDATE CHANGE
  // ============================================

  describe('PATCH /api/v2/itsm/changes/:id - Update Change', () => {
    let changeId: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/v2/itsm/changes')
        .set('Authorization', `Bearer ${prepUser.token}`)
        .send(createChangePayload());
      changeId = res.body.data.change.change_id;
    });

    it('should update draft change as supervisor', async () => {
      const res = await request(app)
        .patch(`/api/v2/itsm/changes/${changeId}`)
        .set('Authorization', `Bearer ${supervisorUser.token}`)
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(200);
      expect(res.body.data.change.title).toBe('Updated Title');
    });

    it('should deny update for prep user', async () => {
      const res = await request(app)
        .patch(`/api/v2/itsm/changes/${changeId}`)
        .set('Authorization', `Bearer ${prepUser.token}`)
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(403);
    });

    it('should update multiple fields', async () => {
      const res = await request(app)
        .patch(`/api/v2/itsm/changes/${changeId}`)
        .set('Authorization', `Bearer ${managerUser.token}`)
        .send({
          title: 'New Title',
          description: 'New Description',
          priority: 'high',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.change.title).toBe('New Title');
      expect(res.body.data.change.description).toBe('New Description');
      expect(res.body.data.change.priority).toBe('high');
    });
  });

  // ============================================
  // SUBMIT FOR APPROVAL
  // ============================================

  describe('POST /api/v2/itsm/changes/:id/submit - Submit for Approval', () => {
    let changeId: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/v2/itsm/changes')
        .set('Authorization', `Bearer ${prepUser.token}`)
        .send(createChangePayload());
      changeId = res.body.data.change.change_id;
    });

    it('should submit change for approval', async () => {
      const res = await request(app)
        .post(`/api/v2/itsm/changes/${changeId}/submit`)
        .set('Authorization', `Bearer ${prepUser.token}`);

      expect(res.status).toBe(200);
      // Low risk normal change doesn't require CAB
      expect(res.body.data.change.status).toBe('approved');
    });

    it('should submit high-risk change to CAB review', async () => {
      // Create high-risk change
      const createRes = await request(app)
        .post('/api/v2/itsm/changes')
        .set('Authorization', `Bearer ${prepUser.token}`)
        .send(createChangePayload({ risk: 'high' }));

      const highRiskChangeId = createRes.body.data.change.change_id;

      const res = await request(app)
        .post(`/api/v2/itsm/changes/${highRiskChangeId}/submit`)
        .set('Authorization', `Bearer ${prepUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.change.status).toBe('cab_review');
    });

    it('should reject submitting non-draft change', async () => {
      // First submit
      await request(app)
        .post(`/api/v2/itsm/changes/${changeId}/submit`)
        .set('Authorization', `Bearer ${prepUser.token}`);

      // Try to submit again
      const res = await request(app)
        .post(`/api/v2/itsm/changes/${changeId}/submit`)
        .set('Authorization', `Bearer ${prepUser.token}`);

      expect(res.status).toBe(400);
    });
  });

  // ============================================
  // CAB APPROVAL
  // ============================================

  describe('POST /api/v2/itsm/changes/:id/cab/approve - CAB Approval', () => {
    let changeId: string;

    beforeEach(async () => {
      // Create high-risk change that requires CAB
      const createRes = await request(app)
        .post('/api/v2/itsm/changes')
        .set('Authorization', `Bearer ${prepUser.token}`)
        .send(createChangePayload({ risk: 'high' }));

      changeId = createRes.body.data.change.change_id;

      // Submit for approval
      await request(app)
        .post(`/api/v2/itsm/changes/${changeId}/submit`)
        .set('Authorization', `Bearer ${prepUser.token}`);
    });

    it('should allow manager to approve change', async () => {
      const res = await request(app)
        .post(`/api/v2/itsm/changes/${changeId}/cab/approve`)
        .set('Authorization', `Bearer ${managerUser.token}`)
        .send({
          decision: 'approved',
          comments: 'Looks good',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.change.approval.members).toBeDefined();
    });

    it('should allow manager to reject change', async () => {
      const res = await request(app)
        .post(`/api/v2/itsm/changes/${changeId}/cab/approve`)
        .set('Authorization', `Bearer ${managerUser.token}`)
        .send({
          decision: 'rejected',
          comments: 'Needs more details',
        });

      expect(res.status).toBe(200);
    });

    it('should deny CAB approval for supervisor', async () => {
      const res = await request(app)
        .post(`/api/v2/itsm/changes/${changeId}/cab/approve`)
        .set('Authorization', `Bearer ${supervisorUser.token}`)
        .send({
          decision: 'approved',
          comments: 'Approved',
        });

      expect(res.status).toBe(403);
    });

    it('should deny CAB approval for prep user', async () => {
      const res = await request(app)
        .post(`/api/v2/itsm/changes/${changeId}/cab/approve`)
        .set('Authorization', `Bearer ${prepUser.token}`)
        .send({
          decision: 'approved',
          comments: 'Approved',
        });

      expect(res.status).toBe(403);
    });
  });

  // ============================================
  // SCHEDULE CHANGE
  // ============================================

  describe('POST /api/v2/itsm/changes/:id/schedule - Schedule Change', () => {
    let changeId: string;

    beforeEach(async () => {
      // Create and approve a change
      const createRes = await request(app)
        .post('/api/v2/itsm/changes')
        .set('Authorization', `Bearer ${prepUser.token}`)
        .send(createChangePayload());

      changeId = createRes.body.data.change.change_id;

      await request(app)
        .post(`/api/v2/itsm/changes/${changeId}/submit`)
        .set('Authorization', `Bearer ${prepUser.token}`);
    });

    it('should schedule approved change', async () => {
      const res = await request(app)
        .post(`/api/v2/itsm/changes/${changeId}/schedule`)
        .set('Authorization', `Bearer ${managerUser.token}`)
        .send({
          planned_start: '2024-03-01T08:00:00Z',
          planned_end: '2024-03-01T10:00:00Z',
          maintenance_window: 'weekend',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.change.status).toBe('scheduled');
    });

    it('should deny scheduling for supervisor', async () => {
      const res = await request(app)
        .post(`/api/v2/itsm/changes/${changeId}/schedule`)
        .set('Authorization', `Bearer ${supervisorUser.token}`)
        .send({
          planned_start: '2024-03-01T08:00:00Z',
          planned_end: '2024-03-01T10:00:00Z',
        });

      expect(res.status).toBe(403);
    });
  });

  // ============================================
  // IMPLEMENT CHANGE
  // ============================================

  describe('POST /api/v2/itsm/changes/:id/implement - Start Implementation', () => {
    let changeId: string;

    beforeEach(async () => {
      // Create, approve, and schedule a change
      const createRes = await request(app)
        .post('/api/v2/itsm/changes')
        .set('Authorization', `Bearer ${prepUser.token}`)
        .send(createChangePayload());

      changeId = createRes.body.data.change.change_id;

      await request(app)
        .post(`/api/v2/itsm/changes/${changeId}/submit`)
        .set('Authorization', `Bearer ${prepUser.token}`);

      await request(app)
        .post(`/api/v2/itsm/changes/${changeId}/schedule`)
        .set('Authorization', `Bearer ${managerUser.token}`)
        .send({
          planned_start: '2024-03-01T08:00:00Z',
          planned_end: '2024-03-01T10:00:00Z',
        });
    });

    it('should start implementation as supervisor', async () => {
      const res = await request(app)
        .post(`/api/v2/itsm/changes/${changeId}/implement`)
        .set('Authorization', `Bearer ${supervisorUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.change.status).toBe('implementing');
    });

    it('should start implementation as manager', async () => {
      const res = await request(app)
        .post(`/api/v2/itsm/changes/${changeId}/implement`)
        .set('Authorization', `Bearer ${managerUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.change.status).toBe('implementing');
    });

    it('should deny implementation for prep user', async () => {
      const res = await request(app)
        .post(`/api/v2/itsm/changes/${changeId}/implement`)
        .set('Authorization', `Bearer ${prepUser.token}`);

      expect(res.status).toBe(403);
    });
  });

  // ============================================
  // COMPLETE CHANGE
  // ============================================

  describe('POST /api/v2/itsm/changes/:id/complete - Complete Change', () => {
    let changeId: string;

    beforeEach(async () => {
      // Create full lifecycle change
      const createRes = await request(app)
        .post('/api/v2/itsm/changes')
        .set('Authorization', `Bearer ${prepUser.token}`)
        .send(createChangePayload());

      changeId = createRes.body.data.change.change_id;

      await request(app)
        .post(`/api/v2/itsm/changes/${changeId}/submit`)
        .set('Authorization', `Bearer ${prepUser.token}`);

      await request(app)
        .post(`/api/v2/itsm/changes/${changeId}/schedule`)
        .set('Authorization', `Bearer ${managerUser.token}`)
        .send({
          planned_start: '2024-03-01T08:00:00Z',
          planned_end: '2024-03-01T10:00:00Z',
        });

      await request(app)
        .post(`/api/v2/itsm/changes/${changeId}/implement`)
        .set('Authorization', `Bearer ${supervisorUser.token}`);
    });

    it('should complete change successfully', async () => {
      const res = await request(app)
        .post(`/api/v2/itsm/changes/${changeId}/complete`)
        .set('Authorization', `Bearer ${supervisorUser.token}`)
        .send({
          success: true,
          notes: 'Deployment completed successfully',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.change.status).toBe('completed');
    });

    it('should mark change as failed', async () => {
      const res = await request(app)
        .post(`/api/v2/itsm/changes/${changeId}/complete`)
        .set('Authorization', `Bearer ${supervisorUser.token}`)
        .send({
          success: false,
          notes: 'Rollback performed due to errors',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.change.status).toBe('failed');
    });
  });

  // ============================================
  // CANCEL CHANGE
  // ============================================

  describe('POST /api/v2/itsm/changes/:id/cancel - Cancel Change', () => {
    let changeId: string;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/api/v2/itsm/changes')
        .set('Authorization', `Bearer ${prepUser.token}`)
        .send(createChangePayload());

      changeId = createRes.body.data.change.change_id;
    });

    it('should cancel draft change', async () => {
      const res = await request(app)
        .post(`/api/v2/itsm/changes/${changeId}/cancel`)
        .set('Authorization', `Bearer ${managerUser.token}`)
        .send({ reason: 'No longer needed' });

      expect(res.status).toBe(200);
      expect(res.body.data.change.status).toBe('cancelled');
    });

    it('should deny cancellation for supervisor', async () => {
      const res = await request(app)
        .post(`/api/v2/itsm/changes/${changeId}/cancel`)
        .set('Authorization', `Bearer ${supervisorUser.token}`)
        .send({ reason: 'No longer needed' });

      expect(res.status).toBe(403);
    });
  });

  // ============================================
  // STATISTICS
  // ============================================

  describe('GET /api/v2/itsm/changes/stats - Change Statistics', () => {
    beforeEach(async () => {
      // Create various changes
      await request(app)
        .post('/api/v2/itsm/changes')
        .set('Authorization', `Bearer ${prepUser.token}`)
        .send(createChangePayload({ title: 'Draft Change' }));

      const approvedRes = await request(app)
        .post('/api/v2/itsm/changes')
        .set('Authorization', `Bearer ${prepUser.token}`)
        .send(createChangePayload({ title: 'Approved Change' }));

      await request(app)
        .post(`/api/v2/itsm/changes/${approvedRes.body.data.change.change_id}/submit`)
        .set('Authorization', `Bearer ${prepUser.token}`);
    });

    it('should return change statistics', async () => {
      const res = await request(app)
        .get('/api/v2/itsm/changes/stats')
        .set('Authorization', `Bearer ${managerUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });

  // ============================================
  // MY REQUESTS
  // ============================================

  describe('GET /api/v2/itsm/changes/my-requests - User Change Requests', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/v2/itsm/changes')
        .set('Authorization', `Bearer ${prepUser.token}`)
        .send(createChangePayload({ title: 'My Change 1' }));

      await request(app)
        .post('/api/v2/itsm/changes')
        .set('Authorization', `Bearer ${prepUser.token}`)
        .send(createChangePayload({ title: 'My Change 2' }));
    });

    it('should return user change requests', async () => {
      const res = await request(app)
        .get('/api/v2/itsm/changes/my-requests')
        .set('Authorization', `Bearer ${prepUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ============================================
  // EMERGENCY CHANGES
  // ============================================

  describe('GET /api/v2/itsm/changes/emergency - Emergency Changes', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/v2/itsm/changes')
        .set('Authorization', `Bearer ${prepUser.token}`)
        .send(createChangePayload({ type: 'emergency', title: 'Emergency 1' }));

      await request(app)
        .post('/api/v2/itsm/changes')
        .set('Authorization', `Bearer ${prepUser.token}`)
        .send(createChangePayload({ type: 'normal', title: 'Normal Change' }));
    });

    it('should return only emergency changes', async () => {
      const res = await request(app)
        .get('/api/v2/itsm/changes/emergency')
        .set('Authorization', `Bearer ${supervisorUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((c: any) => c.type === 'emergency')).toBe(true);
    });
  });
});
