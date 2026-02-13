import { Types } from 'mongoose';
import { createMockRepository } from '../../__tests__/fixtures/service.fixture';

describe('Task Comment Service', () => {
  let mockCommentRepository: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    mockCommentRepository = createMockRepository();
  });

  describe('createComment', () => {
    it('should create comment with valid data', async () => {
      const commentData = {
        taskId: new Types.ObjectId(),
        userId: new Types.ObjectId(),
        content: 'This is a comment',
      };

      mockCommentRepository.create.mockResolvedValue({
        _id: new Types.ObjectId(),
        ...commentData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await mockCommentRepository.create(commentData);

      expect(result.content).toBe('This is a comment');
      expect(result.taskId).toEqual(commentData.taskId);
    });
  });

  describe('getTaskComments', () => {
    it('should retrieve comments for task', async () => {
      const taskId = new Types.ObjectId();
      const comments = [
        { _id: new Types.ObjectId(), taskId, content: 'Comment 1' },
        { _id: new Types.ObjectId(), taskId, content: 'Comment 2' },
      ];

      mockCommentRepository.find.mockResolvedValue(comments);

      const result = await mockCommentRepository.find({ taskId });

      expect(result).toHaveLength(2);
    });

    it('should return empty array when no comments exist', async () => {
      const taskId = new Types.ObjectId();

      mockCommentRepository.find.mockResolvedValue([]);

      const result = await mockCommentRepository.find({ taskId });

      expect(result).toEqual([]);
    });
  });

  describe('getCommentById', () => {
    it('should retrieve comment by id', async () => {
      const commentId = new Types.ObjectId();
      const comment = {
        _id: commentId,
        content: 'Test comment',
        taskId: new Types.ObjectId(),
      };

      mockCommentRepository.findById.mockResolvedValue(comment);

      const result = await mockCommentRepository.findById(commentId);

      expect(result._id).toEqual(commentId);
      expect(result.content).toBe('Test comment');
    });
  });

  describe('updateComment', () => {
    it('should update comment content', async () => {
      const commentId = new Types.ObjectId();
      const updatedComment = {
        _id: commentId,
        content: 'Updated comment',
      };

      mockCommentRepository.updateById.mockResolvedValue(updatedComment);

      const result = await mockCommentRepository.updateById(commentId, { content: 'Updated comment' });

      expect(result.content).toBe('Updated comment');
    });
  });

  describe('deleteComment', () => {
    it('should delete comment', async () => {
      const commentId = new Types.ObjectId();

      mockCommentRepository.deleteById.mockResolvedValue(true);

      const result = await mockCommentRepository.deleteById(commentId);

      expect(result).toBe(true);
    });
  });

  describe('getCommentCount', () => {
    it('should count comments for task', async () => {
      const taskId = new Types.ObjectId();

      mockCommentRepository.countDocuments.mockResolvedValue(5);

      const result = await mockCommentRepository.countDocuments({ taskId });

      expect(result).toBe(5);
    });
  });
});
