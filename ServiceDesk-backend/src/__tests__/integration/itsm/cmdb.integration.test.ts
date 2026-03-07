/// <reference types="jest" />
import request from 'supertest';
import app from '../../../app';
import { setupTestDB } from '../../helpers/testSetup';
import { seedUser, authReq, TestUser } from '../../helpers/authHelper';

/**
 * Integration Tests for ITSM CMDB API
 */

setupTestDB({ dropAfterEach: false });

let adminUser: TestUser;
let endUser: TestUser;
let ciId: string;
let ciId2: string;
let relationshipId: string;

beforeAll(async () => {
  adminUser = await seedUser({ email: 'admin@cmdb.test', role: 'manager', itsmRole: 'admin' });
  endUser = await seedUser({ email: 'user@cmdb.test', role: 'prep', itsmRole: 'end_user' });
});

const ciPayload = (overrides = {}) => ({
  name: 'Web Server 01',
  ciType: 'server',
  category: 'infrastructure',
  status: 'active',
  environment: 'production',
  description: 'Primary web server',
  attributes: { os: 'Ubuntu 22.04', ip: '10.0.1.10', ram: '16GB' },
  ...overrides,
});

describe('ITSM CMDB — Integration Tests', () => {
  // ============================================
  // CREATE CI
  // ============================================
  describe('POST /api/v2/itsm/cmdb/items', () => {
    it('should create a CI as admin', async () => {
      const res = await authReq(request(app).post('/api/v2/itsm/cmdb/items'), adminUser)
        .send(ciPayload());

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      ciId = res.body.data._id || res.body.data.item?._id;
    });

    it('should create a second CI for relationship tests', async () => {
      const res = await authReq(request(app).post('/api/v2/itsm/cmdb/items'), adminUser)
        .send(ciPayload({ name: 'Database Server 01', ciType: 'server', category: 'infrastructure' }));

      expect(res.status).toBe(201);
      ciId2 = res.body.data._id || res.body.data.item?._id;
    });

    it('should reject CI creation without required fields', async () => {
      const res = await authReq(request(app).post('/api/v2/itsm/cmdb/items'), adminUser)
        .send({ name: '' });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject CI creation by end_user', async () => {
      const res = await authReq(request(app).post('/api/v2/itsm/cmdb/items'), endUser)
        .send(ciPayload({ name: 'Rogue CI' }));

      expect(res.status).toBe(403);
    });
  });

  // ============================================
  // LIST CIs
  // ============================================
  describe('GET /api/v2/itsm/cmdb/items', () => {
    it('should list CIs as admin', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/cmdb/items'), adminUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should require authentication', async () => {
      const res = await request(app).get('/api/v2/itsm/cmdb/items');
      expect(res.status).toBe(401);
    });
  });

  // ============================================
  // GET SINGLE CI
  // ============================================
  describe('GET /api/v2/itsm/cmdb/items/:id', () => {
    it('should get CI by id', async () => {
      if (!ciId) return;
      const res = await authReq(request(app).get(`/api/v2/itsm/cmdb/items/${ciId}`), adminUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // UPDATE CI
  // ============================================
  describe('PUT /api/v2/itsm/cmdb/items/:id', () => {
    it('should update CI as admin', async () => {
      if (!ciId) return;
      const res = await authReq(request(app).put(`/api/v2/itsm/cmdb/items/${ciId}`), adminUser)
        .send({ description: 'Updated server description' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject update by end_user', async () => {
      if (!ciId) return;
      const res = await authReq(request(app).put(`/api/v2/itsm/cmdb/items/${ciId}`), endUser)
        .send({ name: 'Hacked' });

      expect(res.status).toBe(403);
    });
  });

  // ============================================
  // CI TYPES
  // ============================================
  describe('GET /api/v2/itsm/cmdb/types', () => {
    it('should return CI types', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/cmdb/types'), adminUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // CMDB STATS
  // ============================================
  describe('GET /api/v2/itsm/cmdb/stats', () => {
    it('should return CMDB stats', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/cmdb/stats'), adminUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // RELATIONSHIPS
  // ============================================
  describe('CI Relationships', () => {
    it('POST /api/v2/itsm/cmdb/relationships - should create relationship', async () => {
      if (!ciId || !ciId2) return;
      const res = await authReq(request(app).post('/api/v2/itsm/cmdb/relationships'), adminUser)
        .send({ sourceId: ciId, targetId: ciId2, relationshipType: 'depends_on' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      relationshipId = res.body.data._id || res.body.data.relationship?._id;
    });

    it('GET /api/v2/itsm/cmdb/items/:id/relationships - should get relationships', async () => {
      if (!ciId) return;
      const res = await authReq(
        request(app).get(`/api/v2/itsm/cmdb/items/${ciId}/relationships`), adminUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('DELETE /api/v2/itsm/cmdb/relationships/:id - should delete relationship', async () => {
      if (!relationshipId) return;
      const res = await authReq(
        request(app).delete(`/api/v2/itsm/cmdb/relationships/${relationshipId}`), adminUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // DELETE CI
  // ============================================
  describe('DELETE /api/v2/itsm/cmdb/items/:id', () => {
    it('should delete CI as admin', async () => {
      if (!ciId) return;
      const res = await authReq(
        request(app).delete(`/api/v2/itsm/cmdb/items/${ciId}`), adminUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
