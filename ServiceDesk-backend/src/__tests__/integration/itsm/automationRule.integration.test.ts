/// <reference types="jest" />
import request from 'supertest';
import app from '../../../app';
import { setupTestDB } from '../../helpers/testSetup';
import { seedUser, authReq, TestUser } from '../../helpers/authHelper';

/**
 * Integration Tests for ITSM Automation Rules API
 */

setupTestDB({ dropAfterEach: false });

let adminUser: TestUser;
let endUser: TestUser;
let ruleId: string;

beforeAll(async () => {
  adminUser = await seedUser({ email: 'admin@auto.test', role: 'manager', itsmRole: 'admin' });
  endUser = await seedUser({ email: 'user@auto.test', role: 'prep', itsmRole: 'end_user' });
});

const rulePayload = (overrides = {}) => ({
  name: 'Auto-assign high priority',
  description: 'Auto-assign high-priority tickets to L2 team',
  trigger: {
    type: 'ticket_created',
    conditions: [{ field: 'priority', operator: 'equals', value: 'high' }],
  },
  actions: [{ type: 'assign_ticket', config: { teamId: 'team-l2' }, order: 1, stopOnFailure: false }],
  isActive: true,
  ...overrides,
});

describe('ITSM Automation Rules — Integration Tests', () => {
  // ============================================
  // CREATE RULE
  // ============================================
  describe('POST /api/v2/itsm/automation/rules', () => {
    it('should create a rule as admin', async () => {
      const res = await authReq(request(app).post('/api/v2/itsm/automation/rules'), adminUser)
        .send(rulePayload());

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      ruleId = res.body.data._id || res.body.data.rule?._id;
    });

    it('should reject creation without required fields', async () => {
      const res = await authReq(request(app).post('/api/v2/itsm/automation/rules'), adminUser)
        .send({ name: '' });

      // Mongoose validation: name is required
      expect(res.status).toBe(500);
    });

    it('should reject creation by end_user', async () => {
      const res = await authReq(request(app).post('/api/v2/itsm/automation/rules'), endUser)
        .send(rulePayload({ name: 'Rogue Rule' }));

      expect(res.status).toBe(403);
    });
  });

  // ============================================
  // LIST RULES
  // ============================================
  describe('GET /api/v2/itsm/automation/rules', () => {
    it('should list rules as admin', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/automation/rules'), adminUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should require authentication', async () => {
      const res = await request(app).get('/api/v2/itsm/automation/rules');
      expect(res.status).toBe(401);
    });
  });

  // ============================================
  // GET SINGLE RULE
  // ============================================
  describe('GET /api/v2/itsm/automation/rules/:id', () => {
    it('should get rule by id', async () => {
      if (!ruleId) return;
      const res = await authReq(
        request(app).get(`/api/v2/itsm/automation/rules/${ruleId}`), adminUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // UPDATE RULE
  // ============================================
  describe('PUT /api/v2/itsm/automation/rules/:id', () => {
    it('should update rule as admin', async () => {
      if (!ruleId) return;
      const res = await authReq(
        request(app).put(`/api/v2/itsm/automation/rules/${ruleId}`), adminUser)
        .send({ description: 'Updated description' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // ACTIVATE / DEACTIVATE
  // ============================================
  describe('Activate / Deactivate Rule', () => {
    it('POST /api/v2/itsm/automation/rules/:id/deactivate - should deactivate', async () => {
      if (!ruleId) return;
      const res = await authReq(
        request(app).post(`/api/v2/itsm/automation/rules/${ruleId}/deactivate`), adminUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('POST /api/v2/itsm/automation/rules/:id/activate - should activate', async () => {
      if (!ruleId) return;
      const res = await authReq(
        request(app).post(`/api/v2/itsm/automation/rules/${ruleId}/activate`), adminUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // RULE LOGS
  // ============================================
  describe('GET /api/v2/itsm/automation/rules/:id/logs', () => {
    it('should get rule execution logs', async () => {
      if (!ruleId) return;
      const res = await authReq(
        request(app).get(`/api/v2/itsm/automation/rules/${ruleId}/logs`), adminUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // AUTOMATION STATS
  // ============================================
  describe('GET /api/v2/itsm/automation/stats', () => {
    it('should return automation stats', async () => {
      const res = await authReq(
        request(app).get('/api/v2/itsm/automation/stats'), adminUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // DELETE RULE
  // ============================================
  describe('DELETE /api/v2/itsm/automation/rules/:id', () => {
    it('should reject delete by end_user', async () => {
      if (!ruleId) return;
      const res = await authReq(
        request(app).delete(`/api/v2/itsm/automation/rules/${ruleId}`), endUser);

      expect(res.status).toBe(403);
    });

    it('should delete rule as admin', async () => {
      if (!ruleId) return;
      const res = await authReq(
        request(app).delete(`/api/v2/itsm/automation/rules/${ruleId}`), adminUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
