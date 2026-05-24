/// <reference types="jest" />
import request from 'supertest';
import app from '../../../app';
import { setupTestDB } from '../../helpers/testSetup';
import { seedUser, authReq, TestUser } from '../../helpers/authHelper';
import { createProblemPayload, createIncidentPayload } from '../../fixtures/itsm.fixture';
import Counter from '../../../core/entities/Counter';

/**
 * Integration Tests for ITSM Problem Management API
 */

setupTestDB({ dropAfterEach: false });

let managerUser: TestUser;
let techUser: TestUser;
let endUser: TestUser;
let problemId: string;
let incidentId: string;

beforeAll(async () => {
  managerUser = await seedUser({ email: 'mgr@prob.test', role: 'manager', itsmRole: 'admin' });
  techUser = await seedUser({ email: 'tech@prob.test', role: 'supervisor', itsmRole: 'technician' });
  endUser = await seedUser({ email: 'user@prob.test', role: 'prep', itsmRole: 'end_user' });

  const currentYear = new Date().getFullYear();
  await Counter.findOneAndUpdate({ _id: 'PRB' }, { $setOnInsert: { sequence: 0, year: currentYear } }, { upsert: true });
  await Counter.findOneAndUpdate({ _id: 'INC' }, { $setOnInsert: { sequence: 0, year: currentYear } }, { upsert: true });

  // Create an incident to link later
  const incRes = await authReq(request(app).post('/api/v2/itsm/incidents'), techUser)
    .send(createIncidentPayload({ title: 'Email down for problem test', description: 'Incident to be linked to problem record for testing' }));
  incidentId = incRes.body.data?.incident?.incident_id;
});

describe('ITSM Problems — Integration Tests', () => {
  // ============================================
  // CREATE PROBLEM
  // ============================================
  describe('POST /api/v2/itsm/problems', () => {
    it('should create a problem with valid data', async () => {
      const res = await authReq(request(app).post('/api/v2/itsm/problems'), techUser)
        .send(createProblemPayload());

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      problemId = res.body.data?.problem?.problem_id || res.body.data?.problem?._id;
    });

    it('should reject without required title', async () => {
      const res = await authReq(request(app).post('/api/v2/itsm/problems'), techUser)
        .send({ description: 'No title' });

      expect([400, 422]).toContain(res.status);
    });

    it('should reject without authentication', async () => {
      const res = await request(app)
        .post('/api/v2/itsm/problems')
        .send(createProblemPayload());

      expect([401, 403]).toContain(res.status);
    });

    it('should allow end_user (prep role)', async () => {
      const res = await authReq(request(app).post('/api/v2/itsm/problems'), endUser)
        .send(createProblemPayload({ title: 'End user problem', description: 'Problem reported by end user for testing' }));

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // CREATE FROM INCIDENT
  // ============================================
  describe('POST /api/v2/itsm/problems/from-incident/:incidentId', () => {
    it('should create a problem from incident', async () => {
      if (!incidentId) return;
      const res = await authReq(
        request(app).post(`/api/v2/itsm/problems/from-incident/${incidentId}`), techUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // LIST PROBLEMS
  // ============================================
  describe('GET /api/v2/itsm/problems', () => {
    it('should list problems', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/problems'), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // GET SINGLE PROBLEM
  // ============================================
  describe('GET /api/v2/itsm/problems/:id', () => {
    it('should get problem by id', async () => {
      if (!problemId) return;
      const res = await authReq(
        request(app).get(`/api/v2/itsm/problems/${problemId}`), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent problem', async () => {
      const res = await authReq(
        request(app).get('/api/v2/itsm/problems/000000000000000000000000'), techUser);

      expect(res.status).toBe(404);
    });
  });

  // ============================================
  // STATS
  // ============================================
  describe('GET /api/v2/itsm/problems/stats', () => {
    it('should return problem stats', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/problems/stats'), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // FILTERED LISTS
  // ============================================
  describe('GET /api/v2/itsm/problems/open', () => {
    it('should list open problems', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/problems/open'), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v2/itsm/problems/known-errors', () => {
    it('should list known errors', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/problems/known-errors'), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v2/itsm/problems/recurring-incidents', () => {
    it('should detect recurring incidents', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/problems/recurring-incidents'), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // UPDATE PROBLEM
  // ============================================
  describe('PATCH /api/v2/itsm/problems/:id', () => {
    it('should update problem fields', async () => {
      if (!problemId) return;
      const res = await authReq(
        request(app).patch(`/api/v2/itsm/problems/${problemId}`), techUser)
        .send({ priority: 'critical' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // RCA LIFECYCLE
  // ============================================
  describe('POST /api/v2/itsm/problems/:id/rca/start', () => {
    it('should start RCA', async () => {
      if (!problemId) return;
      const res = await authReq(
        request(app).post(`/api/v2/itsm/problems/${problemId}/rca/start`), techUser)
        .send({ method: 'five_whys' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PATCH /api/v2/itsm/problems/:id/rca', () => {
    it('should update root cause analysis', async () => {
      if (!problemId) return;
      const res = await authReq(
        request(app).patch(`/api/v2/itsm/problems/${problemId}/rca`), techUser)
        .send({ root_cause: 'SMTP relay configuration was corrupted after OS update', findings: 'OS update broke relay config' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PATCH /api/v2/itsm/problems/:id/rca/complete', () => {
    it('should complete RCA', async () => {
      if (!problemId) return;
      const res = await authReq(
        request(app).patch(`/api/v2/itsm/problems/${problemId}/rca/complete`), techUser)
        .send({ root_cause: 'SMTP relay configuration corrupted', findings: 'OS update broke relay config' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // KNOWN ERROR
  // ============================================
  describe('POST /api/v2/itsm/problems/:id/known-error', () => {
    it('should mark as known error', async () => {
      if (!problemId) return;
      const res = await authReq(
        request(app).post(`/api/v2/itsm/problems/${problemId}/known-error`), techUser)
        .send({ workaround: 'Restart SMTP relay service to temporarily fix email delivery' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // LINK INCIDENT (before publish/resolve so linked incident exists)
  // ============================================
  describe('POST /api/v2/itsm/problems/:id/link-incident', () => {
    it('should link an incident to problem', async () => {
      if (!problemId || !incidentId) return;
      const res = await authReq(
        request(app).post(`/api/v2/itsm/problems/${problemId}/link-incident`), techUser)
        .send({ incident_id: incidentId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/v2/itsm/problems/:id/known-error/publish', () => {
    it('should publish known error', async () => {
      if (!problemId) return;
      const res = await authReq(
        request(app).post(`/api/v2/itsm/problems/${problemId}/known-error/publish`), techUser)
        .send({ workaround: 'Restart SMTP relay service as temporary fix' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // RESOLVE
  // ============================================
  describe('POST /api/v2/itsm/problems/:id/resolve', () => {
    it('should resolve the problem', async () => {
      if (!problemId) return;
      const res = await authReq(
        request(app).post(`/api/v2/itsm/problems/${problemId}/resolve`), techUser)
        .send({ permanent_fix: 'SMTP relay config restored and verified with monitoring' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
