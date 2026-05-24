/// <reference types="jest" />
import request from 'supertest';
import app from '../../../app';
import { setupTestDB } from '../../helpers/testSetup';
import { seedUser, authReq, TestUser } from '../../helpers/authHelper';
import { createReleasePayload } from '../../fixtures/itsm.fixture';

/**
 * Integration Tests for ITSM Release Management API
 */

setupTestDB({ dropAfterEach: false });

let managerUser: TestUser;
let techUser: TestUser;
let endUser: TestUser;
let releaseId: string;

beforeAll(async () => {
  managerUser = await seedUser({ email: 'mgr@rel.test', role: 'manager', itsmRole: 'admin' });
  techUser = await seedUser({ email: 'tech@rel.test', role: 'supervisor', itsmRole: 'technician' });
  endUser = await seedUser({ email: 'user@rel.test', role: 'prep', itsmRole: 'end_user' });
});

describe('ITSM Releases — Integration Tests', () => {
  // ============================================
  // CREATE RELEASE
  // ============================================
  describe('POST /api/v2/itsm/releases', () => {
    it('should create a release as tech', async () => {
      const payload = createReleasePayload();
      const res = await authReq(request(app).post('/api/v2/itsm/releases'), techUser)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      releaseId = res.body.data?.release_id || res.body.data?.release?.release_id || res.body.data?._id;
    });

    it('should create a release as manager', async () => {
      const payload = createReleasePayload({ release_id: `REL-MGR-${Date.now()}`, title: 'Manager release' });
      const res = await authReq(request(app).post('/api/v2/itsm/releases'), managerUser)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should deny release creation to end_user', async () => {
      const res = await authReq(request(app).post('/api/v2/itsm/releases'), endUser)
        .send(createReleasePayload({ release_id: `REL-END-${Date.now()}` }));

      expect(res.status).toBe(403);
    });

    it('should reject without authentication', async () => {
      const res = await request(app)
        .post('/api/v2/itsm/releases')
        .send(createReleasePayload({ release_id: `REL-NOAUTH-${Date.now()}` }));

      expect(res.status).toBe(401);
    });
  });

  // ============================================
  // LIST RELEASES
  // ============================================
  describe('GET /api/v2/itsm/releases', () => {
    it('should list releases as tech', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/releases'), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should deny list to end_user', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/releases'), endUser);

      expect(res.status).toBe(403);
    });
  });

  // ============================================
  // GET SINGLE RELEASE
  // ============================================
  describe('GET /api/v2/itsm/releases/:id', () => {
    it('should get release by id', async () => {
      if (!releaseId) return;
      const res = await authReq(
        request(app).get(`/api/v2/itsm/releases/${releaseId}`), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent release', async () => {
      const res = await authReq(
        request(app).get('/api/v2/itsm/releases/REL-NONEXISTENT-999'), techUser);

      expect(res.status).toBe(404);
    });
  });

  // ============================================
  // STATS
  // ============================================
  describe('GET /api/v2/itsm/releases/stats', () => {
    it('should return release stats', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/releases/stats'), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('total');
    });

    it('should deny stats to end_user', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/releases/stats'), endUser);

      expect(res.status).toBe(403);
    });
  });

  // ============================================
  // UPDATE RELEASE
  // ============================================
  describe('PATCH /api/v2/itsm/releases/:id', () => {
    it('should update release fields', async () => {
      if (!releaseId) return;
      const res = await authReq(
        request(app).patch(`/api/v2/itsm/releases/${releaseId}`), techUser)
        .send({ priority: 'high', description: 'Updated description for release' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // DELETE RELEASE
  // ============================================
  describe('DELETE /api/v2/itsm/releases/:id', () => {
    it('should delete release as tech', async () => {
      // Create a release to delete
      const payload = createReleasePayload({ release_id: `REL-DEL-${Date.now()}`, title: 'Release to delete' });
      const createRes = await authReq(request(app).post('/api/v2/itsm/releases'), techUser)
        .send(payload);
      const delId = createRes.body.data?.release_id || createRes.body.data?.release?.release_id || createRes.body.data?._id;
      if (!delId) return;

      const res = await authReq(
        request(app).delete(`/api/v2/itsm/releases/${delId}`), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
