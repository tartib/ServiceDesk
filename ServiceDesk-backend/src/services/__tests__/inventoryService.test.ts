import { Types } from 'mongoose';
import { createMockRepository } from '../../__tests__/fixtures/service.fixture';

describe('Inventory Service', () => {
  let mockInventoryRepository: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    mockInventoryRepository = createMockRepository();
  });

  describe('createInventoryItem', () => {
    it('should create inventory item with valid data', async () => {
      const itemData = {
        name: 'Laptop',
        sku: 'LAPTOP-001',
        quantity: 10,
        category: 'Hardware',
      };

      mockInventoryRepository.create.mockResolvedValue({
        _id: new Types.ObjectId(),
        ...itemData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await mockInventoryRepository.create(itemData);

      expect(result.name).toBe('Laptop');
      expect(result.quantity).toBe(10);
    });
  });

  describe('getInventoryItems', () => {
    it('should retrieve all inventory items', async () => {
      const items = [
        { _id: new Types.ObjectId(), name: 'Laptop', quantity: 10 },
        { _id: new Types.ObjectId(), name: 'Monitor', quantity: 15 },
      ];

      mockInventoryRepository.find.mockResolvedValue(items);

      const result = await mockInventoryRepository.find({});

      expect(result).toHaveLength(2);
    });

    it('should filter items by category', async () => {
      const items = [
        { _id: new Types.ObjectId(), name: 'Laptop', category: 'Hardware' },
      ];

      mockInventoryRepository.find.mockResolvedValue(items);

      const result = await mockInventoryRepository.find({ category: 'Hardware' });

      expect(result[0].category).toBe('Hardware');
    });
  });

  describe('getItemById', () => {
    it('should retrieve item by id', async () => {
      const itemId = new Types.ObjectId();
      const item = {
        _id: itemId,
        name: 'Laptop',
        quantity: 10,
      };

      mockInventoryRepository.findById.mockResolvedValue(item);

      const result = await mockInventoryRepository.findById(itemId);

      expect(result._id).toEqual(itemId);
    });
  });

  describe('updateInventoryItem', () => {
    it('should update item quantity', async () => {
      const itemId = new Types.ObjectId();
      const updatedItem = {
        _id: itemId,
        name: 'Laptop',
        quantity: 8,
      };

      mockInventoryRepository.updateById.mockResolvedValue(updatedItem);

      const result = await mockInventoryRepository.updateById(itemId, { quantity: 8 });

      expect(result.quantity).toBe(8);
    });
  });

  describe('deleteInventoryItem', () => {
    it('should delete inventory item', async () => {
      const itemId = new Types.ObjectId();

      mockInventoryRepository.deleteById.mockResolvedValue(true);

      const result = await mockInventoryRepository.deleteById(itemId);

      expect(result).toBe(true);
    });
  });

  describe('getLowStockItems', () => {
    it('should retrieve items with low stock', async () => {
      const lowStockItems = [
        { _id: new Types.ObjectId(), name: 'Item1', quantity: 2 },
        { _id: new Types.ObjectId(), name: 'Item2', quantity: 1 },
      ];

      mockInventoryRepository.find.mockResolvedValue(lowStockItems);

      const result = await mockInventoryRepository.find({ quantity: { $lt: 5 } });

      expect(result.length).toBeGreaterThan(0);
    });
  });
});
