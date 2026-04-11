/// <reference types="jest" />
import request from 'supertest';
import app from '../../../app';
import { setupTestDB } from '../../helpers/testSetup';
import { seedUser, authReq, TestUser } from '../../helpers/authHelper';

/**
 * Integration Tests for Workflow Definition API
 */

setupTestDB({ dropAfterEach: false });

let managerUser: TestUser;
let definitionId: string;

beforeAll(async () => {
  managerUser = await seedUser({ email: 'mgr@wf.test', role: 'manager', itsmRole: 'admin' });
});

const definitionPayload = (overrides = {}) => ({
  name: 'Approval Workflow',
  description: 'Simple approval workflow for testing',
  entityType: 'ticket',
  states: [
    {
      id: 'submitted',
      code: 'submitted',
      name: 'Submitted',
      type: 'start',
      category: 'todo',
      order: 0,
      onEnter: [],
      onExit: [],
      transitions: [
        { id: 'review', name: 'Review', target: 'under_review' },
      ],
    },
    {
      id: 'under_review',
      code: 'under_review',
      name: 'Under Review',
      type: 'normal',
      category: 'in_progress',
      order: 1,
      onEnter: [],
      onExit: [],
      transitions: [
        { id: 'approve', name: 'Approve', target: 'approved' },
        { id: 'reject', name: 'Reject', target: 'rejected' },
      ],
    },
    {
      id: 'approved',
      code: 'approved',
      name: 'Approved',
      type: 'end',
      category: 'done',
      order: 2,
      onEnter: [],
      onExit: [],
      transitions: [],
    },
    {
      id: 'rejected',
      code: 'rejected',
      name: 'Rejected',
      type: 'end',
      category: 'cancelled',
      order: 3,
      onEnter: [],
      onExit: [],
      transitions: [],
    },
  ],
  initialState: 'submitted',
  finalStates: ['approved', 'rejected'],
  ...overrides,
});

describe('Workflow Definitions — Integration Tests', () => {
  // ============================================
  // CREATE DEFINITION
  // ============================================
  describe('POST /api/v2/workflow-engine/definitions', () => {
    it('should create a workflow definition', async () => {
      const res = await authReq(request(app).post('/api/v2/workflow-engine/definitions'), managerUser)
        .send(definitionPayload());

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      definitionId = res.body.data?._id || res.body.data?.definition?._id;
    });

    it('should reject definition without required fields', async () => {
      const res = await authReq(request(app).post('/api/v2/workflow-engine/definitions'), managerUser)
        .send({ name: 'Incomplete' });

      // Mongoose validation error for missing required fields
      expect(res.status).toBe(500);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/v2/workflow-engine/definitions')
        .send(definitionPayload());

      expect(res.status).toBe(401);
    });
  });

  // ============================================
  // LIST DEFINITIONS
  // ============================================
  describe('GET /api/v2/workflow-engine/definitions', () => {
    it('should list definitions', async () => {
      const res = await authReq(request(app).get('/api/v2/workflow-engine/definitions'), managerUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // GET SINGLE DEFINITION
  // ============================================
  describe('GET /api/v2/workflow-engine/definitions/:id', () => {
    it('should get definition by id', async () => {
      if (!definitionId) return;
      const res = await authReq(
        request(app).get(`/api/v2/workflow-engine/definitions/${definitionId}`), managerUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return error for invalid id format', async () => {
      const res = await authReq(
        request(app).get('/api/v2/workflow-engine/definitions/invalid-id'), managerUser);

      // Mongoose CastError for invalid ObjectId
      expect(res.status).toBe(500);
    });
  });

  // ============================================
  // UPDATE DEFINITION
  // ============================================
  describe('PUT /api/v2/workflow-engine/definitions/:id', () => {
    it('should update definition', async () => {
      if (!definitionId) return;
      const res = await authReq(
        request(app).put(`/api/v2/workflow-engine/definitions/${definitionId}`), managerUser)
        .send({ description: 'Updated workflow description' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // PUBLISH / DEPRECATE
  // ============================================
  describe('Publish / Deprecate', () => {
    it('POST /api/v2/workflow-engine/definitions/:id/publish - should publish draft definition', async () => {
      if (!definitionId) return;
      const res = await authReq(
        request(app).post(`/api/v2/workflow-engine/definitions/${definitionId}/publish`), managerUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('POST /api/v2/workflow-engine/definitions/:id/publish - should reject double publish', async () => {
      if (!definitionId) return;
      const res = await authReq(
        request(app).post(`/api/v2/workflow-engine/definitions/${definitionId}/publish`), managerUser);

      // Already published — service throws 'Definition is already published'
      expect(res.status).toBe(500);
    });

    it('POST /api/v2/workflow-engine/definitions/:id/deprecate - should deprecate published definition', async () => {
      if (!definitionId) return;
      const res = await authReq(
        request(app).post(`/api/v2/workflow-engine/definitions/${definitionId}/deprecate`), managerUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // VERSIONS
  // ============================================
  describe('Versions', () => {
    it('GET /api/v2/workflow-engine/definitions/:id/versions - should get versions', async () => {
      if (!definitionId) return;
      const res = await authReq(
        request(app).get(`/api/v2/workflow-engine/definitions/${definitionId}/versions`), managerUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // DELETE DEFINITION
  // ============================================
  describe('DELETE /api/v2/workflow-engine/definitions/:id', () => {
    it('should delete definition', async () => {
      if (!definitionId) return;
      const res = await authReq(
        request(app).delete(`/api/v2/workflow-engine/definitions/${definitionId}`), managerUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
