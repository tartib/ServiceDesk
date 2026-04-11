/// <reference types="jest" />
import request from 'supertest';
import app from '../../../app';
import { setupTestDB } from '../../helpers/testSetup';
import { seedUser, authReq, TestUser } from '../../helpers/authHelper';

/**
 * Integration Tests for Workflow External Task API
 */

setupTestDB({ dropAfterEach: false });

let managerUser: TestUser;

beforeAll(async () => {
  managerUser = await seedUser({ email: 'mgr@ext.test', role: 'manager', itsmRole: 'admin' });
});

describe('Workflow External Tasks — Integration Tests', () => {
  // ============================================
  // LIST EXTERNAL TASKS
  // ============================================
  describe('GET /api/v2/workflow-engine/external-tasks', () => {
    it('should list external tasks', async () => {
      const res = await authReq(request(app).get('/api/v2/workflow-engine/external-tasks'), managerUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should require authentication', async () => {
      const res = await request(app).get('/api/v2/workflow-engine/external-tasks');
      expect(res.status).toBe(401);
    });
  });

  // ============================================
  // FETCH AND LOCK
  // ============================================
  describe('POST /api/v2/workflow-engine/external-tasks/fetch-and-lock', () => {
    it('should fetch and lock tasks for a topic', async () => {
      const res = await authReq(
        request(app).post('/api/v2/workflow-engine/external-tasks/fetch-and-lock'), managerUser)
        .send({
          topic: 'email-notification',
          workerId: 'worker-test-001',
          lockDuration: 30000,
          maxTasks: 5,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject without required fields', async () => {
      const res = await authReq(
        request(app).post('/api/v2/workflow-engine/external-tasks/fetch-and-lock'), managerUser)
        .send({ topic: '' });

      // Validation: topic and workerId are required
      expect(res.status).toBe(400);
    });
  });

  // ============================================
  // COMPLETE / FAILURE (require valid task IDs — tested with invalid to verify error handling)
  // ============================================
  describe('POST /api/v2/workflow-engine/external-tasks/:id/complete', () => {
    it('should return error for non-existent task', async () => {
      const fakeId = '000000000000000000000000';
      const res = await authReq(
        request(app).post(`/api/v2/workflow-engine/external-tasks/${fakeId}/complete`), managerUser)
        .send({ workerId: 'worker-test-001', result: {} });

      // Engine throws for non-existent external task
      expect(res.status).toBe(500);
    });
  });

  describe('POST /api/v2/workflow-engine/external-tasks/:id/failure', () => {
    it('should return error for non-existent task', async () => {
      const fakeId = '000000000000000000000000';
      const res = await authReq(
        request(app).post(`/api/v2/workflow-engine/external-tasks/${fakeId}/failure`), managerUser)
        .send({ workerId: 'worker-test-001', errorMessage: 'Task failed' });

      // Engine throws for non-existent external task
      expect(res.status).toBe(500);
    });
  });

  describe('POST /api/v2/workflow-engine/external-tasks/:id/extend-lock', () => {
    it('should return 404 for non-existent task', async () => {
      const fakeId = '000000000000000000000000';
      const res = await authReq(
        request(app).post(`/api/v2/workflow-engine/external-tasks/${fakeId}/extend-lock`), managerUser)
        .send({ workerId: 'worker-test-001', lockDuration: 60000 });

      // Controller explicitly returns 404 for non-existent task
      expect(res.status).toBe(404);
    });
  });
});
