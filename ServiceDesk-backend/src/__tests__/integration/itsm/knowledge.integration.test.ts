/// <reference types="jest" />
import request from 'supertest';
import app from '../../../app';
import { setupTestDB } from '../../helpers/testSetup';
import { seedUser, authReq, TestUser } from '../../helpers/authHelper';
import { createKnowledgeArticlePayload } from '../../fixtures/itsm.fixture';

/**
 * Integration Tests for ITSM Knowledge Base API
 */

setupTestDB({ dropAfterEach: false });

let managerUser: TestUser;
let techUser: TestUser;
let endUser: TestUser;
let articleId: string;

beforeAll(async () => {
  managerUser = await seedUser({ email: 'mgr@kb.test', role: 'manager', itsmRole: 'admin' });
  techUser = await seedUser({ email: 'tech@kb.test', role: 'supervisor', itsmRole: 'technician' });
  endUser = await seedUser({ email: 'user@kb.test', role: 'prep', itsmRole: 'end_user' });
});

describe('ITSM Knowledge Base — Integration Tests', () => {
  // ============================================
  // CREATE ARTICLE
  // ============================================
  describe('POST /api/v2/itsm/knowledge', () => {
    it('should create a knowledge article', async () => {
      const res = await authReq(request(app).post('/api/v2/itsm/knowledge'), techUser)
        .send(createKnowledgeArticlePayload());

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      articleId = res.body.data?.article_id || res.body.data?.article?.article_id || res.body.data?._id;
    });

    it('should create another article for search testing', async () => {
      const res = await authReq(request(app).post('/api/v2/itsm/knowledge'), techUser)
        .send(createKnowledgeArticlePayload({
          title: 'VPN Connection Guide',
          content: 'Step 1: Download the VPN client. Step 2: Enter your credentials. Step 3: Connect.',
          category_id: 'networking',
          tags: ['vpn', 'remote-work'],
        }));

      expect(res.status).toBe(201);
    });

    it('should reject without authentication', async () => {
      const res = await request(app)
        .post('/api/v2/itsm/knowledge')
        .send(createKnowledgeArticlePayload());

      expect(res.status).toBe(401);
    });
  });

  // ============================================
  // LIST ARTICLES
  // ============================================
  describe('GET /api/v2/itsm/knowledge', () => {
    it('should list articles', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/knowledge'), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should list articles with pagination', async () => {
      const res = await authReq(
        request(app).get('/api/v2/itsm/knowledge?page=1&limit=5'), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // GET SINGLE ARTICLE
  // ============================================
  describe('GET /api/v2/itsm/knowledge/:id', () => {
    it('should get article by id', async () => {
      if (!articleId) return;
      const res = await authReq(
        request(app).get(`/api/v2/itsm/knowledge/${articleId}`), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent article', async () => {
      const res = await authReq(
        request(app).get('/api/v2/itsm/knowledge/KB-NONEXISTENT-999'), techUser);

      expect(res.status).toBe(404);
    });
  });

  // ============================================
  // SEARCH
  // ============================================
  describe('GET /api/v2/itsm/knowledge/search', () => {
    it('should search articles by keyword', async () => {
      const res = await authReq(
        request(app).get('/api/v2/itsm/knowledge/search?q=password'), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 without query param', async () => {
      const res = await authReq(
        request(app).get('/api/v2/itsm/knowledge/search'), techUser);

      expect(res.status).toBe(400);
    });
  });

  // ============================================
  // FEATURED & POPULAR
  // ============================================
  describe('GET /api/v2/itsm/knowledge/featured', () => {
    it('should return featured articles', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/knowledge/featured'), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v2/itsm/knowledge/popular', () => {
    it('should return popular articles', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/knowledge/popular'), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // STATS
  // ============================================
  describe('GET /api/v2/itsm/knowledge/stats', () => {
    it('should return knowledge base stats', async () => {
      const res = await authReq(request(app).get('/api/v2/itsm/knowledge/stats'), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // UPDATE ARTICLE
  // ============================================
  describe('PUT /api/v2/itsm/knowledge/:id', () => {
    it('should update article', async () => {
      if (!articleId) return;
      const res = await authReq(
        request(app).put(`/api/v2/itsm/knowledge/${articleId}`), techUser)
        .send({ title: 'How to Reset Your Password (Updated)', tags: ['password', 'self-service', 'updated'] });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // PUBLISH
  // ============================================
  describe('POST /api/v2/itsm/knowledge/:id/publish', () => {
    it('should publish article', async () => {
      if (!articleId) return;
      const res = await authReq(
        request(app).post(`/api/v2/itsm/knowledge/${articleId}/publish`), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // FEEDBACK
  // ============================================
  describe('POST /api/v2/itsm/knowledge/:id/feedback', () => {
    it('should submit helpful feedback', async () => {
      if (!articleId) return;
      const res = await authReq(
        request(app).post(`/api/v2/itsm/knowledge/${articleId}/feedback`), endUser)
        .send({ helpful: true, rating: 5 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should submit not-helpful feedback', async () => {
      if (!articleId) return;
      const res = await authReq(
        request(app).post(`/api/v2/itsm/knowledge/${articleId}/feedback`), techUser)
        .send({ helpful: false, rating: 2 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // ARCHIVE
  // ============================================
  describe('POST /api/v2/itsm/knowledge/:id/archive', () => {
    it('should archive article', async () => {
      if (!articleId) return;
      const res = await authReq(
        request(app).post(`/api/v2/itsm/knowledge/${articleId}/archive`), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // DELETE ARTICLE
  // ============================================
  describe('DELETE /api/v2/itsm/knowledge/:id', () => {
    it('should delete article', async () => {
      // Create one to delete
      const createRes = await authReq(request(app).post('/api/v2/itsm/knowledge'), techUser)
        .send(createKnowledgeArticlePayload({ title: 'Article to delete', content: 'This article will be deleted for testing purposes' }));
      const delId = createRes.body.data?.article_id || createRes.body.data?.article?.article_id || createRes.body.data?._id;
      if (!delId) return;

      const res = await authReq(
        request(app).delete(`/api/v2/itsm/knowledge/${delId}`), techUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
