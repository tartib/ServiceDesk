/// <reference types="jest" />
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../app';
import User from '../../models/User';
import jwt from 'jsonwebtoken';
import env from '../../config/env';

/**
 * Smoke Tests for Project Management Module
 * 
 * These tests verify the core workflows of the PM module:
 * 1. Organization management
 * 2. Project creation and retrieval
 * 3. Task management
 */

let mongoServer: MongoMemoryServer;
let authToken: string;
let userId: string;
let organizationId: string;
let projectId: string;
let taskId: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Create test user
  const user = await User.create({
    name: 'PM Test User',
    email: 'pm.test@example.com',
    password: 'password123',
    role: 'manager', // Assuming manager role has access
  });
  userId = user._id.toString();
  authToken = jwt.sign({ id: userId, role: 'manager' }, env.JWT_SECRET, { expiresIn: '1h' });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('🏗️ PM Module Smoke Tests', () => {
  
  // ============================================
  // Organization Tests
  // ============================================
  describe('Organization Management', () => {
    it('POST /api/v1/pm/organizations - should create a new organization', async () => {
      const res = await request(app)
        .post('/api/v1/pm/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Organization',
          description: 'Organization for smoke testing',
          industry: 'Technology'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      organizationId = res.body.data.organization._id;
    });

    it('GET /api/v1/pm/organizations - should list user organizations', async () => {
      const res = await request(app)
        .get('/api/v1/pm/organizations')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.organizations.length).toBeGreaterThan(0);
      expect(res.body.data.organizations[0]._id).toBe(organizationId);
    });
  });

  // ============================================
  // Project Tests
  // ============================================
  describe('Project Management', () => {
    it('POST /api/v1/pm/projects - should create a new project', async () => {
      const res = await request(app)
        .post('/api/v1/pm/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          organizationId: organizationId,
          name: 'Smoke Test Project',
          key: 'SMOKE',
          description: 'Project for smoke testing',
          methodology: 'scrum', // mapping to enum code
          settings: {
            visibility: 'private'
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      projectId = res.body.data.project._id;
    });

    it('GET /api/v1/pm/projects - should list projects', async () => {
      const res = await request(app)
        .get(`/api/v1/pm/projects?organizationId=${organizationId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.projects.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/pm/projects/:id - should get project details', async () => {
      const res = await request(app)
        .get(`/api/v1/pm/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      if (res.status !== 200) {
        console.error('Get project details failed:', JSON.stringify(res.body, null, 2));
      }

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.project.key).toBe('SMOKE');
    });
  });

  // ============================================
  // Task Tests
  // ============================================
  describe('Task Management', () => {
    it('POST /api/v1/pm/projects/:projectId/tasks - should create a new task', async () => {
      const res = await request(app)
        .post(`/api/v1/pm/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Smoke Test Task',
          description: 'Testing task creation',
          type: 'task',
          priority: 'medium',
          status: {
            id: 'todo-id',
            name: 'To Do',
            category: 'todo'
          }
        });
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      taskId = res.body.data.task._id;
    });

    it('POST /api/v1/pm/projects/:projectId/tasks - should create task with empty optional fields', async () => {
      const res = await request(app)
        .post(`/api/v1/pm/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Task with empty fields',
          type: 'epic',
          priority: 'medium',
          assignee: '',
          storyPoints: '',
          description: 'Testing empty optional fields'
        });
      
      if (res.status !== 201) {
        console.error('Create task with empty fields failed:', JSON.stringify(res.body, null, 2));
      }

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task.assignee).toBeUndefined();
      expect(res.body.data.task.storyPoints).toBeUndefined();
    });

    it('GET /api/v1/pm/tasks/:id - should retrieve task details', async () => {
      const res = await request(app)
        .get(`/api/v1/pm/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task.title).toBe('Smoke Test Task');
    });

    it('PUT /api/v1/pm/tasks/:id - should update task with empty optional fields', async () => {
      const res = await request(app)
        .put(`/api/v1/pm/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assignee: '',
          storyPoints: ''
        });

      if (res.status !== 200) {
        console.error('Update task with empty fields failed:', JSON.stringify(res.body, null, 2));
      }

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Depending on implementation, it might be null or undefined in the response
      const task = res.body.data.task;
      expect(task.assignee).toBeFalsy();
      expect(task.storyPoints).toBeFalsy();
    });

    it('PUT /api/v1/pm/tasks/:id - should update task dates with empty values', async () => {
      const res = await request(app)
        .put(`/api/v1/pm/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          dueDate: '',
          startDate: ''
        });

      if (res.status !== 200) {
        console.error('Update task with empty dates failed:', JSON.stringify(res.body, null, 2));
      }

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const task = res.body.data.task;
      expect(task.dueDate).toBeFalsy();
      expect(task.startDate).toBeFalsy();
    });

    it('PUT /api/v1/pm/tasks/:id - should update task', async () => {
      const res = await request(app)
        .put(`/api/v1/pm/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Updated description'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task.description).toBe('Updated description');
    });

    it('POST /api/v1/pm/tasks/:id/move - should perform unrestricted status transition', async () => {
      // Attempt to move task directly from current status (likely Backlog/Todo) to Done
      // This transition might not exist in standard workflow but should be allowed now
      const res = await request(app)
        .post(`/api/v1/pm/tasks/${taskId}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          statusId: 'done' // Assuming 'done' is a valid status ID in the default workflow
        });

      if (res.status !== 200) {
        console.error('Move task failed:', JSON.stringify(res.body, null, 2));
      }

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task.status.id).toBe('done');
    });
  });

  // ============================================
  // Activity Tests
  // ============================================
  describe('Activity Feed', () => {
    it('GET /api/v1/pm/projects/:projectId/activity - should get project activity', async () => {
      const res = await request(app)
        .get(`/api/v1/pm/projects/${projectId}/activity`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.activities)).toBe(true);
    });

    it('GET /api/v1/pm/tasks/:taskId/activity - should get task activity', async () => {
      const res = await request(app)
        .get(`/api/v1/pm/tasks/${taskId}/activity`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.activities)).toBe(true);
    });

    it('GET /api/v1/pm/me/activity - should get user activity', async () => {
      const res = await request(app)
        .get('/api/v1/pm/me/activity')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.activities)).toBe(true);
    });

    it('GET /api/v1/pm/feed - should get organization feed', async () => {
      const res = await request(app)
        .get('/api/v1/pm/feed')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.activities)).toBe(true);
    });
  });

  // ============================================
  // Sprint Tests
  // ============================================
  describe('Sprint Management', () => {
    let sprintId: string;

    it('POST /api/v1/pm/projects/:projectId/sprints - should create a new sprint', async () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14); // 2 weeks sprint

      const res = await request(app)
        .post(`/api/v1/pm/projects/${projectId}/sprints`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Organization-ID', organizationId)
        .send({
          name: 'Sprint 1',
          goal: 'First sprint goal',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      sprintId = res.body.data.sprint._id;
    });

    it('GET /api/v1/pm/projects/:projectId/sprints - should list project sprints', async () => {
      const res = await request(app)
        .get(`/api/v1/pm/projects/${projectId}/sprints`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Organization-ID', organizationId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.sprints)).toBe(true);
      expect(res.body.data.sprints.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/pm/sprints/:sprintId - should get sprint details', async () => {
      const res = await request(app)
        .get(`/api/v1/pm/sprints/${sprintId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Organization-ID', organizationId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sprint.name).toBe('Sprint 1');
    });
  });

  // ============================================
  // Board Tests
  // ============================================
  describe('Board Management', () => {
    it('GET /api/v1/pm/projects/:projectId/board/config - should get board configuration', async () => {
      const res = await request(app)
        .get(`/api/v1/pm/projects/${projectId}/board/config`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Organization-ID', organizationId);

      // Note: Board might be auto-created or return default config
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.board).toBeDefined();
    });

    it('POST /api/v1/pm/projects/:projectId/board/columns - should create a board column', async () => {
      const res = await request(app)
        .post(`/api/v1/pm/projects/${projectId}/board/columns`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Organization-ID', organizationId)
        .send({
          name: 'QA Review',
          wipLimit: 5
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.board).toBeDefined();
      const columns = res.body.data.board.columns;
      const newColumn = columns.find((c: any) => c.name === 'QA Review');
      expect(newColumn).toBeDefined();
      expect(newColumn.wipLimit).toBe(5);
    });
  });
});
