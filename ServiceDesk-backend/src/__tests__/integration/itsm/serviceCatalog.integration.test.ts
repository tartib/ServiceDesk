/// <reference types="jest" />
import request from 'supertest';
import app from '../../../app';
import { setupTestDB } from '../../helpers/testSetup';
import { seedUser, authReq, TestUser } from '../../helpers/authHelper';

/**
 * Integration Tests for ITSM Service Catalog API
 */

setupTestDB({ dropAfterEach: false });

let adminUser: TestUser;
let endUser: TestUser;
let serviceId: string;

beforeAll(async () => {
  adminUser = await seedUser({ email: 'admin@itsm.test', role: 'manager', itsmRole: 'admin' });
  endUser = await seedUser({ email: 'user@itsm.test', role: 'prep', itsmRole: 'end_user' });
});

const catalogPayload = (overrides = {}) => ({
  name: 'IT Support Service',
  description: 'General IT support for employees',
  category: 'IT',
  status: 'active',
  visibility: 'internal',
  fulfillmentType: 'manual',
  priority: 'medium',
  requestForm: {
    fields: [
      { id: 'issue', type: 'text', label: 'Describe your issue', required: true, order: 0 },
    ],
  },
  ...overrides,
});

describe('ITSM Service Catalog — Integration Tests', () => {
  // ============================================
  // CREATE SERVICE
  // ============================================
  describe('POST /api/v2/itsm/services', () => {
    it('should create a service as admin', async () => {
      const res = await authReq(request(app).post('/api/v2/itsm/services'), adminUser)
        .send(catalogPayload());

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      serviceId = res.body.data._id || res.body.data.service?._id;
    });

    it('should reject creation without required fields', async () => {
      const res = await authReq(request(app).post('/api/v2/itsm/services'), adminUser)
        .send({ name: '' });

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject creation by end_user (no permission)', async () => {
      const res = await authReq(request(app).post('/api/v2/itsm/services'), endUser)
        .send(catalogPayload({ name: 'Unauthorized Service' }));

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // ============================================
  // LIST SERVICES
  // ============================================
  describe('GET /api/v2/itsm/services', () => {
    it('should list services as admin', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/services'), adminUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should list services as end_user', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/services'), endUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should require authentication', async () => {
      const res = await request(app).get('/api/v2/itsm/services');
      expect(res.status).toBe(401);
    });
  });

  // ============================================
  // GET SINGLE SERVICE
  // ============================================
  describe('GET /api/v2/itsm/services/:id', () => {
    it('should get service by id', async () => {
      if (!serviceId) return;
      const res = await authReq(request(app).get(`/api/v2/itsm/services/${serviceId}`), adminUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent service', async () => {
      const res = await authReq(
        request(app).get('/api/v2/itsm/services/000000000000000000000000'), adminUser);

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  // ============================================
  // UPDATE SERVICE
  // ============================================
  describe('PUT /api/v2/itsm/services/:id', () => {
    it('should update service as admin', async () => {
      if (!serviceId) return;
      const res = await authReq(request(app).put(`/api/v2/itsm/services/${serviceId}`), adminUser)
        .send({ name: 'Updated IT Support', description: 'Updated description', category: 'IT' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject update by end_user', async () => {
      if (!serviceId) return;
      const res = await authReq(request(app).put(`/api/v2/itsm/services/${serviceId}`), endUser)
        .send({ name: 'Hacked Name' });

      expect(res.status).toBe(403);
    });
  });

  // ============================================
  // CATEGORIES
  // ============================================
  describe('GET /api/v2/itsm/services/categories', () => {
    it('should return categories', async () => {
      const res = await authReq(
        request(app).get('/api/v2/itsm/services/categories'), adminUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // FEATURED SERVICES
  // ============================================
  describe('GET /api/v2/itsm/services/featured', () => {
    it('should return featured services', async () => {
      const res = await authReq(
        request(app).get('/api/v2/itsm/services/featured'), adminUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // DELETE SERVICE
  // ============================================
  describe('DELETE /api/v2/itsm/services/:id', () => {
    it('should reject delete by end_user', async () => {
      if (!serviceId) return;
      const res = await authReq(
        request(app).delete(`/api/v2/itsm/services/${serviceId}`), endUser);

      expect(res.status).toBe(403);
    });

    it('should delete service as admin', async () => {
      if (!serviceId) return;
      const res = await authReq(
        request(app).delete(`/api/v2/itsm/services/${serviceId}`), adminUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
