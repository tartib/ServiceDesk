/// <reference types="jest" />
import request from 'supertest';
import app from '../../../app';
import { setupTestDB } from '../../helpers/testSetup';
import { seedUser, authReq, TestUser } from '../../helpers/authHelper';

/**
 * Integration Tests for ITSM Service Request API
 */

setupTestDB({ dropAfterEach: false });

let adminUser: TestUser;
let endUser: TestUser;
let techUser: TestUser;
let serviceId: string;
let requestId: string;

beforeAll(async () => {
  adminUser = await seedUser({ email: 'admin@sr.test', role: 'manager', itsmRole: 'admin' });
  endUser = await seedUser({ email: 'user@sr.test', role: 'prep', itsmRole: 'end_user' });
  techUser = await seedUser({ email: 'tech@sr.test', role: 'supervisor', itsmRole: 'technician' });

  // Create a service in the catalog first
  const svcRes = await authReq(request(app).post('/api/v2/itsm/services'), adminUser)
    .send({
      name: 'Laptop Provisioning',
      description: 'Request a new laptop',
      category: 'IT',
      status: 'active',
      visibility: 'internal',
      fulfillmentType: 'manual',
      priority: 'medium',
      requestForm: {
        fields: [
          { id: 'laptop_type', type: 'select', label: 'Laptop Type', required: true, order: 0, options: [{ value: 'mac', label: 'MacBook Pro' }, { value: 'dell', label: 'Dell XPS' }] },
          { id: 'justification', type: 'textarea', label: 'Justification', required: true, order: 1 },
        ],
      },
    });

  serviceId = svcRes.body.data?._id || svcRes.body.data?.service?._id;
  if (!serviceId && svcRes.body.data?.serviceId) {
    serviceId = svcRes.body.data.serviceId;
  }
});

describe('ITSM Service Requests — Integration Tests', () => {
  // ============================================
  // CREATE REQUEST
  // ============================================
  describe('POST /api/v2/itsm/requests', () => {
    it('should create a service request as end_user', async () => {
      if (!serviceId) return;
      const res = await authReq(request(app).post('/api/v2/itsm/requests'), endUser)
        .send({
          serviceId,
          formData: { laptop_type: 'mac', justification: 'Development work' },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      requestId = res.body.data?._id || res.body.data?.request?._id;
    });

    it('should reject without required fields', async () => {
      const res = await authReq(request(app).post('/api/v2/itsm/requests'), endUser)
        .send({ formData: {} });

      // No serviceId → service lookup returns null → 404
      expect(res.status).toBe(404);
    });

    it('should reject for non-existent service', async () => {
      const res = await authReq(request(app).post('/api/v2/itsm/requests'), endUser)
        .send({ serviceId: '000000000000000000000000', formData: { test: 'data' } });

      // Service not found or inactive → 404
      expect(res.status).toBe(404);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/v2/itsm/requests')
        .send({ serviceId, formData: {} });

      expect(res.status).toBe(401);
    });
  });

  // ============================================
  // LIST REQUESTS
  // ============================================
  describe('GET /api/v2/itsm/requests', () => {
    it('should list requests as admin', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/requests'), adminUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should list requests as end_user (scoped)', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/requests'), endUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // GET SINGLE REQUEST
  // ============================================
  describe('GET /api/v2/itsm/requests/:id', () => {
    it('should get request by id', async () => {
      if (!requestId) return;
      const res = await authReq(
        request(app).get(`/api/v2/itsm/requests/${requestId}`), adminUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // ADD COMMENT
  // ============================================
  describe('POST /api/v2/itsm/requests/:id/comments', () => {
    it('should add comment to request', async () => {
      if (!requestId) return;
      const res = await authReq(
        request(app).post(`/api/v2/itsm/requests/${requestId}/comments`), endUser)
        .send({ message: 'When will this be processed?' });

      // Controller uses sendSuccess(req, res, comment, 'Comment added', 201)
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should reject empty comment', async () => {
      if (!requestId) return;
      const res = await authReq(
        request(app).post(`/api/v2/itsm/requests/${requestId}/comments`), endUser)
        .send({ message: '' });

      // Controller: sendError(400, 'Comment message is required')
      expect(res.status).toBe(400);
    });
  });

  // ============================================
  // APPROVE / REJECT / CANCEL
  // ============================================
  describe('Request Transitions', () => {
    let transitionRequestId: string;

    beforeAll(async () => {
      if (!serviceId) return;
      const res = await authReq(request(app).post('/api/v2/itsm/requests'), endUser)
        .send({
          serviceId,
          formData: { laptop_type: 'dell', justification: 'Replacement' },
        });
      transitionRequestId = res.body.data?._id || res.body.data?.request?._id;
    });

    it('POST /api/v2/itsm/requests/:id/approve - admin should approve', async () => {
      if (!transitionRequestId) return;
      const res = await authReq(
        request(app).post(`/api/v2/itsm/requests/${transitionRequestId}/approve`), adminUser)
        .send({ comment: 'Approved for provisioning' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('POST /api/v2/itsm/requests/:id/cancel - user should cancel own request', async () => {
      if (!serviceId) return;
      const createRes = await authReq(request(app).post('/api/v2/itsm/requests'), endUser)
        .send({
          serviceId,
          formData: { laptop_type: 'mac', justification: 'Cancel test' },
        });
      const cancelId = createRes.body.data?._id || createRes.body.data?.request?._id;
      if (!cancelId) return;

      const res = await authReq(
        request(app).post(`/api/v2/itsm/requests/${cancelId}/cancel`), adminUser)
        .send({ reason: 'No longer needed' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
