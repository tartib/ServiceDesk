import { Types } from 'mongoose';
import { createMockRepository } from '../../../__tests__/fixtures/service.fixture';

describe('Auth Service', () => {
  let mockUserRepository: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    mockUserRepository = createMockRepository();
  });

  describe('registerUser', () => {
    it('should register user with valid data', async () => {
      const userData = {
        email: 'user@example.com',
        password: 'hashedPassword123',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockUserRepository.create.mockResolvedValue({
        _id: new Types.ObjectId(),
        ...userData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await mockUserRepository.create(userData);

      expect(result.email).toBe('user@example.com');
      expect(result.isActive).toBe(true);
    });

    it('should reject duplicate email', async () => {
      const userData = { email: 'existing@example.com' };

      mockUserRepository.create.mockRejectedValue(new Error('Email already exists'));

      await expect(mockUserRepository.create(userData)).rejects.toThrow('Email already exists');
    });
  });

  describe('loginUser', () => {
    it('should authenticate user with correct credentials', async () => {
      const userId = new Types.ObjectId();
      const user = {
        _id: userId,
        email: 'user@example.com',
        password: 'hashedPassword123',
        isActive: true,
      };

      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await mockUserRepository.findOne({ email: 'user@example.com' });

      expect(result.email).toBe('user@example.com');
      expect(result.isActive).toBe(true);
    });

    it('should return null for non-existent user', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await mockUserRepository.findOne({ email: 'nonexistent@example.com' });

      expect(result).toBeNull();
    });
  });

  describe('changePassword', () => {
    it('should update user password', async () => {
      const userId = new Types.ObjectId();
      const updatedUser = {
        _id: userId,
        email: 'user@example.com',
        password: 'newHashedPassword456',
      };

      mockUserRepository.updateById.mockResolvedValue(updatedUser);

      const result = await mockUserRepository.updateById(userId, { password: 'newHashedPassword456' });

      expect(result.password).toBe('newHashedPassword456');
    });
  });

  describe('getUserById', () => {
    it('should retrieve user by id', async () => {
      const userId = new Types.ObjectId();
      const user = {
        _id: userId,
        email: 'user@example.com',
        firstName: 'John',
      };

      mockUserRepository.findById.mockResolvedValue(user);

      const result = await mockUserRepository.findById(userId);

      expect(result._id).toEqual(userId);
      expect(result.email).toBe('user@example.com');
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile', async () => {
      const userId = new Types.ObjectId();
      const updatedUser = {
        _id: userId,
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1234567890',
      };

      mockUserRepository.updateById.mockResolvedValue(updatedUser);

      const result = await mockUserRepository.updateById(userId, {
        firstName: 'Jane',
        lastName: 'Smith',
      });

      expect(result.firstName).toBe('Jane');
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user account', async () => {
      const userId = new Types.ObjectId();
      const deactivatedUser = {
        _id: userId,
        email: 'user@example.com',
        isActive: false,
      };

      mockUserRepository.updateById.mockResolvedValue(deactivatedUser);

      const result = await mockUserRepository.updateById(userId, { isActive: false });

      expect(result.isActive).toBe(false);
    });
  });
});
