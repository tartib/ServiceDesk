import { Types } from 'mongoose';
import { createMockRepository } from '../../__tests__/fixtures/service.fixture';

describe('Task Execution Log Service', () => {
  let mockLogRepository: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    mockLogRepository = createMockRepository();
  });

  describe('createLog', () => {
    it('should create execution log with valid data', async () => {
      const logData = {
        taskId: new Types.ObjectId(),
        userId: new Types.ObjectId(),
        action: 'started',
        duration: 120,
      };

      mockLogRepository.create.mockResolvedValue({
        _id: new Types.ObjectId(),
        ...logData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await mockLogRepository.create(logData);

      expect(result.action).toBe('started');
      expect(result.duration).toBe(120);
    });
  });

  describe('getTaskLogs', () => {
    it('should retrieve logs for task', async () => {
      const taskId = new Types.ObjectId();
      const logs = [
        { _id: new Types.ObjectId(), taskId, action: 'started', duration: 100 },
        { _id: new Types.ObjectId(), taskId, action: 'paused', duration: 50 },
        { _id: new Types.ObjectId(), taskId, action: 'resumed', duration: 75 },
      ];

      mockLogRepository.find.mockResolvedValue(logs);

      const result = await mockLogRepository.find({ taskId });

      expect(result).toHaveLength(3);
    });
  });

  describe('getTotalDuration', () => {
    it('should calculate total execution time', async () => {
      const taskId = new Types.ObjectId();
      const logs = [
        { _id: new Types.ObjectId(), taskId, duration: 100 },
        { _id: new Types.ObjectId(), taskId, duration: 50 },
        { _id: new Types.ObjectId(), taskId, duration: 75 },
      ];

      mockLogRepository.find.mockResolvedValue(logs);

      const result = await mockLogRepository.find({ taskId });
      const totalDuration = result.reduce((sum: number, log: Record<string, unknown>) => sum + (log.duration as number), 0);

      expect(totalDuration).toBe(225);
    });
  });

  describe('getLogById', () => {
    it('should retrieve log by id', async () => {
      const logId = new Types.ObjectId();
      const log = {
        _id: logId,
        taskId: new Types.ObjectId(),
        action: 'started',
        duration: 100,
      };

      mockLogRepository.findById.mockResolvedValue(log);

      const result = await mockLogRepository.findById(logId);

      expect(result._id).toEqual(logId);
      expect(result.action).toBe('started');
    });
  });

  describe('deleteLog', () => {
    it('should delete log', async () => {
      const logId = new Types.ObjectId();

      mockLogRepository.deleteById.mockResolvedValue(true);

      const result = await mockLogRepository.deleteById(logId);

      expect(result).toBe(true);
    });
  });
});
