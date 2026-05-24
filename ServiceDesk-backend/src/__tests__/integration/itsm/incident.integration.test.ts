/// <reference types="jest" />
import request from 'supertest';
import app from '../../../app';
import { setupTestDB } from '../../helpers/testSetup';
import { seedUser, authReq, TestUser } from '../../helpers/authHelper';
import { createIncidentPayload } from '../../fixtures/itsm.fixture';
import Counter from '../../../core/entities/Counter';

/**
 * Integration Tests for ITSM Incident API
 */

setupTestDB({ dropAfterEach: false });

let managerUser: TestUser;
let techUser: TestUser;
let endUser: TestUser;
let incidentId: string;

beforeAll(async () => {
  managerUser = await seedUser({ email: 'mgr@inc.test', role: 'manager', itsmRole: 'admin' });
  techUser = await seedUser({ email: 'tech@inc.test', role: 'supervisor', itsmRole: 'technician' });
  endUser = await seedUser({ email: 'user@inc.test', role: 'prep', itsmRole: 'end_user' });

  // Seed incident counter
  const currentYear = new Date().getFullYear();
  await Counter.findOneAndUpdate(
    { _id: 'INC' },
    { $setOnInsert: { sequence: 0, year: currentYear } },
    { upsert: true }
  );
});

describe('ITSM Incidents — Integration Tests', () => {
  // ============================================
  // CREATE INCIDENT
  // ============================================
  describe('POST /api/v2/itsm/incidents', () => {
    it('should create an incident with valid data', async () => {
      const res = await authReq(request(app).post('/api/v2/itsm/incidents'), techUser)
        .send(createIncidentPayload());

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.incident).toBeDefined();
      incidentId = res.body.data.incident.incident_id;
    });

    it('should create an incident as end_user', async () => {
      const res = await authReq(request(app).post('/api/v2/itsm/incidents'), endUser)
        .send(createIncidentPayload({ title: 'Printer not working', description: 'Office printer is jammed and not responding to commands' }));

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should reject without required title', async () => {
      const res = await authReq(request(app).post('/api/v2/itsm/incidents'), techUser)
        .send({ description: 'Missing title field entirely' });

      expect([400, 422]).toContain(res.status);
    });

    it('should reject with title too short', async () => {
      const res = await authReq(request(app).post('/api/v2/itsm/incidents'), techUser)
        .send({ title: 'ab', description: 'Title is too short' });

      expect([400, 422]).toContain(res.status);
    });

    it('should reject without authentication', async () => {
      const res = await request(app)
        .post('/api/v2/itsm/incidents')
        .send(createIncidentPayload());

      expect([401, 403]).toContain(res.status);
    });
  });

  // ============================================
  // LIST INCIDENTS
  // ============================================
  describe('GET /api/v2/itsm/incidents', () => {
    it('should list incidents as tech', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/incidents'), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should deny list to end_user', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/incidents'), endUser);

      expect(res.status).toBe(403);
    });
  });

  // ============================================
  // GET SINGLE INCIDENT
  // ============================================
  describe('GET /api/v2/itsm/incidents/:id', () => {
    it('should get incident by id', async () => {
      if (!incidentId) return;
      const res = await authReq(
        request(app).get(`/api/v2/itsm/incidents/${incidentId}`), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.incident).toBeDefined();
    });

    it('should return 404 for non-existent id', async () => {
      const res = await authReq(
        request(app).get('/api/v2/itsm/incidents/000000000000000000000000'), techUser);

      expect(res.status).toBe(404);
    });
  });

  // ============================================
  // STATS
  // ============================================
  describe('GET /api/v2/itsm/incidents/stats', () => {
    it('should return incident stats', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/incidents/stats'), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it('should deny stats to end_user', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/incidents/stats'), endUser);

      expect(res.status).toBe(403);
    });
  });

  // ============================================
  // FILTERED LISTS
  // ============================================
  describe('GET /api/v2/itsm/incidents/open', () => {
    it('should list open incidents', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/incidents/open'), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v2/itsm/incidents/breached', () => {
    it('should list breached incidents', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/incidents/breached'), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v2/itsm/incidents/unassigned', () => {
    it('should list unassigned incidents', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/incidents/unassigned'), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v2/itsm/incidents/major', () => {
    it('should list major incidents', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/incidents/major'), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v2/itsm/incidents/my-assignments', () => {
    it('should list my assigned incidents', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/incidents/my-assignments'), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v2/itsm/incidents/my-requests', () => {
    it('should list my created incidents', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/incidents/my-requests'), endUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v2/itsm/incidents/search', () => {
    it('should search incidents by keyword', async () => {
      const res = await authReq(
        request(app).get('/api/v2/itsm/incidents/search?q=email'), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // UPDATE INCIDENT
  // ============================================
  describe('PATCH /api/v2/itsm/incidents/:id', () => {
    it('should update incident fields', async () => {
      if (!incidentId) return;
      const res = await authReq(
        request(app).patch(`/api/v2/itsm/incidents/${incidentId}`), techUser)
        .send({ priority: 'critical', tags: ['urgent', 'email'] });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // STATUS TRANSITION
  // ============================================
  describe('PATCH /api/v2/itsm/incidents/:id/status', () => {
    it('should update incident status', async () => {
      if (!incidentId) return;
      const res = await authReq(
        request(app).patch(`/api/v2/itsm/incidents/${incidentId}/status`), techUser)
        .send({ status: 'in_progress', resolution_notes: 'Investigating' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // ASSIGN INCIDENT
  // ============================================
  describe('PATCH /api/v2/itsm/incidents/:id/assign', () => {
    it('should assign incident as manager', async () => {
      if (!incidentId) return;
      const res = await authReq(
        request(app).patch(`/api/v2/itsm/incidents/${incidentId}/assign`), managerUser)
        .send({ technician_id: techUser.id, name: 'Test Supervisor', email: 'tech@inc.test' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should deny assign to tech (non-manager)', async () => {
      if (!incidentId) return;
      const res = await authReq(
        request(app).patch(`/api/v2/itsm/incidents/${incidentId}/assign`), techUser)
        .send({ technician_id: managerUser.id, name: 'Test Manager', email: 'mgr@inc.test' });

      expect(res.status).toBe(403);
    });
  });

  // ============================================
  // WORKLOG
  // ============================================
  describe('POST /api/v2/itsm/incidents/:id/worklogs', () => {
    it('should add a worklog entry', async () => {
      if (!incidentId) return;
      const res = await authReq(
        request(app).post(`/api/v2/itsm/incidents/${incidentId}/worklogs`), techUser)
        .send({ note: 'Investigated email server, found disk full', minutes_spent: 30 });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // ESCALATE
  // ============================================
  describe('POST /api/v2/itsm/incidents/:id/escalate', () => {
    it('should escalate an incident', async () => {
      if (!incidentId) return;
      const res = await authReq(
        request(app).post(`/api/v2/itsm/incidents/${incidentId}/escalate`), techUser)
        .send({ reason: 'Requires senior engineer attention' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
