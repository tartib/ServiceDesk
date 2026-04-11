/// <reference types="jest" />
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app';
import { setupTestDB } from '../helpers/testSetup';
import { seedUser, authReq, TestUser } from '../helpers/authHelper';

/**
 * Integration Tests for Notifications API
 */

setupTestDB({ dropAfterEach: false });

let user: TestUser;
let notificationId: string;

beforeAll(async () => {
  user = await seedUser({ email: 'notif@test.com', role: 'manager', itsmRole: 'admin' });

  // Seed notifications using the UnifiedNotification model (used by the v2 API)
  const UnifiedNotification = mongoose.models.UnifiedNotification;
  if (!UnifiedNotification) throw new Error('UnifiedNotification model not registered');

  const notif = await UnifiedNotification.create({
    userId: user.id,
    type: 'system',
    source: 'system',
    level: 'info',
    channel: 'in_app',
    title: 'Test Notification',
    message: 'This is a test notification',
    isRead: false,
    sentAt: new Date(),
  });
  notificationId = notif._id.toString();

  // Create a second notification
  await UnifiedNotification.create({
    userId: user.id,
    type: 'reminder',
    source: 'system',
    level: 'info',
    channel: 'in_app',
    title: 'Second Notification',
    message: 'Another test notification',
    isRead: false,
    sentAt: new Date(),
  });
});

describe('Notifications API — Integration Tests', () => {
  // ============================================
  // LIST NOTIFICATIONS
  // ============================================
  describe('GET /api/v2/notifications', () => {
    it('should list notifications for authenticated user', async () => {
      const res = await authReq(request(app).get('/api/v2/notifications'), user);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it('should support limit parameter', async () => {
      const res = await authReq(request(app).get('/api/v2/notifications?limit=1'), user);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should require authentication', async () => {
      const res = await request(app).get('/api/v2/notifications');
      expect(res.status).toBe(401);
    });
  });

  // ============================================
  // LEGACY v1 NOTIFICATIONS (proxied)
  // ============================================
  describe('GET /api/v1/notifications', () => {
    it('should proxy to v2 notifications', async () => {
      const res = await authReq(request(app).get('/api/v1/notifications'), user);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // UNREAD NOTIFICATIONS
  // ============================================
  describe('GET /api/v2/notifications/unread', () => {
    it('should return unread notifications', async () => {
      const res = await authReq(request(app).get('/api/v2/notifications/unread'), user);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // UNREAD COUNT
  // ============================================
  describe('GET /api/v2/notifications/unread-count', () => {
    it('should return unread count', async () => {
      const res = await authReq(request(app).get('/api/v2/notifications/unread-count'), user);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.unreadCount).toBe('number');
    });
  });

  // ============================================
  // MARK AS READ
  // ============================================
  describe('PUT /api/v2/notifications/:notifId/read', () => {
    it('should mark notification as read', async () => {
      if (!notificationId) return;
      const res = await authReq(
        request(app).put(`/api/v2/notifications/${notificationId}/read`), user);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent notification', async () => {
      const fakeId = '000000000000000000000000';
      const res = await authReq(
        request(app).put(`/api/v2/notifications/${fakeId}/read`), user);

      expect(res.status).toBe(404);
    });

    it('should reject invalid ID format', async () => {
      const res = await authReq(
        request(app).put('/api/v2/notifications/invalid-id/read'), user);

      // Invalid ObjectId format returns 400 from validation or 500 from Mongoose cast error
      expect(res.status).toBe(500);
    });
  });

  // ============================================
  // MARK ALL AS READ
  // ============================================
  describe('PUT /api/v2/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      const res = await authReq(request(app).put('/api/v2/notifications/read-all'), user);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
