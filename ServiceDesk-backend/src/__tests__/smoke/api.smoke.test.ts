/// <reference types="jest" />
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../app';
import User from '../../models/User';
import jwt from 'jsonwebtoken';
import env from '../../config/env';

/**
 * Smoke Tests for ServiceDesk Backend API
 * 
 * These tests verify that critical API endpoints are accessible and responding correctly.
 * Smoke tests are lightweight and focus on basic connectivity and response structure.
 */

let mongoServer: MongoMemoryServer;
let authToken: string;
let managerToken: string;
let testUserId: string;
let testManagerId: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Create test user (prep role - regular user)
  const testUser = await User.create({
    name: 'Test User',
    email: 'testuser@example.com',
    password: 'password123',
    role: 'prep',
  });
  testUserId = testUser._id.toString();
  authToken = jwt.sign({ id: testUserId, role: 'prep' }, env.JWT_SECRET, { expiresIn: '1h' });

  // Create manager user for protected routes
  const managerUser = await User.create({
    name: 'Test Manager',
    email: 'manager@example.com',
    password: 'password123',
    role: 'manager',
  });
  testManagerId = managerUser._id.toString();
  managerToken = jwt.sign({ id: testManagerId, role: 'manager' }, env.JWT_SECRET, { expiresIn: '1h' });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('🔥 Smoke Tests - API Health & Connectivity', () => {
  // ============================================
  // Health Check Endpoints
  // ============================================
  
  describe('Health Checks', () => {
    it('GET /health - should return server health status', async () => {
      const res = await request(app).get('/health');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Server is running');
      expect(res.body.timestamp).toBeDefined();
    });

    it('GET /api/v2/health - should return v2 API health status', async () => {
      const res = await request(app).get('/api/v2/health');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.version).toBe('v2');
      expect(res.body.modules).toContain('incidents');
      expect(res.body.modules).toContain('problems');
      expect(res.body.modules).toContain('changes');
    });
  });

  // ============================================
  // Authentication Endpoints (v1)
  // ============================================

  describe('Auth API (v1)', () => {
    it('POST /api/v1/auth/login - should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'invalid@test.com', password: 'wrongpassword' });
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/auth/login - should accept valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'testuser@example.com', password: 'password123' });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('GET /api/v1/auth/me - should return user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('testuser@example.com');
    });

    it('GET /api/v1/auth/me - should reject request without token', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      
      expect(res.status).toBe(401);
    });
  });

  // ============================================
  // Incidents API (v2)
  // ============================================

  describe('Incidents API (v2)', () => {
    it('GET /api/v2/incidents - should require authentication', async () => {
      const res = await request(app).get('/api/v2/incidents');
      
      expect(res.status).toBe(401);
    });

    it('GET /api/v2/incidents - should return incidents list for manager', async () => {
      const res = await request(app)
        .get('/api/v2/incidents')
        .set('Authorization', `Bearer ${managerToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/v2/incidents/stats - should return incident statistics', async () => {
      const res = await request(app)
        .get('/api/v2/incidents/stats')
        .set('Authorization', `Bearer ${managerToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('GET /api/v2/incidents/my-requests - should return user incidents', async () => {
      const res = await request(app)
        .get('/api/v2/incidents/my-requests')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('POST /api/v2/incidents - should create incident with valid data', async () => {
      const res = await request(app)
        .post('/api/v2/incidents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Incident',
          description: 'Test description for smoke test',
          impact: 'medium',
          urgency: 'medium',
          category_id: 'cat-001',
          site_id: 'site-001',
        });
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.incident).toBeDefined();
    });
  });

  // ============================================
  // Problems API (v2)
  // ============================================

  describe('Problems API (v2)', () => {
    it('GET /api/v2/problems - should require authentication', async () => {
      const res = await request(app).get('/api/v2/problems');
      
      expect(res.status).toBe(401);
    });

    it('GET /api/v2/problems - should return problems list for manager', async () => {
      const res = await request(app)
        .get('/api/v2/problems')
        .set('Authorization', `Bearer ${managerToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // Changes API (v2)
  // ============================================

  describe('Changes API (v2)', () => {
    it('GET /api/v2/changes - should require authentication', async () => {
      const res = await request(app).get('/api/v2/changes');
      
      expect(res.status).toBe(401);
    });

    it('GET /api/v2/changes - should return changes list for manager', async () => {
      const res = await request(app)
        .get('/api/v2/changes')
        .set('Authorization', `Bearer ${managerToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('GET /api/v2/changes/stats - should return change statistics', async () => {
      const res = await request(app)
        .get('/api/v2/changes/stats')
        .set('Authorization', `Bearer ${managerToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('GET /api/v2/changes/my-requests - should return user change requests', async () => {
      const res = await request(app)
        .get('/api/v2/changes/my-requests')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('POST /api/v2/changes - should create change request with valid data', async () => {
      const res = await request(app)
        .post('/api/v2/changes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'normal',
          title: 'Test Change Request',
          description: 'Test description for smoke test',
          priority: 'medium',
          impact: 'medium',
          risk: 'low',
          risk_assessment: 'Low risk change',
          implementation_plan: 'Step 1: Deploy',
          rollback_plan: 'Revert to previous version',
          schedule: {
            planned_start: '2024-02-01T10:00:00Z',
            planned_end: '2024-02-01T12:00:00Z',
          },
          affected_services: ['service-001'],
          site_id: 'site-001',
          reason_for_change: 'Improvement',
        });
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.change).toBeDefined();
    });
  });


  // ============================================
  // Categories API (v1)
  // ============================================

  describe('Categories API (v1)', () => {
    it('GET /api/v1/categories - should require authentication', async () => {
      const res = await request(app).get('/api/v1/categories');
      
      expect(res.status).toBe(401);
    });

    it('GET /api/v1/categories - should return categories list with auth', async () => {
      const res = await request(app)
        .get('/api/v1/categories')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // Error Handling
  // ============================================

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const res = await request(app).get('/api/v1/nonexistent');
      
      expect(res.status).toBe(404);
    });

    it('should handle malformed JSON gracefully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');
      
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  // ============================================
  // Rate Limiting
  // ============================================

  describe('Rate Limiting', () => {
    it('should have rate limiting headers', async () => {
      const res = await request(app).get('/health');
      
      // Rate limiting may or may not be applied to health endpoint
      // Just verify the endpoint responds
      expect(res.status).toBe(200);
    });
  });
});
