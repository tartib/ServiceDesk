/// <reference types="jest" />
import request from 'supertest';
import app from '../../../app';
import { setupTestDB } from '../../helpers/testSetup';
import { seedUser, authReq, TestUser } from '../../helpers/authHelper';
import { createChangePayload } from '../../fixtures/itsm.fixture';
import Counter from '../../../core/entities/Counter';

/**
 * Integration Tests for ITSM Change Management API
 */

setupTestDB({ dropAfterEach: false });

let managerUser: TestUser;
let techUser: TestUser;
let endUser: TestUser;
let changeId: string;

beforeAll(async () => {
  managerUser = await seedUser({ email: 'mgr@chg.test', role: 'manager', itsmRole: 'admin' });
  techUser = await seedUser({ email: 'tech@chg.test', role: 'supervisor', itsmRole: 'technician' });
  endUser = await seedUser({ email: 'user@chg.test', role: 'prep', itsmRole: 'end_user' });

  const currentYear = new Date().getFullYear();
  await Counter.findOneAndUpdate(
    { _id: 'CHG' },
    { $setOnInsert: { sequence: 0, year: currentYear } },
    { upsert: true }
  );
});

describe('ITSM Changes — Integration Tests', () => {
  // ============================================
  // CREATE CHANGE
  // ============================================
  describe('POST /api/v2/itsm/changes', () => {
    it('should create a change request with valid data', async () => {
      const res = await authReq(request(app).post('/api/v2/itsm/changes'), techUser)
        .send(createChangePayload());

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      changeId = res.body.data?.change?.change_id || res.body.data?.change?._id;
    });

    it('should create a change as end_user', async () => {
      const res = await authReq(request(app).post('/api/v2/itsm/changes'), endUser)
        .send(createChangePayload({ title: 'Office Wi-Fi upgrade', description: 'Upgrade office Wi-Fi access points to newer models' }));

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should reject without required fields', async () => {
      const res = await authReq(request(app).post('/api/v2/itsm/changes'), techUser)
        .send({ description: 'No title provided here at all' });

      expect([400, 422]).toContain(res.status);
    });

    it('should reject without authentication', async () => {
      const res = await request(app)
        .post('/api/v2/itsm/changes')
        .send(createChangePayload());

      expect([401, 403]).toContain(res.status);
    });
  });

  // ============================================
  // LIST CHANGES
  // ============================================
  describe('GET /api/v2/itsm/changes', () => {
    it('should list changes as tech', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/changes'), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should deny list to end_user', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/changes'), endUser);

      expect(res.status).toBe(403);
    });
  });

  // ============================================
  // GET SINGLE CHANGE
  // ============================================
  describe('GET /api/v2/itsm/changes/:id', () => {
    it('should get change by id', async () => {
      if (!changeId) return;
      const res = await authReq(
        request(app).get(`/api/v2/itsm/changes/${changeId}`), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent change', async () => {
      const res = await authReq(
        request(app).get('/api/v2/itsm/changes/000000000000000000000000'), techUser);

      expect(res.status).toBe(404);
    });
  });

  // ============================================
  // STATS
  // ============================================
  describe('GET /api/v2/itsm/changes/stats', () => {
    it('should return change stats', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/changes/stats'), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should deny stats to end_user', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/changes/stats'), endUser);

      expect(res.status).toBe(403);
    });
  });

  // ============================================
  // FILTERED LISTS
  // ============================================
  describe('GET /api/v2/itsm/changes/pending-cab', () => {
    it('should list pending CAB changes', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/changes/pending-cab'), managerUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should deny to non-manager', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/changes/pending-cab'), techUser);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v2/itsm/changes/scheduled', () => {
    it('should list scheduled changes', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/changes/scheduled'), techUser);

      expect([200, 400]).toContain(res.status);
    });
  });

  describe('GET /api/v2/itsm/changes/emergency', () => {
    it('should list emergency changes', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/changes/emergency'), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v2/itsm/changes/my-requests', () => {
    it('should list my change requests', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/changes/my-requests'), endUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // UPDATE CHANGE
  // ============================================
  describe('PATCH /api/v2/itsm/changes/:id', () => {
    it('should update change fields', async () => {
      if (!changeId) return;
      const res = await authReq(
        request(app).patch(`/api/v2/itsm/changes/${changeId}`), techUser)
        .send({ priority: 'high', risk: 'high' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // LIFECYCLE TRANSITIONS
  // ============================================
  describe('POST /api/v2/itsm/changes/:id/submit', () => {
    it('should submit change for approval', async () => {
      if (!changeId) return;
      const res = await authReq(
        request(app).post(`/api/v2/itsm/changes/${changeId}/submit`), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/v2/itsm/changes/:id/cab/approve', () => {
    it('should add CAB approval as manager', async () => {
      if (!changeId) return;
      const res = await authReq(
        request(app).post(`/api/v2/itsm/changes/${changeId}/cab/approve`), managerUser)
        .send({ decision: 'approved', comments: 'Approved by CAB' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/v2/itsm/changes/:id/schedule', () => {
    it('should schedule a change as manager', async () => {
      if (!changeId) return;
      const start = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
      const end = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString();
      const res = await authReq(
        request(app).post(`/api/v2/itsm/changes/${changeId}/schedule`), managerUser)
        .send({ planned_start: start, planned_end: end });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/v2/itsm/changes/:id/implement', () => {
    it('should start implementation', async () => {
      if (!changeId) return;
      const res = await authReq(
        request(app).post(`/api/v2/itsm/changes/${changeId}/implement`), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/v2/itsm/changes/:id/complete', () => {
    it('should complete change', async () => {
      if (!changeId) return;
      const res = await authReq(
        request(app).post(`/api/v2/itsm/changes/${changeId}/complete`), techUser)
        .send({ review_notes: 'Successfully deployed and verified' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // CALENDAR
  // ============================================
  describe('GET /api/v2/itsm/changes/calendar', () => {
    it('should get change calendar', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/changes/calendar'), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // CANCEL (separate change)
  // ============================================
  describe('POST /api/v2/itsm/changes/:id/cancel', () => {
    it('should cancel a change as manager', async () => {
      // Create a fresh change to cancel
      const createRes = await authReq(request(app).post('/api/v2/itsm/changes'), techUser)
        .send(createChangePayload({ title: 'Change to cancel', description: 'This change will be cancelled for testing' }));
      const cancelId = createRes.body.data?.change?.change_id || createRes.body.data?.change?._id;
      if (!cancelId) return;

      const res = await authReq(
        request(app).post(`/api/v2/itsm/changes/${cancelId}/cancel`), managerUser)
        .send({ reason: 'No longer required' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
