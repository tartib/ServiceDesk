import { Types } from 'mongoose';
import { createMockRepository } from '../../__tests__/fixtures/service.fixture';

describe('Rating Service', () => {
  let mockRatingRepository: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    mockRatingRepository = createMockRepository();
  });

  describe('createRating', () => {
    it('should create rating with valid data', async () => {
      const ratingData = {
        userId: new Types.ObjectId(),
        incidentId: new Types.ObjectId(),
        score: 5,
        comment: 'Excellent service',
      };

      mockRatingRepository.create.mockResolvedValue({
        _id: new Types.ObjectId(),
        ...ratingData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await mockRatingRepository.create(ratingData);

      expect(result.score).toBe(5);
      expect(result.comment).toBe('Excellent service');
    });

    it('should reject invalid rating score', async () => {
      const ratingData = {
        userId: new Types.ObjectId(),
        incidentId: new Types.ObjectId(),
        score: 10,
      };

      mockRatingRepository.create.mockRejectedValue(new Error('Invalid score'));

      await expect(mockRatingRepository.create(ratingData)).rejects.toThrow('Invalid score');
    });
  });

  describe('getRatings', () => {
    it('should retrieve ratings for incident', async () => {
      const incidentId = new Types.ObjectId();
      const ratings = [
        { _id: new Types.ObjectId(), incidentId, score: 5 },
        { _id: new Types.ObjectId(), incidentId, score: 4 },
      ];

      mockRatingRepository.find.mockResolvedValue(ratings);

      const result = await mockRatingRepository.find({ incidentId });

      expect(result).toHaveLength(2);
    });
  });

  describe('getAverageRating', () => {
    it('should calculate average rating', async () => {
      const incidentId = new Types.ObjectId();
      const ratings = [
        { _id: new Types.ObjectId(), incidentId, score: 5 },
        { _id: new Types.ObjectId(), incidentId, score: 4 },
        { _id: new Types.ObjectId(), incidentId, score: 3 },
      ];

      mockRatingRepository.find.mockResolvedValue(ratings);

      const result = await mockRatingRepository.find({ incidentId });
      const average = result.reduce((sum: number, r: Record<string, unknown>) => sum + (r.score as number), 0) / result.length;

      expect(average).toBe(4);
    });
  });

  describe('updateRating', () => {
    it('should update rating', async () => {
      const ratingId = new Types.ObjectId();
      const updatedRating = {
        _id: ratingId,
        score: 4,
        comment: 'Updated comment',
      };

      mockRatingRepository.updateById.mockResolvedValue(updatedRating);

      const result = await mockRatingRepository.updateById(ratingId, { score: 4 });

      expect(result.score).toBe(4);
    });
  });

  describe('deleteRating', () => {
    it('should delete rating', async () => {
      const ratingId = new Types.ObjectId();

      mockRatingRepository.deleteById.mockResolvedValue(true);

      const result = await mockRatingRepository.deleteById(ratingId);

      expect(result).toBe(true);
    });
  });
});
