/// <reference types="jest" />
import request from 'supertest';
import app from '../../app';
import { setupTestDB } from '../helpers/testSetup';
import { seedUser, authReq, TestUser } from '../helpers/authHelper';

/**
 * PM Module Extended Integration Tests
 * Covers: Comments, Search, Export, Activity (plural alias)
 */

setupTestDB({ dropAfterEach: false });

let managerUser: TestUser;
let organizationId: string;
let projectId: string;
let taskId: string;
let commentId: string;

beforeAll(async () => {
  managerUser = await seedUser({ email: 'pm@ext.test', role: 'manager', itsmRole: 'admin' });

  // Create organization
  const orgRes = await authReq(request(app).post('/api/v2/pm/organizations'), managerUser)
    .send({ name: 'PM Test Org', description: 'Org for PM tests', industry: 'Tech' });
  organizationId = orgRes.body.data?.organization?._id;

  // Create project
  const projRes = await authReq(request(app).post('/api/v2/pm/projects'), managerUser)
    .send({ name: 'Extended PM Project', key: 'EXT', description: 'For extended tests' });
  projectId = projRes.body.data?.project?._id;

  // Create task
  const taskRes = await authReq(
    request(app).post(`/api/v2/pm/projects/${projectId}/tasks`), managerUser)
    .send({ title: 'Comment Test Task', type: 'task', priority: 'medium', description: 'Task for comment tests' });
  taskId = taskRes.body.data?.task?._id;
});

describe('PM Extended — Integration Tests', () => {
  // ============================================
  // COMMENTS CRUD
  // ============================================
  describe('Comments', () => {
    it('POST /api/v2/pm/tasks/:taskId/comments - should create comment', async () => {
      if (!taskId) return;
      const res = await authReq(
        request(app).post(`/api/v2/pm/tasks/${taskId}/comments`), managerUser)
        .send({ content: 'This is a test comment on the task' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      commentId = res.body.data?.comment?._id || res.body.data?._id;
    });

    it('GET /api/v2/pm/tasks/:taskId/comments - should list comments', async () => {
      if (!taskId) return;
      const res = await authReq(
        request(app).get(`/api/v2/pm/tasks/${taskId}/comments`), managerUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('PUT /api/v2/pm/comments/:commentId - should update comment', async () => {
      if (!commentId) return;
      const res = await authReq(
        request(app).put(`/api/v2/pm/comments/${commentId}`), managerUser)
        .send({ content: 'Updated comment content' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('POST /api/v2/pm/comments/:commentId/reactions - should add reaction', async () => {
      if (!commentId) return;
      const res = await authReq(
        request(app).post(`/api/v2/pm/comments/${commentId}/reactions`), managerUser)
        .send({ emoji: 'thumbsup' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('POST /api/v2/pm/tasks/:taskId/comments - should reject empty content', async () => {
      if (!taskId) return;
      const res = await authReq(
        request(app).post(`/api/v2/pm/tasks/${taskId}/comments`), managerUser)
        .send({ content: '' });

      // Route validation: body('content').notEmpty() → 400
      expect(res.status).toBe(400);
    });

    it('DELETE /api/v2/pm/comments/:commentId - should delete comment', async () => {
      if (!commentId) return;
      const res = await authReq(
        request(app).delete(`/api/v2/pm/comments/${commentId}`), managerUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // ACTIVITY (plural alias)
  // ============================================
  describe('Activity Feed (plural alias)', () => {
    it('GET /api/v2/pm/projects/:projectId/activities - should work (plural)', async () => {
      if (!projectId) return;
      const res = await authReq(
        request(app).get(`/api/v2/pm/projects/${projectId}/activities`), managerUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.activities)).toBe(true);
    });

    it('GET /api/v2/pm/projects/:projectId/activity - should work (singular)', async () => {
      if (!projectId) return;
      const res = await authReq(
        request(app).get(`/api/v2/pm/projects/${projectId}/activity`), managerUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // SEARCH
  // ============================================
  describe('Search', () => {
    it('GET /api/v2/pm/search - should search tasks', async () => {
      const res = await authReq(
        request(app).get('/api/v2/pm/search?q=Comment+Test'), managerUser);

      // Search may return 200 with results or empty
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('GET /api/v2/pm/search - should reject empty query', async () => {
      const res = await authReq(
        request(app).get('/api/v2/pm/search?q='), managerUser);

      // Validation requires min 2 chars; empty query returns 400
      expect(res.status).toBe(400);
    });
  });

  // ============================================
  // EXPORT
  // ============================================
  describe('Export', () => {
    it('GET /api/v2/pm/export/projects/:projectId/tasks - should export project tasks', async () => {
      if (!projectId) return;
      const res = await authReq(
        request(app).get(`/api/v2/pm/export/projects/${projectId}/tasks`), managerUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // STANDUP
  // ============================================
  describe('Standup', () => {
    it('GET /api/v2/pm/projects/:projectId/standups - should list standups', async () => {
      if (!projectId) return;
      const res = await authReq(
        request(app).get(`/api/v2/pm/projects/${projectId}/standups`), managerUser);

      expect(res.status).toBe(200);
    });
  });
});
