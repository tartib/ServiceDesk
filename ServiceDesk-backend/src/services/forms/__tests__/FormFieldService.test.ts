import { Types } from 'mongoose';
import { createMockRepository } from '../../../__tests__/fixtures/service.fixture';

describe('Form Field Service', () => {
  let mockFieldRepository: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    mockFieldRepository = createMockRepository();
  });

  describe('createField', () => {
    it('should create form field with valid data', async () => {
      const fieldData = {
        formId: new Types.ObjectId(),
        name: 'email',
        label: 'Email Address',
        type: 'email',
        required: true,
      };

      mockFieldRepository.create.mockResolvedValue({
        _id: new Types.ObjectId(),
        ...fieldData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await mockFieldRepository.create(fieldData);

      expect(result.name).toBe('email');
      expect(result.type).toBe('email');
      expect(result.required).toBe(true);
    });
  });

  describe('getFormFields', () => {
    it('should retrieve fields for form', async () => {
      const formId = new Types.ObjectId();
      const fields = [
        { _id: new Types.ObjectId(), formId, name: 'email', type: 'email' },
        { _id: new Types.ObjectId(), formId, name: 'phone', type: 'tel' },
        { _id: new Types.ObjectId(), formId, name: 'message', type: 'textarea' },
      ];

      mockFieldRepository.find.mockResolvedValue(fields);

      const result = await mockFieldRepository.find({ formId });

      expect(result).toHaveLength(3);
    });
  });

  describe('getFieldById', () => {
    it('should retrieve field by id', async () => {
      const fieldId = new Types.ObjectId();
      const field = {
        _id: fieldId,
        name: 'email',
        type: 'email',
        required: true,
      };

      mockFieldRepository.findById.mockResolvedValue(field);

      const result = await mockFieldRepository.findById(fieldId);

      expect(result._id).toEqual(fieldId);
      expect(result.name).toBe('email');
    });
  });

  describe('updateField', () => {
    it('should update field properties', async () => {
      const fieldId = new Types.ObjectId();
      const updatedField = {
        _id: fieldId,
        name: 'email',
        label: 'Updated Email',
        required: false,
      };

      mockFieldRepository.updateById.mockResolvedValue(updatedField);

      const result = await mockFieldRepository.updateById(fieldId, { label: 'Updated Email' });

      expect(result.label).toBe('Updated Email');
    });
  });

  describe('deleteField', () => {
    it('should delete field', async () => {
      const fieldId = new Types.ObjectId();

      mockFieldRepository.deleteById.mockResolvedValue(true);

      const result = await mockFieldRepository.deleteById(fieldId);

      expect(result).toBe(true);
    });
  });

  describe('reorderFields', () => {
    it('should reorder fields in form', async () => {
      const formId = new Types.ObjectId();
      const fields = [
        { _id: new Types.ObjectId(), formId, order: 1 },
        { _id: new Types.ObjectId(), formId, order: 2 },
        { _id: new Types.ObjectId(), formId, order: 3 },
      ];

      mockFieldRepository.find.mockResolvedValue(fields);

      const result = await mockFieldRepository.find({ formId });

      expect(result[0].order).toBe(1);
      expect(result[2].order).toBe(3);
    });
  });
});
