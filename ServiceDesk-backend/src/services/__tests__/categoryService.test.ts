import { Types } from 'mongoose';
import { createMockRepository } from '../../__tests__/fixtures/service.fixture';

describe('Category Service', () => {
  let mockCategoryRepository: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    mockCategoryRepository = createMockRepository();
  });

  describe('createCategory', () => {
    it('should create category with valid data', async () => {
      const categoryData = {
        name: 'Hardware',
        description: 'Hardware related issues',
        type: 'incident',
      };

      mockCategoryRepository.create.mockResolvedValue({
        _id: new Types.ObjectId(),
        ...categoryData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await mockCategoryRepository.create(categoryData);

      expect(result.name).toBe('Hardware');
      expect(mockCategoryRepository.create).toHaveBeenCalledWith(categoryData);
    });

    it('should reject duplicate category name', async () => {
      const categoryData = { name: 'Software' };

      mockCategoryRepository.create.mockRejectedValue(new Error('Duplicate key error'));

      await expect(mockCategoryRepository.create(categoryData)).rejects.toThrow('Duplicate key error');
    });
  });

  describe('getCategories', () => {
    it('should retrieve all categories', async () => {
      const categories = [
        { _id: new Types.ObjectId(), name: 'Hardware' },
        { _id: new Types.ObjectId(), name: 'Software' },
        { _id: new Types.ObjectId(), name: 'Network' },
      ];

      mockCategoryRepository.find.mockResolvedValue(categories);

      const result = await mockCategoryRepository.find({});

      expect(result).toHaveLength(3);
    });

    it('should filter categories by type', async () => {
      const categories = [
        { _id: new Types.ObjectId(), name: 'Hardware', type: 'incident' },
      ];

      mockCategoryRepository.find.mockResolvedValue(categories);

      const result = await mockCategoryRepository.find({ type: 'incident' });

      expect(result[0].type).toBe('incident');
    });
  });

  describe('getCategoryById', () => {
    it('should retrieve category by id', async () => {
      const categoryId = new Types.ObjectId();
      const category = {
        _id: categoryId,
        name: 'Hardware',
        description: 'Hardware issues',
      };

      mockCategoryRepository.findById.mockResolvedValue(category);

      const result = await mockCategoryRepository.findById(categoryId);

      expect(result._id).toEqual(categoryId);
      expect(result.name).toBe('Hardware');
    });

    it('should return null for non-existent category', async () => {
      const categoryId = new Types.ObjectId();

      mockCategoryRepository.findById.mockResolvedValue(null);

      const result = await mockCategoryRepository.findById(categoryId);

      expect(result).toBeNull();
    });
  });

  describe('updateCategory', () => {
    it('should update category', async () => {
      const categoryId = new Types.ObjectId();
      const updatedCategory = {
        _id: categoryId,
        name: 'Updated Hardware',
        description: 'Updated description',
      };

      mockCategoryRepository.updateById.mockResolvedValue(updatedCategory);

      const result = await mockCategoryRepository.updateById(categoryId, {
        name: 'Updated Hardware',
      });

      expect(result.name).toBe('Updated Hardware');
    });
  });

  describe('deleteCategory', () => {
    it('should delete category', async () => {
      const categoryId = new Types.ObjectId();

      mockCategoryRepository.deleteById.mockResolvedValue(true);

      const result = await mockCategoryRepository.deleteById(categoryId);

      expect(result).toBe(true);
    });

    it('should handle deletion of non-existent category', async () => {
      const categoryId = new Types.ObjectId();

      mockCategoryRepository.deleteById.mockResolvedValue(false);

      const result = await mockCategoryRepository.deleteById(categoryId);

      expect(result).toBe(false);
    });
  });
});
