/// <reference types="jest" />
import request from 'supertest';
import app from '../../../app';
import { setupTestDB } from '../../helpers/testSetup';
import { seedUser, authReq, TestUser } from '../../helpers/authHelper';
import { createIncidentPayload, createChangePayload, createProblemPayload } from '../../fixtures/itsm.fixture';

/**
 * Integration Tests for ITSM Dashboard API
 */

setupTestDB({ dropAfterEach: false });

let managerUser: TestUser;
let techUser: TestUser;
let endUser: TestUser;

beforeAll(async () => {
  managerUser = await seedUser({ email: 'mgr@dash.test', role: 'manager', itsmRole: 'admin' });
  techUser = await seedUser({ email: 'tech@dash.test', role: 'supervisor', itsmRole: 'technician' });
  endUser = await seedUser({ email: 'user@dash.test', role: 'prep', itsmRole: 'end_user' });

  // Seed some data for dashboard aggregations
  await authReq(request(app).post('/api/v2/itsm/incidents'), techUser)
    .send(createIncidentPayload({ title: 'Dashboard seed incident 1', description: 'First incident for dashboard testing seed data' }));
  await authReq(request(app).post('/api/v2/itsm/incidents'), techUser)
    .send(createIncidentPayload({ title: 'Dashboard seed incident 2', description: 'Second incident for dashboard testing seed data', priority: 'critical' }));
  await authReq(request(app).post('/api/v2/itsm/changes'), techUser)
    .send(createChangePayload({ title: 'Dashboard seed change', description: 'Change record for dashboard testing seed data' }));
  await authReq(request(app).post('/api/v2/itsm/problems'), techUser)
    .send(createProblemPayload({ title: 'Dashboard seed problem' }));
});

describe('ITSM Dashboard — Integration Tests', () => {
  // ============================================
  // FULL DASHBOARD
  // ============================================
  describe('GET /api/v2/itsm/itsm-dashboard', () => {
    it('should return full dashboard as manager', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/itsm-dashboard'), managerUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return full dashboard as tech', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/itsm-dashboard'), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should deny dashboard to end_user', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/itsm-dashboard'), endUser);

      expect(res.status).toBe(403);
    });
  });

  // ============================================
  // INCIDENT KPIs
  // ============================================
  describe('GET /api/v2/itsm/itsm-dashboard/incidents', () => {
    it('should return incident KPIs', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/itsm-dashboard/incidents'), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should deny to end_user', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/itsm-dashboard/incidents'), endUser);

      expect(res.status).toBe(403);
    });
  });

  // ============================================
  // PROBLEM KPIs
  // ============================================
  describe('GET /api/v2/itsm/itsm-dashboard/problems', () => {
    it('should return problem KPIs', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/itsm-dashboard/problems'), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // CHANGE KPIs
  // ============================================
  describe('GET /api/v2/itsm/itsm-dashboard/changes', () => {
    it('should return change KPIs', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/itsm-dashboard/changes'), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // SLA COMPLIANCE
  // ============================================
  describe('GET /api/v2/itsm/itsm-dashboard/sla-compliance', () => {
    it('should return SLA compliance data', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/itsm-dashboard/sla-compliance'), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // INCIDENT TREND
  // ============================================
  describe('GET /api/v2/itsm/itsm-dashboard/incident-trend', () => {
    it('should return incident trend data', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/itsm-dashboard/incident-trend'), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
