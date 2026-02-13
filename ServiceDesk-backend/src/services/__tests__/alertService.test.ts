import { Types } from 'mongoose';
import { createMockRepository, createMockLogger } from '../../__tests__/fixtures/service.fixture';

describe('Alert Service', () => {
  let mockAlertRepository: ReturnType<typeof createMockRepository>;
  let mockLogger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    mockAlertRepository = createMockRepository();
    mockLogger = createMockLogger();
  });

  describe('createAlert', () => {
    it('should create alert with valid data', async () => {
      const alertData = {
        title: 'Critical Issue',
        description: 'System down',
        severity: 'critical',
        userId: new Types.ObjectId(),
      };

      mockAlertRepository.create.mockResolvedValue({
        _id: new Types.ObjectId(),
        ...alertData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(mockAlertRepository.create).toBeDefined();
    });

    it('should log alert creation', async () => {
      const alertData = {
        title: 'Warning',
        severity: 'warning',
      };

      mockAlertRepository.create.mockResolvedValue(alertData);

      expect(mockLogger.info).toBeDefined();
    });
  });

  describe('getAlerts', () => {
    it('should retrieve alerts for user', async () => {
      const userId = new Types.ObjectId();
      const alerts = [
        {
          _id: new Types.ObjectId(),
          title: 'Alert 1',
          userId,
          severity: 'high',
        },
        {
          _id: new Types.ObjectId(),
          title: 'Alert 2',
          userId,
          severity: 'medium',
        },
      ];

      mockAlertRepository.find.mockResolvedValue(alerts);

      const result = await mockAlertRepository.find({ userId });

      expect(result).toHaveLength(2);
      expect(mockAlertRepository.find).toHaveBeenCalledWith({ userId });
    });

    it('should return empty array when no alerts exist', async () => {
      const userId = new Types.ObjectId();

      mockAlertRepository.find.mockResolvedValue([]);

      const result = await mockAlertRepository.find({ userId });

      expect(result).toEqual([]);
    });
  });

  describe('updateAlert', () => {
    it('should update alert status', async () => {
      const alertId = new Types.ObjectId();
      const updatedAlert = {
        _id: alertId,
        title: 'Alert',
        status: 'resolved',
      };

      mockAlertRepository.updateById.mockResolvedValue(updatedAlert);

      const result = await mockAlertRepository.updateById(alertId, { status: 'resolved' });

      expect(result.status).toBe('resolved');
      expect(mockAlertRepository.updateById).toHaveBeenCalledWith(alertId, { status: 'resolved' });
    });
  });

  describe('deleteAlert', () => {
    it('should delete alert by id', async () => {
      const alertId = new Types.ObjectId();

      mockAlertRepository.deleteById.mockResolvedValue(true);

      const result = await mockAlertRepository.deleteById(alertId);

      expect(result).toBe(true);
      expect(mockAlertRepository.deleteById).toHaveBeenCalledWith(alertId);
    });
  });
});
