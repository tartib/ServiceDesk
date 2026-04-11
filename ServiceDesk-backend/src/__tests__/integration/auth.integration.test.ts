/// <reference types="jest" />
import request from 'supertest';
import app from '../../app';
import { setupTestDB } from '../helpers/testSetup';
import { seedUser, seedAllUsers, TestUser } from '../helpers/authHelper';

/**
 * Integration Tests for Auth API (v2)
 *
 * Deterministic: every assertion targets exactly one expected status code.
 * Uses dropAfterEach: false so users seeded in beforeAll persist.
 */

setupTestDB({ dropAfterEach: false });

let users: Record<string, TestUser>;

beforeAll(async () => {
  users = await seedAllUsers();
});

describe('Auth API — v2 Integration Tests', () => {
  // ============================================
  // REGISTER
  // ============================================
  describe('POST /api/v2/core/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const res = await request(app)
        .post('/api/v2/core/auth/register')
        .send({
          email: 'newuser@test.com',
          password: 'NewUser@123',
          firstName: 'New',
          lastName: 'User',
          organizationName: 'Test Org',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/v2/core/auth/register')
        .send({
          email: 'prep@test.com',
          password: 'Duplicate@123',
          firstName: 'Dup',
          lastName: 'User',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject weak password', async () => {
      const res = await request(app)
        .post('/api/v2/core/auth/register')
        .send({
          email: 'weak@test.com',
          password: 'short',
          firstName: 'Weak',
          lastName: 'Pass',
        });

      expect(res.status).toBe(400);
    });

    it('should reject missing email', async () => {
      const res = await request(app)
        .post('/api/v2/core/auth/register')
        .send({
          password: 'Valid@1234',
          firstName: 'No',
          lastName: 'Email',
        });

      expect(res.status).toBe(400);
    });
  });

  // ============================================
  // LOGIN
  // ============================================
  describe('POST /api/v2/core/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v2/core/auth/login')
        .send({ email: 'prep@test.com', password: 'Test@1234' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();
      expect(res.body.data.user).toBeDefined();
    });

    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/api/v2/core/auth/login')
        .send({ email: 'prep@test.com', password: 'WrongPassword@1' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject non-existent user', async () => {
      const res = await request(app)
        .post('/api/v2/core/auth/login')
        .send({ email: 'nobody@test.com', password: 'Any@1234' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid email format', async () => {
      const res = await request(app)
        .post('/api/v2/core/auth/login')
        .send({ email: 'not-an-email', password: 'Any@1234' });

      expect(res.status).toBe(400);
    });

    it('should reject empty password', async () => {
      const res = await request(app)
        .post('/api/v2/core/auth/login')
        .send({ email: 'prep@test.com', password: '' });

      expect(res.status).toBe(400);
    });
  });

  // ============================================
  // REFRESH TOKEN
  // ============================================
  describe('POST /api/v2/core/auth/refresh', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const loginRes = await request(app)
        .post('/api/v2/core/auth/login')
        .send({ email: 'prep@test.com', password: 'Test@1234' });

      expect(loginRes.status).toBe(200);
      const validRefreshToken = loginRes.body.data.tokens.refreshToken;

      const res = await request(app)
        .post('/api/v2/core/auth/refresh')
        .send({ refreshToken: validRefreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();
    });

    it('should reject invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/v2/core/auth/refresh')
        .send({ refreshToken: 'invalid-token-string' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject missing refresh token', async () => {
      const res = await request(app)
        .post('/api/v2/core/auth/refresh')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject revoked refresh token after logout', async () => {
      // Login to get tokens
      const loginRes = await request(app)
        .post('/api/v2/core/auth/login')
        .send({ email: 'prep@test.com', password: 'Test@1234' });

      expect(loginRes.status).toBe(200);
      const { accessToken, refreshToken } = loginRes.body.data.tokens;

      // Logout — invalidates refresh token
      const logoutRes = await request(app)
        .post('/api/v2/core/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(logoutRes.status).toBe(200);

      // Attempt refresh with revoked token
      const refreshRes = await request(app)
        .post('/api/v2/core/auth/refresh')
        .send({ refreshToken });

      expect(refreshRes.status).toBe(401);
      expect(refreshRes.body.success).toBe(false);
    });
  });

  // ============================================
  // GET ME
  // ============================================
  describe('GET /api/v2/core/auth/me', () => {
    it('should return user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/v2/core/auth/me')
        .set('Authorization', `Bearer ${users.manager.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it('should reject request without token', async () => {
      const res = await request(app).get('/api/v2/core/auth/me');

      expect(res.status).toBe(401);
    });

    it('should reject expired/invalid token', async () => {
      const res = await request(app)
        .get('/api/v2/core/auth/me')
        .set('Authorization', 'Bearer expired.invalid.token');

      expect(res.status).toBe(401);
    });
  });

  // ============================================
  // CHANGE PASSWORD
  // ============================================
  describe('POST /api/v2/core/auth/change-password', () => {
    it('should change password with correct current password', async () => {
      await seedUser({ name: 'ChangePass User', email: 'changepw@test.com', password: 'OldPass@123', role: 'prep' });

      const loginRes = await request(app)
        .post('/api/v2/core/auth/login')
        .send({ email: 'changepw@test.com', password: 'OldPass@123' });

      expect(loginRes.status).toBe(200);
      const token = loginRes.body.data.tokens.accessToken;

      const res = await request(app)
        .post('/api/v2/core/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'OldPass@123', newPassword: 'NewPass@123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject change with wrong current password', async () => {
      const loginRes = await request(app)
        .post('/api/v2/core/auth/login')
        .send({ email: 'changepw@test.com', password: 'NewPass@123' });

      expect(loginRes.status).toBe(200);
      const token = loginRes.body.data.tokens.accessToken;

      const res = await request(app)
        .post('/api/v2/core/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'WrongCurrent@1', newPassword: 'Another@123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should invalidate refresh token after password change', async () => {
      await seedUser({ name: 'PwInvalidate User', email: 'pwinvalidate@test.com', password: 'Start@1234', role: 'prep' });

      // Login to get tokens
      const loginRes = await request(app)
        .post('/api/v2/core/auth/login')
        .send({ email: 'pwinvalidate@test.com', password: 'Start@1234' });

      expect(loginRes.status).toBe(200);
      const { accessToken, refreshToken } = loginRes.body.data.tokens;

      // Change password
      const changeRes = await request(app)
        .post('/api/v2/core/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ currentPassword: 'Start@1234', newPassword: 'Changed@1234' });

      expect(changeRes.status).toBe(200);

      // Old refresh token should be rejected
      const refreshRes = await request(app)
        .post('/api/v2/core/auth/refresh')
        .send({ refreshToken });

      expect(refreshRes.status).toBe(401);
    });
  });

  // ============================================
  // RBAC — Role-based access control
  // ============================================
  describe('RBAC — Basic', () => {
    it('should reject unauthenticated access to protected routes', async () => {
      const res = await request(app).get('/api/v2/core/auth/me');

      expect(res.status).toBe(401);
    });

    it('prep user should be able to access own resources', async () => {
      const res = await request(app)
        .get('/api/v2/core/auth/me')
        .set('Authorization', `Bearer ${users.prep.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
