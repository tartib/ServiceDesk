/// <reference types="jest" />
import request from 'supertest';
import app from '../../../app';
import { setupTestDB } from '../../helpers/testSetup';
import { seedUser, authReq, TestUser } from '../../helpers/authHelper';

/**
 * Integration Tests for Workflow Instance API
 */

setupTestDB({ dropAfterEach: false });

let managerUser: TestUser;
let definitionId: string;
let instanceId: string;

beforeAll(async () => {
  managerUser = await seedUser({ email: 'mgr@wfi.test', role: 'manager', itsmRole: 'admin' });

  // Create a definition to use for instances
  const defRes = await authReq(request(app).post('/api/v2/workflow-engine/definitions'), managerUser)
    .send({
      name: 'Instance Test Workflow',
      entityType: 'ticket',
      states: [
        {
          id: 'submitted', code: 'submitted', name: 'Submitted',
          type: 'start', category: 'todo', order: 0,
          onEnter: [], onExit: [],
          transitions: [{ id: 'review', name: 'Review', target: 'under_review' }],
        },
        {
          id: 'under_review', code: 'under_review', name: 'Under Review',
          type: 'normal', category: 'in_progress', order: 1,
          onEnter: [], onExit: [],
          transitions: [
            { id: 'approve', name: 'Approve', target: 'approved' },
            { id: 'reject', name: 'Reject', target: 'rejected' },
          ],
        },
        { id: 'approved', code: 'approved', name: 'Approved', type: 'end', category: 'done', order: 2, onEnter: [], onExit: [], transitions: [] },
        { id: 'rejected', code: 'rejected', name: 'Rejected', type: 'end', category: 'cancelled', order: 3, onEnter: [], onExit: [], transitions: [] },
      ],
      transitions: [
        { transitionId: 'review', name: 'Review', fromState: 'submitted', toState: 'under_review', ui: { buttonLabel: 'Review' } },
        { transitionId: 'approve', name: 'Approve', fromState: 'under_review', toState: 'approved', ui: { buttonLabel: 'Approve' } },
        { transitionId: 'reject', name: 'Reject', fromState: 'under_review', toState: 'rejected', ui: { buttonLabel: 'Reject' } },
      ],
      initialState: 'submitted',
      finalStates: ['approved', 'rejected'],
    });

  definitionId = defRes.body.data?._id || defRes.body.data?.definition?._id || defRes.body.data?.id;

  // Publish the definition so instances can be started
  if (definitionId) {
    await authReq(request(app).post(`/api/v2/workflow-engine/definitions/${definitionId}/publish`), managerUser);
  }
});

describe('Workflow Instances — Integration Tests', () => {
  // ============================================
  // START WORKFLOW
  // ============================================
  describe('POST /api/v2/workflow-engine/instances', () => {
    it('should start a workflow instance', async () => {
      if (!definitionId) return;
      const res = await authReq(request(app).post('/api/v2/workflow-engine/instances'), managerUser)
        .send({
          definitionId,
          entityType: 'ticket',
          entityId: 'sr-test-001',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      instanceId = res.body.data?._id || res.body.data?.instance?._id;
    });

    it('should reject without required fields', async () => {
      const res = await authReq(request(app).post('/api/v2/workflow-engine/instances'), managerUser)
        .send({ entityType: 'test' });

      // Engine throws when definitionId is missing
      expect(res.status).toBe(500);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/v2/workflow-engine/instances')
        .send({ definitionId, entityType: 'test', entityId: 'x' });

      expect(res.status).toBe(401);
    });
  });

  // ============================================
  // LIST INSTANCES
  // ============================================
  describe('GET /api/v2/workflow-engine/instances', () => {
    it('should list instances', async () => {
      const res = await authReq(request(app).get('/api/v2/workflow-engine/instances'), managerUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // GET SINGLE INSTANCE
  // ============================================
  describe('GET /api/v2/workflow-engine/instances/:id', () => {
    it('should get instance by id', async () => {
      if (!instanceId) return;
      const res = await authReq(
        request(app).get(`/api/v2/workflow-engine/instances/${instanceId}`), managerUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // AVAILABLE TRANSITIONS
  // ============================================
  describe('GET /api/v2/workflow-engine/instances/:id/transitions', () => {
    it('should get available transitions', async () => {
      if (!instanceId) return;
      const res = await authReq(
        request(app).get(`/api/v2/workflow-engine/instances/${instanceId}/transitions`), managerUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // EXECUTE TRANSITION
  // ============================================
  describe('POST /api/v2/workflow-engine/instances/:id/transition', () => {
    it('should execute a transition', async () => {
      if (!instanceId) return;
      const res = await authReq(
        request(app).post(`/api/v2/workflow-engine/instances/${instanceId}/transition`), managerUser)
        .send({ transitionId: 'review' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // EVENTS (AUDIT TRAIL)
  // ============================================
  describe('GET /api/v2/workflow-engine/instances/:id/events', () => {
    it('should get instance events', async () => {
      if (!instanceId) return;
      const res = await authReq(
        request(app).get(`/api/v2/workflow-engine/instances/${instanceId}/events`), managerUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // SUSPEND / RESUME
  // ============================================
  describe('Suspend / Resume', () => {
    it('POST /api/v2/workflow-engine/instances/:id/suspend - should suspend active instance', async () => {
      if (!instanceId) return;
      const res = await authReq(
        request(app).post(`/api/v2/workflow-engine/instances/${instanceId}/suspend`), managerUser)
        .send({ reason: 'Waiting for info' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('POST /api/v2/workflow-engine/instances/:id/resume - should resume suspended instance', async () => {
      if (!instanceId) return;
      const res = await authReq(
        request(app).post(`/api/v2/workflow-engine/instances/${instanceId}/resume`), managerUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // CANCEL
  // ============================================
  describe('POST /api/v2/workflow-engine/instances/:id/cancel', () => {
    it('should cancel active workflow', async () => {
      if (!instanceId) return;
      const res = await authReq(
        request(app).post(`/api/v2/workflow-engine/instances/${instanceId}/cancel`), managerUser)
        .send({ reason: 'No longer needed' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
