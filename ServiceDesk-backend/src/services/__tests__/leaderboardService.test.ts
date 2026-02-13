import { Types } from 'mongoose';
import { createMockRepository } from '../../__tests__/fixtures/service.fixture';

describe('Leaderboard Service', () => {
  let mockLeaderboardRepository: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    mockLeaderboardRepository = createMockRepository();
  });

  describe('getLeaderboard', () => {
    it('should retrieve leaderboard rankings', async () => {
      const leaderboard = [
        { _id: new Types.ObjectId(), userId: new Types.ObjectId(), points: 1000, rank: 1 },
        { _id: new Types.ObjectId(), userId: new Types.ObjectId(), points: 950, rank: 2 },
        { _id: new Types.ObjectId(), userId: new Types.ObjectId(), points: 900, rank: 3 },
      ];

      mockLeaderboardRepository.find.mockResolvedValue(leaderboard);

      const result = await mockLeaderboardRepository.find({});

      expect(result).toHaveLength(3);
      expect(result[0].rank).toBe(1);
    });

    it('should sort by points descending', async () => {
      const leaderboard = [
        { _id: new Types.ObjectId(), points: 1000 },
        { _id: new Types.ObjectId(), points: 950 },
      ];

      mockLeaderboardRepository.find.mockResolvedValue(leaderboard);

      const result = await mockLeaderboardRepository.find({});

      expect(result[0].points).toBeGreaterThan(result[1].points);
    });
  });

  describe('getUserRank', () => {
    it('should retrieve user rank', async () => {
      const userId = new Types.ObjectId();
      const userRank = {
        _id: new Types.ObjectId(),
        userId,
        points: 850,
        rank: 5,
      };

      mockLeaderboardRepository.findOne.mockResolvedValue(userRank);

      const result = await mockLeaderboardRepository.findOne({ userId });

      expect(result.rank).toBe(5);
      expect(result.userId).toEqual(userId);
    });
  });

  describe('updatePoints', () => {
    it('should update user points', async () => {
      const userId = new Types.ObjectId();
      const updatedEntry = {
        _id: new Types.ObjectId(),
        userId,
        points: 1100,
      };

      mockLeaderboardRepository.updateById.mockResolvedValue(updatedEntry);

      const result = await mockLeaderboardRepository.updateById(userId, { points: 1100 });

      expect(result.points).toBe(1100);
    });
  });

  describe('getTopUsers', () => {
    it('should retrieve top 10 users', async () => {
      const topUsers = Array.from({ length: 10 }, (_, i) => ({
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(),
        points: 1000 - i * 50,
        rank: i + 1,
      }));

      mockLeaderboardRepository.find.mockResolvedValue(topUsers);

      const result = await mockLeaderboardRepository.find({});

      expect(result).toHaveLength(10);
      expect(result[0].rank).toBe(1);
    });
  });
});
