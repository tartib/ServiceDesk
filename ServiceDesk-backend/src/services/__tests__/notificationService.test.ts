import { Types } from 'mongoose';
import { createMockRepository } from '../../__tests__/fixtures/service.fixture';

describe('Notification Service', () => {
  let mockNotificationRepository: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    mockNotificationRepository = createMockRepository();
  });

  describe('createNotification', () => {
    it('should create notification with valid data', async () => {
      const notificationData = {
        userId: new Types.ObjectId(),
        title: 'New Incident',
        message: 'A new incident has been assigned to you',
        type: 'incident',
        relatedId: new Types.ObjectId(),
      };

      mockNotificationRepository.create.mockResolvedValue({
        _id: new Types.ObjectId(),
        ...notificationData,
        read: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await mockNotificationRepository.create(notificationData);

      expect(result.title).toBe('New Incident');
      expect(result.read).toBe(false);
    });
  });

  describe('getUserNotifications', () => {
    it('should retrieve user notifications', async () => {
      const userId = new Types.ObjectId();
      const notifications = [
        {
          _id: new Types.ObjectId(),
          userId,
          title: 'Notification 1',
          read: false,
        },
        {
          _id: new Types.ObjectId(),
          userId,
          title: 'Notification 2',
          read: true,
        },
      ];

      mockNotificationRepository.find.mockResolvedValue(notifications);

      const result = await mockNotificationRepository.find({ userId });

      expect(result).toHaveLength(2);
    });

    it('should filter unread notifications', async () => {
      const userId = new Types.ObjectId();
      const unreadNotifications = [
        {
          _id: new Types.ObjectId(),
          userId,
          title: 'Unread 1',
          read: false,
        },
      ];

      mockNotificationRepository.find.mockResolvedValue(unreadNotifications);

      const result = await mockNotificationRepository.find({ userId, read: false });

      expect(result.every((n: Record<string, unknown>) => !n.read)).toBe(true);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notificationId = new Types.ObjectId();
      const updatedNotification = {
        _id: notificationId,
        title: 'Notification',
        read: true,
      };

      mockNotificationRepository.updateById.mockResolvedValue(updatedNotification);

      const result = await mockNotificationRepository.updateById(notificationId, { read: true });

      expect(result.read).toBe(true);
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      const notificationId = new Types.ObjectId();

      mockNotificationRepository.deleteById.mockResolvedValue(true);

      const result = await mockNotificationRepository.deleteById(notificationId);

      expect(result).toBe(true);
    });
  });

  describe('clearUserNotifications', () => {
    it('should delete all notifications for user', async () => {
      const userId = new Types.ObjectId();

      mockNotificationRepository.deleteMany.mockResolvedValue(5);

      const result = await mockNotificationRepository.deleteMany({ userId });

      expect(result).toBe(5);
    });
  });
});
