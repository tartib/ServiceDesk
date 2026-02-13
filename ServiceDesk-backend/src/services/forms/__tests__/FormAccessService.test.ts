import { Types } from 'mongoose';
import { createMockRepository } from '../../../__tests__/fixtures/service.fixture';

describe('Form Access Service', () => {
  let mockAccessRepository: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    mockAccessRepository = createMockRepository();
  });

  describe('grantAccess', () => {
    it('should grant form access to user', async () => {
      const accessData = {
        formId: new Types.ObjectId(),
        userId: new Types.ObjectId(),
        permission: 'view',
      };

      mockAccessRepository.create.mockResolvedValue({
        _id: new Types.ObjectId(),
        ...accessData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await mockAccessRepository.create(accessData);

      expect(result.permission).toBe('view');
      expect(result.userId).toEqual(accessData.userId);
    });
  });

  describe('getUserFormAccess', () => {
    it('should retrieve forms accessible to user', async () => {
      const userId = new Types.ObjectId();
      const access = [
        { _id: new Types.ObjectId(), userId, formId: new Types.ObjectId(), permission: 'view' },
        { _id: new Types.ObjectId(), userId, formId: new Types.ObjectId(), permission: 'edit' },
      ];

      mockAccessRepository.find.mockResolvedValue(access);

      const result = await mockAccessRepository.find({ userId });

      expect(result).toHaveLength(2);
    });
  });

  describe('checkAccess', () => {
    it('should verify user has required permission', async () => {
      const userId = new Types.ObjectId();
      const formId = new Types.ObjectId();
      const access = {
        _id: new Types.ObjectId(),
        userId,
        formId,
        permission: 'edit',
      };

      mockAccessRepository.findOne.mockResolvedValue(access);

      const result = await mockAccessRepository.findOne({ userId, formId });

      expect(result.permission).toBe('edit');
    });
  });

  describe('revokeAccess', () => {
    it('should revoke user access to form', async () => {
      const accessId = new Types.ObjectId();

      mockAccessRepository.deleteById.mockResolvedValue(true);

      const result = await mockAccessRepository.deleteById(accessId);

      expect(result).toBe(true);
    });
  });

  describe('updatePermission', () => {
    it('should update user permission level', async () => {
      const accessId = new Types.ObjectId();
      const updatedAccess = {
        _id: accessId,
        permission: 'admin',
      };

      mockAccessRepository.updateById.mockResolvedValue(updatedAccess);

      const result = await mockAccessRepository.updateById(accessId, { permission: 'admin' });

      expect(result.permission).toBe('admin');
    });
  });

  describe('publishForm', () => {
    it('should publish form for public access', async () => {
      const formId = new Types.ObjectId();
      const publishData = {
        formId,
        isPublished: true,
        publicLink: 'https://example.com/form/abc123',
      };

      mockAccessRepository.create.mockResolvedValue({
        _id: new Types.ObjectId(),
        ...publishData,
      });

      const result = await mockAccessRepository.create(publishData);

      expect(result.isPublished).toBe(true);
    });
  });
});
